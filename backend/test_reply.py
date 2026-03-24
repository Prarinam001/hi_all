import asyncio
from app.db.config import async_session
from app.chat.services import save_message

async def run_test():
    try:
        async with async_session() as session:
            # Create first message
            m1 = await save_message(session, sender_id=1, content="Test msg", recipient_id=2)
            await session.commit()
            # print("First message saved:", m1.id)
            
            # Create reply
            m2 = await save_message(session, sender_id=2, content="Reply", recipient_id=1, reply_to_id=m1.id)
            await session.commit()
            # print("Reply saved:", m2.id, "replied to:", m2.reply_to_id)
            
    except Exception as e:
        import traceback
        traceback.print_exc()

asyncio.run(run_test())
