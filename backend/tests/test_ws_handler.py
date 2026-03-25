import asyncio
import json
import pytest
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.db.config import async_session, engine
from app.chat.services import build_connection_for_conversation

class DummyManager:
    async def connect(self, ws, uid): pass
    def disconnect(self, uid): pass
    async def send_personal_message(self, text, uid):
        pass

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

@pytest.mark.asyncio
async def test_ws_handler():
    try:
        async with async_session() as session:
            await build_connection_for_conversation(DummyWS(), user_id=1, session=session)
    except Exception as e:
        # Expected exception 'done' when messages run out
        assert str(e) == "done"
    finally:
        await engine.dispose()
