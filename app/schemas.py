from pydantic import BaseModel
from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    username: str = Field(min_length=3, max_length=30)
    email: EmailStr
    display_name: str = Field(min_length=2, max_length=50)
    password: str = Field(min_length=6)
    confirm_password: str = Field(min_length=6)

class Token(BaseModel):
    access_token: str
    token_type: str

class PostCreate(BaseModel):
    title: str
    content: str

