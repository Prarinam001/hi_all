from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload, aliased
from fastapi import Depends, HTTPException, WebSocket, WebSocketDisconnect, status
from typing import List
from app.chat.models import Conversation, Group, GroupMember, Message
from app.account.models import User
from app.chat.schemas import GroupCreate, GroupResponse
from app.chat.utils import ConnectionManager
import json
import datetime
from sqlalchemy import or_, and_


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

async def add_member_to_group(session: AsyncSession, group_id: int, email: str, current_user: User):
    # Verify group exists and current user is creator
    stmt = select(Group).where(Group.id == group_id)
    result = await session.scalars(stmt)
    group = result.first()
    
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    if group.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Only the creator can add members")
    if group.created_by == current_user.id:
        raise HTTPException(status_code=409, detail="You are already a group creator")
    # Find user to add
    user_stmt = select(User).where(User.email == email)
    u_res = await session.scalars(user_stmt)
    user_to_add = u_res.first()

    if not user_to_add:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Check if already a member
    member_stmt = select(GroupMember).where(
        (GroupMember.group_id == group_id) & (GroupMember.user_id == user_to_add.id)
    )
    m_res = await session.scalars(member_stmt)
    if m_res.first():
        raise HTTPException(status_code=400, detail="User is already a member")
        
    new_member = GroupMember(user_id=user_to_add.id, group_id=group_id)
    session.add(new_member)
    await session.commit()
    
    # Broadcast system message for adding and deletion
    sys_content = f"__SYSTEM__:{current_user.name} added {user_to_add.name}"
    sys_msg = Message(
        content=sys_content,
        sender_id=current_user.id,
        group_id=group_id,
        timestamp=datetime.datetime.utcnow()
    )
    session.add(sys_msg)
    await session.commit()
    await session.refresh(sys_msg)
    
    await update_group_metadata(session, group_id, sys_content)
    await session.commit()
    
    members = await get_group_members(session, group_id)
    msg_data = {
        "type": "chat",
        "id": sys_msg.id,
        "content": sys_content,
        "sender_id": current_user.id,
        "sender_name": current_user.name,
        "group_id": group_id,
        "timestamp": sys_msg.timestamp.isoformat()
    }
    for m_id in members:
        await manager.send_personal_message(json.dumps(msg_data), m_id)

    # Delete the system message from DB as requested
    await session.delete(sys_msg)
    await session.commit()

    # Return updated group
    stmt = select(Group).options(
        selectinload(Group.members).selectinload(GroupMember.user)
    ).where(Group.id == group_id)
    result = await session.scalars(stmt)
    return result.first()

async def leave_group(session: AsyncSession, group_id: int, current_user: User):
    # Find membership
    # print("group_id: ", group_id)
    # print("current_user: ", current_user, vars(current_user))
    stmt = select(GroupMember).where(
        (GroupMember.group_id == group_id) & (GroupMember.user_id == current_user.id)
    )
    result = await session.scalars(stmt)
    member = result.first()
    # print("member: ======================================>", member, member.id, member.user_id, member.group_id)
    
    if not member:
        raise HTTPException(status_code=404, detail="Membership not found")
        
    sys_content = f"__SYSTEM__:{current_user.name} left the group"
    sys_msg = Message(
        content=sys_content,
        sender_id=current_user.id,
        group_id=group_id,
        timestamp=datetime.datetime.utcnow()
    )
    session.add(sys_msg)
    await session.commit()
    await session.refresh(sys_msg)
    
    await update_group_metadata(session, group_id, sys_content)
    await session.commit()
        
    await session.delete(member)
    await session.commit()
    
    # Broadcast to remaining members
    members = await get_group_members(session, group_id)
    msg_data = {
        "type": "chat",
        "id": sys_msg.id,
        "content": sys_content,
        "sender_id": current_user.id,
        "sender_name": current_user.name,
        "group_id": group_id,
        "timestamp": sys_msg.timestamp.isoformat()
    }
    for m_id in members:
        await manager.send_personal_message(json.dumps(msg_data), m_id)

    # Delete the system message from DB as requested
    await session.delete(sys_msg)

    group_stmt = select(Group).where((Group.created_by == current_user.id) & (Group.id == group_id))
    result = await session.scalar(group_stmt)
    if result:
        await session.delete(result)

    await session.commit()
    return {"status": "success"}

