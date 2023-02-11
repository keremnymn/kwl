from pydantic import BaseModel, constr


class NewTag(BaseModel):
    value: constr(max_length=100)
    label: constr(max_length=100)
