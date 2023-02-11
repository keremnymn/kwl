from pydantic import BaseModel, constr


class KwlForm(BaseModel):
    Know: constr(max_length=100)
    Learned: constr(max_length=100)
    WanttoLearn: constr(max_length=100)
    topic: constr(max_length=50)
    remindDays: int | None = None


class PinInfo(BaseModel):
    pin: int


class InfoForWSToken(BaseModel):
    pin: int
    uuid: str
    authToken: str | None


class WebsocketMessage(BaseModel):
    user_id: int | None
    stage: int
    name_and_surname: str | None
    ticket_id: int
    content: constr(max_length=2000)
