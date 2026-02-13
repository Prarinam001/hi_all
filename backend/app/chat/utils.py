from fastapi import WebSocket
from typing import Dict

# WebSocket Connection Manager
class ConnectionManager:
    def __init__(self):
        # Maps user_id to websocket
        self.active_connections: Dict[int, WebSocket] = {}

    async def connect(self, websocket: WebSocket, user_id: int):
        await websocket.accept()
        self.active_connections[user_id] = websocket

    def disconnect(self, user_id: int):
        if user_id in self.active_connections:
            del self.active_connections[user_id]

    async def send_personal_message(self, message: str, user_id: int):
        if user_id in self.active_connections:
            await self.active_connections[user_id].send_text(message)

    async def broadcast_to_users(self, message: str, user_ids: list[int]):
        for user_id in user_ids:
            if user_id in self.active_connections:
                await self.active_connections[user_id].send_text(message)