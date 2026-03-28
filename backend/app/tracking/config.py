import redis.asyncio as redis
from decouple import config

# Redis/Valkey connection config
# Priority: REDIS_URI -> VALKEY_SERVICE_URI -> Components
REDIS_URI = config("REDIS_URI", default=None)
VALKEY_URI = config("VALKEY_URI", default=config("VALKEY_SERVICE_URI", default=None))

FINAL_URI = REDIS_URI or VALKEY_URI

if FINAL_URI:
    # Handle Aiven specific https/valkey URI formats if necessary
    if FINAL_URI.startswith("https://"):
        FINAL_URI = FINAL_URI.replace("https://", "valkeys://")
    elif FINAL_URI.startswith("rediss://"):
        # standard rediss is fine for both valkey and redis clients
        pass

VALKEY_HOST = config("VALKEY_HOST", default="localhost")
VALKEY_PORT = config("VALKEY_PORT", default=6379, cast=int)
VALKEY_USER = config("VALKEY_USER", default=None)
VALKEY_PASSWORD = config("VALKEY_PASSWORD", default=None)

def get_redis_client():
    if FINAL_URI:
        # If it's a redis:// (not rediss://) URI, we shouldn't pass SSL-specific kwargs
        is_ssl = FINAL_URI.startswith("rediss://") or FINAL_URI.startswith("valkeys://")
        
        kwargs = {
            "decode_responses": True
        }
        
        if is_ssl:
            # Only add SSL specific arguments if it's an SSL connection
            kwargs["ssl_cert_reqs"] = None
            
        return redis.from_url(FINAL_URI, **kwargs)
    
    # Fallback to component-based connection
    return redis.Redis(
        host=VALKEY_HOST,
        port=VALKEY_PORT,
        username=VALKEY_USER,
        password=VALKEY_PASSWORD,
        ssl=True,
        ssl_cert_reqs=None,
        decode_responses=True
    )

redis_client = get_redis_client()
