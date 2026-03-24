import asyncio
import json
from app.db.config import async_session
from app.chat.services import build_connection_for_conversation

class DummyManager:
    async def connect(self, ws, uid): pass
    def disconnect(self, uid): pass
    async def send_personal_message(self, text, uid):
        print(f"Sent to {uid}: {text}")

import app.chat.services
app.chat.services.manager = DummyManager()

class DummyWS:
    def __init__(self):
        self.messages = [
            json.dumps({
                "type": "chat",
                "content": "Hello Reply!",
                "target_id": 2,
                "reply_to_id": 79,
                "reply_to_content": "Test msg",
                "reply_to_sender": "User 2"
            })
        ]
    async def receive_text(self):
        if not self.messages:
            raise Exception("done")
        return self.messages.pop(0)

async def run():
    async with async_session() as session:
        await build_connection_for_conversation(DummyWS(), user_id=1, session=session)

asyncio.run(run())
