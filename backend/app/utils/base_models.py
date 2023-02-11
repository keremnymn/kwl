from datetime import datetime
from fastapi import WebSocket, WebSocketDisconnect
from typing import List
import aioredis, asyncio
from aioredis.client import PubSub, Redis


class RequestAttempt:
    def __init__(
        self,
        request_attempt=(
            0,
            datetime.now().strftime("%m-%d-%Y, %H:%M:%S"),
        ),
        limit=5,
        attempt_type="login_attempt",
    ):
        self.attempt_type: str = attempt_type
        self.limit: int = limit
        self.duration_limit: int = 120  # in seconds
        self.to_str_model: str = "%m-%d-%Y, %H:%M:%S"
        self.request_attempt: tuple[int, str] = request_attempt

    async def update_attempt(self) -> dict:

        if (
            self.request_attempt[0] > self.limit
            and await self.last_attempt > self.duration_limit
        ):
            await self.reset_attempt()

        self.request_attempt = (
            self.request_attempt[0] + 1,
            datetime.now().strftime(self.to_str_model),
        )

        return await self.current_state()

    async def reset_attempt(self) -> None:
        self.request_attempt = (
            0,
            datetime.now().strftime(self.to_str_model),
        )

    async def current_state(self) -> dict:
        return {self.attempt_type: self.request_attempt}

    @property
    def type(self) -> str:
        return self.attempt_type

    @property
    async def last_attempt(self) -> datetime:
        return abs(
            datetime.now()
            - datetime.strptime(self.request_attempt[1], self.to_str_model)
        ).seconds

    @property
    async def is_prevented(self) -> bool:
        try:
            request_attempt = self.request_attempt[0]
        except KeyError:
            request_attempt = self.request_attempt[self.attempt_type][0]

        return (
            True
            if request_attempt > self.limit
            and await self.last_attempt < self.duration_limit
            else False
        )


class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.shut_down_message = '{"0__Command":{"0__shutDown":true}}'

    async def connect(self, uuid: str, websocket: WebSocket, token: dict):
        await websocket.accept()
        self.active_connections.append(websocket)
        await self.redis_connector(uuid, websocket, token)

    async def get_redis_pool(self):
        return await aioredis.from_url(
            f"redis://localhost", encoding="utf-8", decode_responses=True
        )

    async def redis_connector(self, uuid: str, websocket: WebSocket, token: dict):
        async def consumer_handler(conn: Redis, ws: WebSocket, token: dict):
            try:
                while True:
                    message = await ws.receive_text()
                    if message == "command: __ShutDownTicket" and token.get("isOwner"):
                        await conn.publish(uuid, self.shut_down_message)
                    else:
                        await conn.publish(uuid, message)
            except WebSocketDisconnect as e:
                print(e)

        async def producer_handler(pubsub: PubSub, ws: WebSocket):
            await pubsub.subscribe(uuid)

            try:
                while True:
                    message = await pubsub.get_message(ignore_subscribe_messages=True)
                    if message:
                        await ws.send_text(message.get("data"))
            except Exception as exc:
                await ws.close()
                print(exc)

        conn = await self.get_redis_pool()
        pubsub = conn.pubsub()

        consumer_task = consumer_handler(conn=conn, ws=websocket, token=token)
        producer_task = producer_handler(pubsub=pubsub, ws=websocket)
        done, pending = await asyncio.wait(
            [consumer_task, producer_task],
            return_when=asyncio.FIRST_COMPLETED,
        )
        print(f"Done task: {done}")
        for task in pending:
            print(f"Canceling task: {task}")
            task.cancel()
