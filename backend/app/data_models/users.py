from pydantic import BaseModel, constr, validator


class NewPassword(BaseModel):
    password0: str
    password1: str


class User(BaseModel):
    firstName: constr(max_length=150)
    lastName: constr(max_length=150)
    email: constr(max_length=320)
    password: constr(max_length=40) | None
    email_subscription: bool | None = None
    is_confirmed: bool | None = None
    is_banned: bool | None = None
    type: constr(max_length=20)


class UserInDB(BaseModel):
    id: int
    is_admin: str | None
    password: str | None
    firstName: str
    lastName: str
    email: str
    is_confirmed: bool
    is_banned: bool
    image_file: str | None


class ProfileInfo(BaseModel):
    firstname: str
    lastname: str
    email_subscription: bool | None


class GoogleToken(BaseModel):
    access_token: str
    data_endpoint: str


class GoogleSignUp(BaseModel):
    familyName: constr(max_length=30)
    givenName: constr(max_length=30)
    email: constr(max_length=30)


class ReceivedGoogleInfo(BaseModel):
    sub: str
    name: str
    given_name: str
    family_name: str
    picture: str
    email: str
    email_verified: bool
    locale: str

    @validator("email_verified", pre=True)
    def verify_if_exists(cls, value):
        return value == True
