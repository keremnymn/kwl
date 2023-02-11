from datetime import datetime, timedelta
from fastapi import (
    APIRouter,
    Request,
    Depends,
    HTTPException,
    status,
    BackgroundTasks,
    UploadFile,
    File,
    Form,
)
from fastapi.responses import ORJSONResponse
from fastapi.security import OAuth2PasswordRequestForm

from data_models.users import (
    User,
    NewPassword,
    UserInDB,
    ProfileInfo,
    GoogleToken,
    ReceivedGoogleInfo,
)
from data_models.base import ReceivedToken, TokenData
from utils.users import (
    get_info_from_google,
    get_password_hash,
    check_token_expiration,
    get_user,
    verify_password,
    confirm_user_in_db,
    create_token_and_queue_email,
    parse_scopes,
    build_request_attempt,
    get_current_active_user,
    increment_attempt,
    build_login_response,
)
from utils.mails import dispatch_email_info
from utils.blog import delete_from_bucket, run_image_uploader
from utils.constants import s3_public_head
from main import get_db, get_api_address, get_settings
from config import Settings

import orjson

router = APIRouter(prefix="/api/users", tags=["users"])
api_address = get_api_address()


@router.post("/sign-in", response_class=ORJSONResponse)
async def login_for_access_token(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    settings: Settings = Depends(get_settings),
):

    attempt = await build_request_attempt(request, "login_attempt")
    user = await get_user(form_data.username)

    if not user or not verify_password(form_data.password, user.password):
        await increment_attempt(attempt, request)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_confirmed:
        del attempt
        raise HTTPException(
            status_code=status.HTTP_406_NOT_ACCEPTABLE, detail="Email is not confirmed"
        )

    scopes = await parse_scopes(form_data.scopes)
    response = await build_login_response(
        hours=24 if not scopes["remember"] else 720,
        user=user,
        secret_key=settings.secret_key,
        request=request,
        attempt=attempt,
    )
    return response


@router.post("/login-with-google", response_class=ORJSONResponse)
async def login_with_google(
    request: Request,
    form_data: GoogleToken,
    settings: Settings = Depends(get_settings),
):
    attempt = await build_request_attempt(request, "login_attempt")
    received_info = await get_info_from_google(form_data)

    error = HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST, detail="Login attempt failed."
    )

    try:
        received_info = ReceivedGoogleInfo(**orjson.loads(received_info))
    except:
        await increment_attempt(attempt, request)
        raise error

    user = await get_user(received_info.email)
    if not user:
        await increment_attempt(attempt, request)
        raise error

    response = await build_login_response(
        hours=720,
        user=user,
        secret_key=settings.secret_key,
        request=request,
        attempt=attempt,
    )
    return response


@router.post("/signup-with-google", response_class=ORJSONResponse)
async def signup_with_google(form_data: GoogleToken, background_tasks: BackgroundTasks):
    received_info: str = await get_info_from_google(form_data)
    received_info: ReceivedGoogleInfo = ReceivedGoogleInfo(
        **orjson.loads(received_info)
    )

    sign_up_info = User(
        **{
            "firstName": received_info.given_name,
            "lastName": received_info.family_name,
            "email": received_info.email,
            "password": None,
            "email_subscription": True,
            "type": "google",
        }
    )
    await sign_up(sign_up_info, background_tasks)


@router.post("/sign-up", response_class=ORJSONResponse)
async def sign_up(
    form_data: User,
    background_tasks: BackgroundTasks,
):
    user = await get_user(form_data.email)
    if user:
        raise HTTPException(
            status_code=status.HTTP_406_NOT_ACCEPTABLE,
            detail="This email is already in use.",
        )

    try:
        password = (
            get_password_hash(form_data.password)
            if form_data.type == "normal"
            else form_data.password
        )

        command = """insert into "user" (
                                            firstname, 
                                            lastname, 
                                            email, 
                                            password, 
                                            email_subscription, 
                                            account_type, 
                                            is_confirmed
                                        ) 
                                values($1, $2, $3, $4, $5, $6, $7);"""

        await get_db().execute(
            command,
            form_data.firstName,
            form_data.lastName,
            form_data.email,
            password,
            form_data.email_subscription,
            form_data.type,
            True if form_data.type == "google" else False,
        )
        if form_data.type == "normal":
            await create_token_and_queue_email(
                form_data.email,
                background_tasks,
                dispatch_email_info,
                f"{api_address}sign-in?token=",
                "confirmMail",
            )
        return {}
    except Exception as e:
        print(e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unknown error occurred.",
        )


