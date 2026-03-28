import json
import datetime
from fastapi import WebSocket, WebSocketDisconnect
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.chat.models import Message
from app.account.models import User
from app.chat.utils import manager, IST
from app.tracking import services as tracking
from app.chat import services as chat_services

async def build_connection_for_conversation(websocket: WebSocket, user_id: int, session: AsyncSession):
    is_first_connection = not manager.is_user_connected(user_id)
    await manager.connect(websocket, user_id)
    
    # Mark user as online in SQL and Valkey only on first connection
    if is_first_connection:
        try:
            stmt = select(User).where(User.id == user_id)
            user = (await session.scalars(stmt)).first()
            if user:
                user.is_online = True
                await session.commit()
                await tracking.set_online(user_id)
                # Broadcast status update
                await manager.broadcast_json({
                    "type": "user_status",
                    "user_id": user_id,
                    "is_online": True
                })
        except Exception as e:
            print(f"Error marking user online: {e}")

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
                
                # Handle Heartbeat/Ping
                if msg_data.get("type") == "ping":
                    await tracking.set_online(user_id) # Refresh TTL
                    await websocket.send_text(json.dumps({"type": "pong"}))
                    continue

                target_id = msg_data.get("target_id")
                group_id = msg_data.get("group_id")
                content = msg_data.get("content")
                reply_to_id = msg_data.get("reply_to_id")
                reply_to_content = msg_data.get("reply_to_content")
                reply_to_sender = msg_data.get("reply_to_sender")
                
                msg_type = msg_data.get("type", "chat")
                signaling_types = ["offer", "answer", "candidate", "call-reject", "call-end", "voice-offer", "voice-answer"]
                
                if msg_type in signaling_types:
                    # Log call start/end/reject only (skip candidate/answer/etc)
                    if target_id and msg_type in ['offer', 'voice-offer', 'call-end', 'call-reject']:
                        try:
                            rid = int(target_id)
                            if msg_type in ['offer', 'voice-offer']:
                                ctype = 'video' if msg_type == 'offer' else 'audio'
                                await chat_services.start_call_log(session, user_id, rid, ctype)
                            elif msg_type == 'call-end':
                                await chat_services.update_call_log(session, user_id, rid, 'completed')
                            elif msg_type == 'call-reject':
                                await chat_services.update_call_log(session, user_id, rid, 'rejected')
                        except Exception as e:
                            # Log error but DON'T stop the signaling message from being forwarded!
                            print(f"Call logging error: {e}")

                    # Forward signaling message directly (fast path)
                    if group_id:
                        gid = int(group_id)
                        members = await chat_services.get_group_members(session, gid)
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
                    await chat_services.update_group_metadata(session, gid, content)
                    
                    # Get members
                    members = await chat_services.get_group_members(session, gid)
                    base_timestamp = datetime.datetime.now(IST)
                    
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
                    msg = await chat_services.save_message(session, user_id, content, recipient_id=recipient_id, reply_to_id=reply_to_id, reply_to_content=reply_to_content, reply_to_sender=reply_to_sender)
                    await chat_services.update_conversation(session, user_id, recipient_id, content)
                    await session.commit()

                    msg_data["timestamp"] = msg.timestamp.isoformat() if msg.timestamp else datetime.datetime.now(IST).isoformat()
                    msg_data["id"] = msg.id

                    await manager.send_personal_message(json.dumps(msg_data), recipient_id)
            except Exception as e:
                try:
                    await session.rollback() # Ensure rollback on error
                except Exception:
                    pass
                print(f"Error handling websocket message: {e}")

    finally:
        # User disconnected - Clean up specific socket
        manager.disconnect(websocket, user_id)
        
        # Only mark offline if NO connections remain for this user
        if not manager.is_user_connected(user_id):
            try:
                stmt = select(User).where(User.id == user_id)
                user = (await session.scalars(stmt)).first()
                if user:
                    now = datetime.datetime.now(IST)
                    user.is_online = False
                    user.last_seen = now
                    await session.commit()
                    await tracking.set_offline(user_id)
                    
                    # Broadcast status update
                    await manager.broadcast_json({
                        "type": "user_status",
                        "user_id": user_id,
                        "is_online": False,
                        "last_seen": now.isoformat()
                    })
            except Exception as e:
                print(f"Error marking user offline: {e}")
