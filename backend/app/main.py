from fastapi import FastAPI
from functools import lru_cache
from starlette.middleware.sessions import SessionMiddleware
import uvicorn, os

from database import Database
from config import Settings

app = FastAPI()


@app.on_event("startup")
async def startup_event():
    settings: Settings = get_settings()

    database_instance = Database(
        settings.db_connection["user"],
        settings.db_connection["password"],
        settings.db_connection["host"],
        settings.db_connection["db"],
    )
    await database_instance.connect()
    app.state.db: Database = database_instance

    app.add_middleware(SessionMiddleware, secret_key=settings.secret_key)

    from routers import users, kwl, blog

    for router in [users.router, kwl.router, blog.router]:
        app.include_router(router)

    temp_folder = os.path.join(os.getcwd(), "app", "temp")
    if not os.path.isdir(temp_folder):
        os.makedirs(temp_folder)

    print("Server Startup")


@app.on_event("shutdown")
async def shutdown_event():
    if not app.state.db:
        await app.state.db.close()
    print("Server Shutdown")


@lru_cache
def get_settings():
    return Settings()


@lru_cache
def get_api_address() -> str:
    return get_settings().api_address


def get_db() -> Database:
    return app.state.db


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        reload=False if "https" in get_settings().api_address else True,
        host="localhost",
        port=8000,
    )
