from pydantic import BaseModel


class ReceivedToken(BaseModel):
    token: str


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    email: str | None = None
