from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
from database import Base
import datetime

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    full_name = Column(String)
    phone_number = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)

    messages_sent = relationship("Message", foreign_keys="Message.sender_id", back_populates="sender")
    memberships = relationship("GroupMember", back_populates="user")

class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    content = Column(String)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    sender_id = Column(Integer, ForeignKey("users.id"))
    group_id = Column(Integer, ForeignKey("groups.id"), nullable=True) # If null, it's a DM (wait, logic for DM usually involves a room or direct recipient. For simplicity in this schema, let's assume all chats happen in a 'context' or strict DM logic. Let's add recipient_id for DM)
    recipient_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    sender = relationship("User", foreign_keys=[sender_id], back_populates="messages_sent")
    
    # We won't set up the reverse relationship for recipient to avoid clutter/circular issues unless needed.

class Group(Base):
    __tablename__ = "groups"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    created_by = Column(Integer, ForeignKey("users.id"))
    
    members = relationship("GroupMember", back_populates="group")

class GroupMember(Base):
    __tablename__ = "group_members"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    group_id = Column(Integer, ForeignKey("groups.id"))
    
    user = relationship("User", back_populates="memberships")
    group = relationship("Group", back_populates="members")

class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    other_user_id = Column(Integer, ForeignKey("users.id"), index=True)
    last_message = Column(String, nullable=True)
    last_message_time = Column(DateTime, default=datetime.datetime.utcnow)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", foreign_keys=[user_id])
    other_user = relationship("User", foreign_keys=[other_user_id])
