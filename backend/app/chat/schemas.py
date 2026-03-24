from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime

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
    reply_to_id: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)

class GroupCreate(BaseModel):
    name: str
    member_emails: List[str] = []

class AddMemberRequest(BaseModel):
    email: str

from app.account.schemas import UserOut

class GroupMemberResponse(BaseModel):
    user: UserOut
    
    model_config = ConfigDict(from_attributes=True)

class GroupResponse(BaseModel):
    id: int
    name: str
    created_by: int
    last_message: Optional[str] = None
    last_message_time: Optional[datetime] = None
    members: List[GroupMemberResponse] = []
    
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

class MessageAck(BaseModel):
    message_ids: List[int]