async def remove_member_from_group(session: AsyncSession, group_id: int, user_id_to_remove: int, current_user: User):
    stmt = select(Group).where(Group.id == group_id)
    group = (await session.scalars(stmt)).first()
    
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    if group.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Only the creator can remove members")
        
    member_stmt = select(GroupMember).where((GroupMember.group_id == group_id) & (GroupMember.user_id == user_id_to_remove))
    member = (await session.scalars(member_stmt)).first()
    
    if not member:
        raise HTTPException(status_code=404, detail="User is not a member of this group")
        
    u_stmt = select(User).where(User.id == user_id_to_remove)
    removed_user = (await session.scalars(u_stmt)).first()
    
    sys_content = f"__SYSTEM__:{current_user.name} removed {removed_user.name}"
    sys_msg = Message(
        content=sys_content,
        sender_id=current_user.id,
        group_id=group_id,
        timestamp=datetime.datetime.utcnow()
    )
    session.add(sys_msg)
    await session.commit()
    await session.refresh(sys_msg)
    
    await update_group_metadata(session, group_id, sys_content)
    await session.commit()
    
    members = await get_group_members(session, group_id)
    msg_data = {
        "type": "chat",
        "id": sys_msg.id,
        "content": sys_content,
        "sender_id": current_user.id,
        "sender_name": current_user.name,
        "group_id": group_id,
        "removed_user_id": user_id_to_remove,
        "timestamp": sys_msg.timestamp.isoformat()
    }
    for m_id in members:
        await manager.send_personal_message(json.dumps(msg_data), m_id)

    await session.delete(sys_msg)
    await session.delete(member)
    await session.commit()

    stmt = select(Group).options(
        selectinload(Group.members).selectinload(GroupMember.user)
    ).where(Group.id == group_id)
    result = await session.scalars(stmt)
    return result.first()

async def get_conversations(session: AsyncSession, current_user: User):
    
    # We want to return conversation with other user info
    # We can use aliased for clarity if needed, but since it's simple join:
    stmt = select(Conversation).where(
        (Conversation.user_id == current_user.id) | (Conversation.other_user_id == current_user.id)
    ).order_by(Conversation.last_message_time.desc())

    result = await session.scalars(stmt)
    conversations = result.all()
    
    # For each conversation, we need the "other" user details
    # We could do this more efficiently with a join in the stmt above
    # Let's rewrite the stmt to be more efficient and return what frontend wants
    
    results = []
    for conv in conversations:
        other_user_id = conv.other_user_id if conv.user_id == current_user.id else conv.user_id
        
        # Fetch other user details
        user_stmt = select(User).where(User.id == other_user_id)
        u_res = await session.scalars(user_stmt)
        other_user = u_res.first()
        
        results.append({
            "id": conv.id,
            "other_user_id": other_user_id,
            "other_user_name": other_user.name if other_user else f"User {other_user_id}",
            "other_user_email": other_user.email if other_user else "",
            "other_user_phone_number": other_user.phone_number if other_user else "",
            "last_message": conv.last_message,
            "last_message_time": conv.last_message_time,
            "created_at": conv.created_at
        })
        
    return results

async def update_conversation(session: AsyncSession, sender_id: int, recipient_id: int, last_message: str):
    
    # Conversations are bidirectional but stored once or twice? 
    # Usually better to have one record per pair for simplicity in this app's current model
    # Check if a conversation already exists between these two users
    stmt = select(Conversation).where(
        ((Conversation.user_id == sender_id) & (Conversation.other_user_id == recipient_id)) |
        ((Conversation.user_id == recipient_id) & (Conversation.other_user_id == sender_id))
    )
    result = await session.scalars(stmt)
    conv = result.first()
    
    now = datetime.datetime.utcnow()
    if conv:
        conv.last_message = last_message
        conv.last_message_time = now
    else:
        conv = Conversation(
            user_id=sender_id,
            other_user_id=recipient_id,
            last_message=last_message,
            last_message_time=now
        )
        session.add(conv)

async def save_message(session: AsyncSession, sender_id: int, content: str, recipient_id: int = None, group_id: int = None, reply_to_id: int = None, reply_to_content: str = None, reply_to_sender: str = None):
    new_msg = Message(
        content=content,
        sender_id=sender_id,
        recipient_id=recipient_id,
        group_id=group_id,
        reply_to_id=reply_to_id,
        reply_to_content=reply_to_content,
        reply_to_sender=reply_to_sender
    )
    session.add(new_msg)
    await session.flush() # Ensure ID is generated
    await session.refresh(new_msg)
    return new_msg

async def update_group_metadata(session: AsyncSession, group_id: int, last_message: str):
    stmt = select(Group).where(Group.id == group_id)
    result = await session.scalars(stmt)
    group = result.first()
    if group:
        group.last_message = last_message
        group.last_message_time = datetime.datetime.utcnow()


async def get_messages(session: AsyncSession, current_user_id: int, other_id: int = None, group_id: int = None):
    
    if group_id:
        stmt = select(Message).options(
            selectinload(Message.sender)
        ).where(Message.group_id == group_id).order_by(Message.timestamp.asc())
    else:
        stmt = select(Message).options(
            selectinload(Message.sender)
        ).where(
            or_(
                and_(Message.sender_id == current_user_id, Message.recipient_id == other_id),
                and_(Message.sender_id == other_id, Message.recipient_id == current_user_id)
            )
        ).where(Message.group_id == None).order_by(Message.timestamp.asc())
        
    result = await session.scalars(stmt)
    return result.all()

