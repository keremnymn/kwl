from fastapi import Request, WebSocket, status, Depends
from jose import jwt
from main import get_settings
from config import Settings


async def decode_token(token: str, secret_key: str, algorithm: str):
    return jwt.decode(token, secret_key, algorithms=[algorithm])


async def check_token(
    websocket: WebSocket, token: str, settings: Settings = Depends(get_settings)
) -> dict:
    try:
        token = await decode_token(token, settings.ws_secret_key, settings.algorithm)
    except:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)

    return token


async def get_ws_address(uuid: str, token: str, request: Request):
    if "https://" in get_settings().api_address:
        head = "wss://kwl.app"
    else:
        head = "ws://localhost:8000"
    return f"{head}/api/kwl/ticket-ws/{uuid}?token={token}"
