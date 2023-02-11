from jose import JWTError, jwt
from passlib.context import CryptContext
from datetime import datetime, timedelta

from fastapi import Depends, HTTPException, status, BackgroundTasks, Request
from fastapi.security import OAuth2PasswordBearer

from data_models.users import GoogleToken, UserInDB
from data_models.base import TokenData, ReceivedToken
from utils.base_models import RequestAttempt
from utils import constants
from main import get_settings, get_db

import re, aiohttp

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


async def parse_scopes(scopes):
    return dict(re.findall("(\S+)\s*:\s*(.*?)\s*(?=\S+\s*:|$)", " ".join(scopes[:1])))


def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password):
    return pwd_context.hash(password)


async def get_user(email: str) -> UserInDB:
    command = """select firstname, lastname, is_admin, email, image_file, id, password, is_confirmed, is_banned from "user" where email = $1;"""
    result = await get_db().fetch_rows(command, email)
    if result:
        user = result[0]
        user_dict = {
            "firstName": user["firstname"],
            "lastName": user["lastname"],
            "is_admin": user["is_admin"],
            "email": user["email"],
            "image_file": user["image_file"],
            "password": user["password"],
            "id": int(user["id"]),
            "is_confirmed": user["is_confirmed"],
            "is_banned": user["is_banned"],
        }
        return UserInDB(**user_dict)


async def create_jwt_token(
    data: dict,
    secret_key: str,
    expires_delta: timedelta | None = None,
) -> str:
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)

    to_encode.update({"exp": expire})
    settings = get_settings()

    encoded_jwt = jwt.encode(to_encode, secret_key, algorithm=settings.algorithm)
    return encoded_jwt


async def get_current_user(
    token: str = Depends(oauth2_scheme), settings=Depends(get_settings)
) -> UserInDB:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authanticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            token, settings.secret_key, algorithms=[settings.algorithm]
        )

        if payload.get("sub") is None:
            raise credentials_exception

        token_data = TokenData(email=payload.get("sub"))
    except JWTError:
        raise credentials_exception

    if datetime.now() > datetime.fromtimestamp(payload.get("exp")):
        raise HTTPException(
            status_code=status.HTTP_408_REQUEST_TIMEOUT,
            details="Session expired, you need to login again.",
        )

    user = await get_user(token_data.email)
    if user is None:
        raise credentials_exception
    return user


async def check_token_expiration(token: ReceivedToken, settings=Depends(get_settings)):
    try:
        payload = jwt.decode(
            token.token, settings.secret_key, algorithms=[settings.algorithm]
        )

        response = datetime.utcnow() < datetime.fromtimestamp(payload.get("exp"))
        if not response:
            return False

        return payload.get("email")
    except Exception as e:
        print(e)
        return False


async def confirm_user_in_db(email: str) -> bool:
    try:
        query = """update "user" set is_confirmed = true where email = $1;"""

        await get_db().execute(query, email)
        return True
    except Exception as e:
        print(e)
        return False


async def create_token_and_queue_email(
    email: str,
    background_tasks: BackgroundTasks,
    callback: callable,
    url_head: str,
    key: str,
    minutes: int = 15,
) -> None:
    try:
        token = await create_jwt_token(
            {"email": email}, get_settings().secret_key, timedelta(minutes=minutes)
        )

        background_tasks.add_task(callback, email, url_head + token, key)
    except Exception as e:
        print(e)
        raise e


async def build_request_attempt(
    request: Request, attempt_type: str, limit=5
) -> RequestAttempt:
    if not request.session.get(attempt_type):
        attempt: RequestAttempt = RequestAttempt(limit=limit, attempt_type=attempt_type)
        request.session[attempt_type] = await attempt.current_state()
    else:
        attempt: RequestAttempt = RequestAttempt(
            **{
                "request_attempt": request.session[attempt_type],
                "limit": limit,
                "attempt_type": attempt_type,
            }
        )
    if await attempt.is_prevented:
        del attempt
        raise HTTPException(
            status_code=429,
            detail=f"Too many {constants.limit_request_warnings[attempt_type]}. Please wait for two minutes.",
        )
    return attempt


# only for routes. "Depends" can't be used for non-FastAPI functions.
async def get_current_active_user(
    current_user: UserInDB = Depends(get_current_user),
) -> UserInDB:
    if current_user.is_banned or not current_user.is_confirmed:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="User is not permitted."
        )
    return current_user


async def increment_attempt(attempt: RequestAttempt, request: Request) -> None:
    attempt_state = await attempt.update_attempt()
    request.session[attempt.type] = attempt_state[attempt.type]
    del attempt


async def build_login_response(
    hours: int,
    user: UserInDB,
    secret_key: str,
    request: Request,
    attempt: RequestAttempt,
) -> dict:
    access_token_expires = timedelta(hours=hours)
    access_token = await create_jwt_token(
        data={"sub": user.email},
        secret_key=secret_key,
        expires_delta=access_token_expires,
    )

    del attempt
    request.session.clear()

    return {
        "access_token": access_token,
        "email": user.email,
        "id": user.id,
        "valid_until": datetime.now() + access_token_expires,
        "image_file": user.image_file,
    }


async def get_info_from_google(form_data: GoogleToken) -> str:
    received_info = None
    async with aiohttp.ClientSession() as session:
        async with session.get(
            form_data.data_endpoint,
            headers={"Authorization": f"Bearer {form_data.access_token}"},
        ) as resp:
            received_info = await resp.text()
    return received_info
