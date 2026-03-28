from sqlalchemy import String, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base
import datetime
from datetime import timedelta
from typing import Optional, List

class Conversation(Base):
    __tablename__ = "conversations"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    other_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    last_message: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    last_message_time: Mapped[datetime.datetime] = mapped_column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone(timedelta(hours=5, minutes=30))))
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone(timedelta(hours=5, minutes=30))))

    user: Mapped["User"] = relationship("User", foreign_keys=[user_id])
    other_user: Mapped["User"] = relationship("User", foreign_keys=[other_user_id])


class Message(Base):
    __tablename__ = "messages"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    content: Mapped[str] = mapped_column(String(255))
    timestamp: Mapped[datetime.datetime] = mapped_column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone(timedelta(hours=5, minutes=30))))
    sender_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    group_id: Mapped[Optional[int]] = mapped_column(ForeignKey("groups.id"), nullable=True)
    recipient_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"), nullable=True)
    reply_to_id: Mapped[Optional[int]] = mapped_column(nullable=True)
    reply_to_content: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    reply_to_sender: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    sender: Mapped["User"] = relationship("User", foreign_keys=[sender_id])
    recipient: Mapped["User"] = relationship("User", foreign_keys=[recipient_id])
    group: Mapped["Group"] = relationship("Group", back_populates="messages")

class Group(Base):
    __tablename__ = "groups"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255))
    created_by: Mapped[int] = mapped_column(ForeignKey("users.id"))
    # last_message: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    # last_message_time: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, 
    default=lambda: datetime.datetime.now(datetime.timezone(timedelta(hours=5, minutes=30))), nullable=True)

    members: Mapped[List["GroupMember"]] = relationship("GroupMember", back_populates="group", cascade="all, delete-orphan")
    messages: Mapped[List["Message"]] = relationship("Message", back_populates="group", cascade="all, delete-orphan")

class GroupMember(Base):
    __tablename__ = "group_members"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    group_id: Mapped[int] = mapped_column(ForeignKey("groups.id"))
    
    user: Mapped["User"] = relationship("User", back_populates="group_memberships")
    group: Mapped["Group"] = relationship("Group", back_populates="members")

class VideoCall(Base):
    __tablename__ = "video_calls"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    caller_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    receiver_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    call_type: Mapped[str] = mapped_column(String(50)) # 'audio' or 'video'
    status: Mapped[str] = mapped_column(String(50)) # 'started', 'completed', 'missed', 'rejected'
    start_time: Mapped[datetime.datetime] = mapped_column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone(timedelta(hours=5, minutes=30))).replace(tzinfo=None))
    end_time: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime, nullable=True)
    duration: Mapped[Optional[int]] = mapped_column(nullable=True) # in seconds

    caller: Mapped["User"] = relationship("User", foreign_keys=[caller_id])
    receiver: Mapped["User"] = relationship("User", foreign_keys=[receiver_id])