async def get_offline_messages(session: AsyncSession, current_user_id: int):
    # Get all 1-on-1 messages where user is the recipient
    stmt = select(Message).options(
        selectinload(Message.sender)
    ).where(
        Message.recipient_id == current_user_id
    ).order_by(Message.timestamp.asc())
    result = await session.scalars(stmt)
    return result.all()

async def acknowledge_messages(session: AsyncSession, message_ids: List[int], current_user_id: int):
    stmt = select(Message).where(Message.id.in_(message_ids), Message.recipient_id == current_user_id)
    result = await session.scalars(stmt)
    messages_to_delete = result.all()
    for msg in messages_to_delete:
        await session.delete(msg)
    await session.commit()
    return {"status": "success"}

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
                content = msg_data.get("content")
                reply_to_id = msg_data.get("reply_to_id")
                reply_to_content = msg_data.get("reply_to_content")
                reply_to_sender = msg_data.get("reply_to_sender")
                
                msg_type = msg_data.get("type", "chat")
                signaling_types = ["offer", "answer", "candidate", "call-reject", "call-end", "voice-offer", "voice-answer"]
                # print("message type:=====================> ", msg_type)
                if msg_type in signaling_types:
                    # Forward signaling message directly
                    if group_id:
                        gid = int(group_id)
                        members = await get_group_members(session, gid)
                        for member_id in members:
                            if member_id != user_id:
                                await manager.send_personal_message(json.dumps(msg_data), member_id)
                    elif target_id:
                        recipient_id = int(target_id)
                        await manager.send_personal_message(json.dumps(msg_data), recipient_id)
                    continue

                # Save message and update conversation
                if group_id:
                    gid = int(group_id)
                    await update_group_metadata(session, gid, content)
                    
                    # Get members
                    members = await get_group_members(session, gid)
                    base_timestamp = datetime.datetime.utcnow()
                    
                    inserted_msgs = []
                    for member_id in members:
                        if member_id == user_id:
                            continue # Sender already has message locally
                            
                        new_msg = Message(
                            content=content,
                            sender_id=user_id,
                            recipient_id=member_id,
                            group_id=gid,
                            reply_to_id=reply_to_id,
                            reply_to_content=reply_to_content,
                            reply_to_sender=reply_to_sender,
                            timestamp=base_timestamp
                        )
                        session.add(new_msg)
                        inserted_msgs.append(new_msg)
                        
                    await session.flush()
                    
                    for msg in inserted_msgs:
                        await session.refresh(msg)
                        msg_data_copy = msg_data.copy()
                        msg_data_copy["timestamp"] = msg.timestamp.isoformat()
                        msg_data_copy["id"] = msg.id
                        
                        await manager.send_personal_message(json.dumps(msg_data_copy), msg.recipient_id)
                        
                    await session.commit()
                elif target_id:
                    recipient_id = int(target_id)
                    msg = await save_message(session, user_id, content, recipient_id=recipient_id, reply_to_id=reply_to_id, reply_to_content=reply_to_content, reply_to_sender=reply_to_sender)
                    await update_conversation(session, user_id, recipient_id, content)
                    await session.commit()

                    msg_data["timestamp"] = msg.timestamp.isoformat() if msg.timestamp else datetime.datetime.utcnow().isoformat()
                    msg_data["id"] = msg.id

                    await manager.send_personal_message(json.dumps(msg_data), recipient_id)
            except Exception as e:
                try:
                    await session.rollback() # Ensure rollback on error
                except Exception:
                    pass # Connection might be dead anyway
                # print(f"Error handling message: {e}")

    finally:
        manager.disconnect(user_id)

async def delete_conversation(session: AsyncSession, other_user_id: int, current_user_id: int):
    # Fetch the conversation
    stmt = select(Conversation).where(
        ((Conversation.user_id == current_user_id) & (Conversation.other_user_id == other_user_id)) |
        ((Conversation.user_id == other_user_id) & (Conversation.other_user_id == current_user_id))
    )
    result = await session.scalars(stmt)
    conv = result.first()
    
    # Delete all messages between these two users
    msg_stmt = select(Message).where(
        or_(
            and_(Message.sender_id == current_user_id, Message.recipient_id == other_user_id),
            and_(Message.sender_id == other_user_id, Message.recipient_id == current_user_id)
        )
    ).where(Message.group_id == None)

    messages = (await session.scalars(msg_stmt)).all()
    for msg in messages:
        await session.delete(msg)

    # Delete conversation if it exists
    if conv: 
        await session.delete(conv)
    await session.commit()
    return {"status": "success"}
