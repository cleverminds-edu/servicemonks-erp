from pydantic import BaseModel


class LoginRequest(BaseModel):
    employee_id: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    employee_id: str
    name: str
    role: str
    email: str