@router.post("/late-confirm-email", response_class=ORJSONResponse)
async def late_confirm_email(userData: TokenData, background_tasks: BackgroundTasks):
    try:
        await create_token_and_queue_email(
            userData.email,
            background_tasks,
            dispatch_email_info,
            f"{api_address}sign-in?token=",
            "confirmMail",
        )
        return {"status_code": 200}
    except Exception as e:
        print(e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unknown error occurred.",
        )


@router.post("/confirm-email", response_class=ORJSONResponse)
async def confirm_email(
    token: ReceivedToken, email: bool = Depends(check_token_expiration)
):
    if email:
        confirmed = await confirm_user_in_db(email)

        if confirmed:
            return {"details": "accepted"}
        else:
            raise HTTPException(status_code=500, detail="Unexpected error.")

    else:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="The confirmation token has expired.",
        )


@router.post("/check-reset-password", status_code=200)
async def check_reset_password(
    token: ReceivedToken,
    email: bool = Depends(check_token_expiration),
):
    if not email:
        raise HTTPException(status.HTTP_408_REQUEST_TIMEOUT)

    return email


@router.post("/reset-password", status_code=200, response_class=ORJSONResponse)
async def reset_password(
    form_data: NewPassword,
    token: ReceivedToken,
    email: bool = Depends(check_token_expiration),
):
    if not email:
        raise HTTPException(
            status_code=status.HTTP_408_REQUEST_TIMEOUT,
            detail="Invalid token, or the token has expired.",
        )

    user = await get_user(email)

    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)

    if form_data.password0 != form_data.password1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Passwords don't match."
        )

    try:
        password = get_password_hash(form_data.password0[:30])

        command = """update "user" set password = $1 where email = $2;"""

        await get_db().execute(
            command,
            password,
            email,
        )
    except Exception as e:
        print(e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unknown error occurred.",
        )


@router.put("/change-profile-image", status_code=200, response_class=ORJSONResponse)
async def change_profile_image(
    request: Request,
    image: UploadFile = File(),
    currentImage: str = Form(),
    current_user: UserInDB = Depends(get_current_active_user),
):
    if s3_public_head in currentImage and currentImage.endswith(".webp"):
        await delete_from_bucket(currentImage)

    s3_public_url = await run_image_uploader(request, image, "profile-images")
    await get_db().execute(
        """update "user" set image_file = $1 where id = $2;""",
        s3_public_url,
        current_user.id,
    )
    return s3_public_url


@router.put("/change-profile-info", status_code=200, response_class=ORJSONResponse)
async def change_profile_info(
    newInfo: ProfileInfo,
    current_user: UserInDB = Depends(get_current_active_user),
):
    try:
        command = """update "user" set firstname = $1, lastname = $2, email_subscription = $3 where id = $4;"""
        await get_db().execute(
            command,
            newInfo.firstname,
            newInfo.lastname,
            newInfo.email_subscription,
            current_user.id,
        )
        return newInfo
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unknown error occurred.",
        )


@router.get("/get-user-info", status_code=200, response_class=ORJSONResponse)
async def get_user_info(
    current_user: UserInDB = Depends(get_current_active_user),
):
    command = """select firstname, lastname, email, created_on, email_subscription from "user" where id = $1;"""
    result = await get_db().fetch_rows(command, current_user.id)
    return result


@router.post("/reset-password-email", status_code=200, response_class=ORJSONResponse)
async def reset_password_email(
    form_data: TokenData, background_tasks: BackgroundTasks, request: Request
):
    attempt = await build_request_attempt(request, "pw_reset_request_attempt", limit=2)

    attempt_state = await attempt.update_attempt()
    request.session["pw_reset_request_attempt"] = attempt_state[
        "pw_reset_request_attempt"
    ]
    user = await get_user(form_data.email)

    if not user:
        del attempt
        return {}  # user not found but no need to inform the client about that.

    try:
        await create_token_and_queue_email(
            form_data.email,
            background_tasks,
            dispatch_email_info,
            f"{api_address}reset-password?token=",
            "resetPassword",
        )
        del attempt
        return {}
    except Exception as e:
        print(e)
        del attempt
        raise e
