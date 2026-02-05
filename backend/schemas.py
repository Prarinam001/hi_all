from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional, List
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str
    full_name: str
    phone_number: Optional[str] = None

class UserLogin(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    full_name: str
    phone_number: Optional[str]
    is_active: bool

    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class MessageBase(BaseModel):
    content: str

class MessageCreate(MessageBase):
    recipient_email: Optional[str] = None # For DM
    group_id: Optional[int] = None # For Group

class MessageC(MessageBase):
    pass

class MessageResponse(MessageBase):
    id: int
    sender_id: int
    recipient_id: Optional[int]
    group_id: Optional[int]
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)

class GroupCreate(BaseModel):
    name: str
    member_emails: List[str] = []

class GroupResponse(BaseModel):
    id: int
    name: str
    created_by: int
    
    model_config = ConfigDict(from_attributes=True)

class ConversationCreate(BaseModel):
    other_user_id: int
    last_message: str

class ConversationResponse(BaseModel):
    id: int
    other_user_id: int
    last_message: Optional[str]
    last_message_time: datetime
    created_at: datetime
    other_user_name: Optional[str] = None
    other_user_email: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
