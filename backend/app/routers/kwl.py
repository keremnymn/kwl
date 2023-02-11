from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
    WebSocket,
    Request,
)
from fastapi.responses import ORJSONResponse

from utils.users import (
    get_current_active_user,
    create_jwt_token,
    build_request_attempt,
    increment_attempt,
)
from utils.kwl import check_token, get_ws_address
from utils.base_models import ConnectionManager
from main import get_db, get_settings
from config import Settings

from data_models.kwl import KwlForm, PinInfo, WebsocketMessage, InfoForWSToken
from data_models.users import UserInDB

from datetime import datetime, timedelta

router = APIRouter(prefix="/api/kwl", tags=["kwl"])
manager = ConnectionManager()


@router.post("/add-ticket", status_code=200, response_class=ORJSONResponse)
async def add_ticket(
    form_data: KwlForm,
    current_user: UserInDB = Depends(get_current_active_user),
):
    try:
        remind_date = (
            datetime.now() + timedelta(days=form_data.remindDays)
            if form_data.remindDays
            else None
        )

        command = """insert into ticket (user_id, know, want_to_learn, learned, topic, remind_date) values($1, $2, $3, $4, $5, $6);"""

        await get_db().execute(
            command,
            current_user.id,
            form_data.Know,
            form_data.WanttoLearn,
            form_data.Learned,
            form_data.topic,
            remind_date,
        )
    except Exception as e:
        print(e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unknown error occurred.",
        )


@router.get("/get-tickets", status_code=200, response_class=ORJSONResponse)
async def get_tickets(
    current_user: UserInDB = Depends(get_current_active_user),
):
    command = """select id, remind_date, topic from ticket where user_id = $1 order by created_on desc;"""
    result = await get_db().fetch_rows(command, current_user.id)

    return result


@router.delete("/delete-ticket", status_code=200, response_class=ORJSONResponse)
async def delete_ticket(
    id: int,
    current_user: UserInDB = Depends(get_current_active_user),
):
    # will delete the ticket entry if user's id equals to the ticket's user_id.
    # will skip without informing the user if the information doesn't match.
    try:
        command = """select * from delete_ticket($1, $2);"""

        await get_db().execute(
            command,
            current_user.id,
            int(id),
        )

        return {}
    except Exception as e:
        print(e)
        raise HTTPException(
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unknown error occurred.",
        )


@router.post("/get-ticket-info", status_code=200, response_class=ORJSONResponse)
async def get_ticket_info(
    ticket_id: int,
    current_user: UserInDB = Depends(get_current_active_user),
):
    command = """select user_id, know, want_to_learn, learned, topic from ticket where id = $1;"""
    result = await get_db().fetch_rows(command, int(ticket_id))

    if not result:
        return HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unknown error occurred.",
        )

    if result[0]["user_id"] != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authorized to see this ticket.",
        )
    return dict(result[0])


@router.put("/start-ticket", status_code=200, response_class=ORJSONResponse)
async def start_ticket(
    ticket_id: int,
    current_user: UserInDB = Depends(get_current_active_user),
):
    command = """select * from create_unique_pin_and_uuid($1, $2);"""
    try:
        result = await get_db().fetch_rows(command, int(ticket_id), current_user.id)
    except:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized to manipulate this ticket.",
        )

    try:
        result = dict(result[0])
        result.update({"user_id": current_user.id})
    except:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found."
        )

    return result


@router.post("/get-ticket-uuid", status_code=200, response_class=ORJSONResponse)
async def get_ticket_uuid(pin_info: PinInfo, request: Request):
    attempt = await build_request_attempt(request, "kwl-pin", limit=7)
    command = """select id, uuid from ticket where on_air = true and pin = $1;"""

    try:
        result = await get_db().fetch_rows(command, pin_info.pin)
    except Exception as e:
        print(e)
        await increment_attempt(attempt, request)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unknown error occurred.",
        )

    if not result:
        await increment_attempt(attempt, request)
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found.")

    return dict(result[0])


@router.put("/shut-down-ticket", status_code=200, response_class=ORJSONResponse)
async def shut_down_ticket(
    ticketID: int,
    uuid: str,
    request: Request,
    settings: Settings = Depends(get_settings),
    current_user: UserInDB = Depends(get_current_active_user),
):

    try:
        command = """select * from remove_ticket_from_air($1, $2);"""

        await get_db().execute(
            command,
            int(current_user.id),
            int(ticketID),
        )
    except Exception as e:
        print(e)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User is not the owner.",
        )

    token = await create_jwt_token(
        {"isOwner": True}, settings.ws_secret_key, timedelta(hours=24)
    )
    ws_address = await get_ws_address(uuid, token, request)
    return ws_address


@router.put("/change-stage", status_code=200, response_class=ORJSONResponse)
async def change_stage(
    ticketID: int,
    newStage: int,
    current_user: UserInDB = Depends(get_current_active_user),
):
    command = """select * from change_stage_of_ticket($1, $2, $3);"""

    try:
        await get_db().execute(
            command, int(current_user.id), int(ticketID), int(newStage)
        )
    except Exception as e:
        print(e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unknown error occurred.",
        )


@router.put("/extend-ticket-duration", status_code=200, response_class=ORJSONResponse)
async def extend_ticket_duration(
    ticketID: int,
    current_user: UserInDB = Depends(get_current_active_user),
):
    command = """update ticket set valid_until = now() + '24 hours'::interval where id = $1;"""

    try:
        await get_db().execute(
            command,
            int(ticketID),
        )
    except Exception as e:
        print(e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unknown error occurred.",
        )

    return {}


@router.post("/token-for-ws", status_code=200, response_class=ORJSONResponse)
async def token_for_ws(
    info: InfoForWSToken, settings: Settings = Depends(get_settings)
):
    command = """select * from get_ticket_info($1, $2);"""

    result = await get_db().fetch_rows(command, info.uuid, info.pin)

    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found."
        )

    if info.authToken:
        # write a logic that if the auth token is expiring in less than two hours,
        # extend it to 5 hours. so that users don't get unauthenticated in the middle
        # of the kwl room.
        pass

    token = await create_jwt_token(
        info.dict(), settings.ws_secret_key, timedelta(hours=24)
    )

    return {"token": token, "data": dict(result[0])}


@router.post("/message-for-ws", status_code=200, response_class=ORJSONResponse)
async def message_for_ws(message: WebsocketMessage):
    command = """select * from insert_message_for_ticket($1, $2, $3, $4, $5);"""

    try:
        result = await get_db().fetch_rows(
            command,
            message.ticket_id,
            message.stage,
            message.content,
            message.name_and_surname,
            message.user_id,
        )
        data = dict(result[0])
    except:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found."
        )

    return {
        "stage": message.stage,
        "sender": data["current_name_and_surname"],
        "content": message.content,
        "messageID": data["current_id"],
    }


@router.websocket("/ticket-ws/{uuid}")
async def ticket_ws(
    websocket: WebSocket, uuid: str, token: dict = Depends(check_token)
):
    await manager.connect(uuid, websocket, token)
