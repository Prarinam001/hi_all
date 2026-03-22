from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from typing import List
from app.chat.services import build_connection_for_conversation, create_group, get_user_groups, add_member_to_group, leave_group
from app.chat.schemas import GroupCreate, GroupResponse, AddMemberRequest
from app.db.config import SessionDep
from app.account.models import User
from app.account.dependency import get_current_user
from app.chat.services import get_conversations
from app.chat.services import get_messages
from app.chat.schemas import MessageAck
from app.chat.services import get_offline_messages, acknowledge_messages

router = APIRouter(prefix="/api/chat", tags=["Chat"])


@router.post("/groups", response_model=GroupResponse)
async def create_new_group(
    group_data: GroupCreate,
    session: SessionDep,
    current_user: User = Depends(get_current_user)
):
    """
    Creates a new chat group with the specified initial members and details.
    Used for initiating multi-user conversations within the chat application.
    """
    return await create_group(session, group_data, current_user)

@router.get("/groups", response_model=List[GroupResponse])
async def get_my_groups(
    session: SessionDep,
    current_user: User = Depends(get_current_user)
):
    """
    Retrieves all chat groups that the currently authenticated user is a part of.
    Used for populating the user's group list in the sidebar UI.
    """
    return await get_user_groups(session, current_user)

@router.post("/groups/{group_id}/members", response_model=GroupResponse)
async def add_group_member(
    group_id: int,
    data: AddMemberRequest,
    session: SessionDep,
    current_user: User = Depends(get_current_user)
):
    """
    Adds a new user to an existing chat group.
    Used by group members to invite others into an ongoing group conversation.
    """
    return await add_member_to_group(session, group_id, data.email, current_user)

@router.delete("/groups/{group_id}")
async def leave_my_group(
    group_id: int,
    session: SessionDep,
    current_user: User = Depends(get_current_user)
):
    """
    Removes the currently authenticated user from a specific chat group.
    Used when a user decides to voluntarily exit a group conversation.
    """
    return await leave_group(session, group_id, current_user)

@router.get("/conversations", response_model=List[dict]) 
async def get_my_conversations(
    session: SessionDep,
    current_user: User = Depends(get_current_user)
):
    """
    Retrieves a combined list of individual users and groups the user has chatted with.
    Used for rendering the main conversation list in the chat sidebar.
    """
    return await get_conversations(session, current_user)

@router.get("/messages", response_model=List[dict])
async def get_chat_history(
    session: SessionDep,
    current_user: User = Depends(get_current_user),
    other_id: int = None,
    group_id: int = None
):
    """
    Fetches the historical messages for a specific one-on-one chat or group chat.
    Used when a user opens a conversation to view past interactions.
    """

    messages = await get_messages(session, current_user.id, other_id, group_id)
    # Simple dict conversion for now
    return [
            {
                "id": m.id, 
                "content": m.content, 
                "sender_id": m.sender_id, 
                "sender_name": m.sender.name if m.sender else "Unknown", 
                "recipient_id": m.recipient_id, 
                "group_id": m.group_id, 
                "timestamp": m.timestamp.isoformat() if m.timestamp else None
            } 
            for m in messages
        ]


@router.get("/messages/sync", response_model=List[dict])
async def sync_offline_messages(
    session: SessionDep,
    current_user: User = Depends(get_current_user)
):
    """
    Retrieves messages that were sent to the user while they were not connected.
    Used automatically upon reconnecting to ensure no messages are missed.
    """
    messages = await get_offline_messages(session, current_user.id)
    return [
            {
                "server_id": m.id, 
                "content": m.content, 
                "sender_id": m.sender_id, 
                "sender_name": m.sender.name if m.sender else "Unknown", 
                "recipient_id": m.recipient_id, 
                "group_id": m.group_id, 
                "timestamp": m.timestamp.isoformat() if m.timestamp else None
            } 
            for m in messages
        ]

@router.post("/messages/ack")
async def ack_messages(
    data: MessageAck,
    session: SessionDep,
    current_user: User = Depends(get_current_user)
):
    """
    Acknowledges receipt of specific messages by marking them as delivered/read.
    Used to update message status indicators (like read receipts) for the sender.
    """
    return await acknowledge_messages(session, data.message_ids, current_user.id)

@router.websocket("/ws/{user_id}")
async def start_conversation(
    websocket: WebSocket, 
    user_id: int,
    session: SessionDep
):
    """
    Establishes a persistent WebSocket connection for real-time bidirectional communication.
    Used as the core transport layer for sending and receiving instant messages.
    """
    await build_connection_for_conversation(websocket, user_id, session)

