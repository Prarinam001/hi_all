from fastapi import WebSocket
from typing import Dict, Set
import datetime
from datetime import timedelta
IST = datetime.timezone(timedelta(hours=5, minutes=30))

# WebSocket Connection Manager
class ConnectionManager:
    def __init__(self):
        # Maps user_id to a set of active web sockets (for multi-tab support)
        self.active_connections: Dict[int, Set[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: int):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        self.active_connections[user_id].add(websocket)

    def disconnect(self, websocket: WebSocket, user_id: int):
        if user_id in self.active_connections:
            self.active_connections[user_id].discard(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]

    def is_user_connected(self, user_id: int) -> bool:
        return user_id in self.active_connections and len(self.active_connections[user_id]) > 0

    async def send_personal_message(self, message: str, user_id: int):
        if user_id in self.active_connections:
            dead_sockets = []
            for websocket in self.active_connections[user_id]:
                try:
                    await websocket.send_text(message)
                except Exception:
                    dead_sockets.append(websocket)
            
            for ws in dead_sockets:
                self.disconnect(ws, user_id)

    async def broadcast_to_users(self, message: str, user_ids: list[int]):
        for user_id in user_ids:
            await self.send_personal_message(message, user_id)

    async def broadcast_json(self, data: dict):
        """Broadcast a JSON message to all currently connected users."""
        import json
        message = json.dumps(data)
        for user_id in list(self.active_connections.keys()):
            await self.send_personal_message(message, user_id)

manager = ConnectionManager()