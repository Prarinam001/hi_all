import asyncio
import sys
import os
import pytest
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.db.config import async_session, engine
from app.chat.services import save_message

@pytest.mark.asyncio
async def test_reply_message_save():
    try:
        async with async_session() as session:
            # Create first message
            m1 = await save_message(session, sender_id=1, content="Test msg", recipient_id=2)
            await session.commit()
            
            # Create reply
            m2 = await save_message(session, sender_id=2, content="Reply", recipient_id=1, reply_to_id=m1.id)
            await session.commit()
            
            assert m2.reply_to_id == m1.id
            
            # Clean up what we created to prevent db pollution
            await session.delete(m2)
            await session.delete(m1)
            await session.commit()
    except Exception as e:
        pytest.fail(f"Test crashed with {e}")
    finally:
        await engine.dispose()
