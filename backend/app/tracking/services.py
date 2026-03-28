from .config import redis_client as redis
from typing import List, Dict
import json

PRESENCE_PREFIX = "online:"
PRESENCE_TTL = 60 # 60 seconds TTL

async def set_online(user_id: int):
    """
    Mark a user as online in Valkey with a TTL.
    This should be called on connection and on every heartbeat ping.
    """
    key = f"{PRESENCE_PREFIX}{user_id}"
    await redis.set(key, "1", ex=PRESENCE_TTL)

async def set_offline(user_id: int):
    """
    Mark a user as offline in Valkey when they disconnect.
    """
    key = f"{PRESENCE_PREFIX}{user_id}"
    await redis.delete(key)

async def get_online_status(user_ids: List[int]) -> Dict[int, bool]:
    """
    Check the online status of multiple users in a single call.
    Returns a dict mapping user_id to boolean status.
    """
    if not user_ids:
        return {}
    
    keys = [f"{PRESENCE_PREFIX}{uid}" for uid in user_ids]
    results = await redis.mget(keys)
    
    return {uid: results[i] is not None for i, uid in enumerate(user_ids)}
