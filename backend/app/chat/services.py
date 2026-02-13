from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from fastapi import Depends, HTTPException, WebSocket, WebSocketDisconnect, status
from typing import List

from app.chat.utils import ConnectionManager
from app.chat.models import Group, GroupMember, Message
from app.chat.schemas import GroupCreate, GroupResponse
from app.account.models import User
import json

manager = ConnectionManager()

async def create_group(session: AsyncSession, group_data: GroupCreate, current_user: User):
    # Create group
    new_group = Group(name=group_data.name, created_by=current_user.id)
    session.add(new_group)
    await session.commit()
    await session.refresh(new_group)

    # Add creator as member
    member = GroupMember(user_id=current_user.id, group_id=new_group.id)
    session.add(member)

    # Add other members by email
    for email in group_data.member_emails:
        stmt = select(User).where(User.email == email)
        result = await session.scalars(stmt)
        user = result.first()
        if user:
            member = GroupMember(user_id=user.id, group_id=new_group.id)
            session.add(member)
    
    await session.commit()
    
    # Re-fetch with eager load for response
    stmt = select(Group).options(
        selectinload(Group.members).selectinload(GroupMember.user)
    ).where(Group.id == new_group.id)
    result = await session.scalars(stmt)
    return result.first()

async def get_user_groups(session: AsyncSession, current_user: User):
    # Get groups where user is a member
    stmt = select(Group).options(
        selectinload(Group.members).selectinload(GroupMember.user)
    ).join(GroupMember).where(GroupMember.user_id == current_user.id)
    result = await session.scalars(stmt)
    return result.unique().all()

async def get_group_members(session: AsyncSession, group_id: int):
    stmt = select(User.id).join(GroupMember).where(GroupMember.group_id == group_id)
    result = await session.scalars(stmt)
    return result.all()

async def get_conversations(session: AsyncSession, current_user: User):
    # This is a bit complex as we need to fetch conversations from messages or a Conversations table
    # But earlier I saw a Conversations table in models.py
    from app.chat.models import Conversation
    stmt = select(Conversation).where(
        (Conversation.user_id == current_user.id) | (Conversation.other_user_id == current_user.id)
    ).order_by(Conversation.last_message_time.desc())
    result = await session.scalars(stmt)
    return result.all()

async def build_connection_for_conversation(websocket: WebSocket, user_id: int, session: AsyncSession):
    await manager.connect(websocket, user_id)
    try:
        while True:
            try:
                data = await websocket.receive_text()
            except WebSocketDisconnect:
                break
            except Exception:
                break

            try:
                msg_data = json.loads(data)
                target_id = msg_data.get("target_id")
                group_id = msg_data.get("group_id")
                
                # Save message to DB? (Optional for now, but good for history)
                # For this task, we focus on relaying 

                if group_id:
                    # Broadcast to group members
                    members = await get_group_members(session, int(group_id))
                    await manager.broadcast_to_users(json.dumps(msg_data), members)
                elif target_id:
                    await manager.send_personal_message(json.dumps(msg_data), int(target_id))
            except Exception as e:
                print(f"Error handling message: {e}")

    finally:
        manager.disconnect(user_id)