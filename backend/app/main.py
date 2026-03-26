from fastapi import FastAPI
from app.account.routers import router as account_router
from app.chat.routers import router as chat_router
from fastapi.middleware.cors import CORSMiddleware
from decouple import config


app = FastAPI(title="Hi ALL App")

origins = [
    config("FRONTEND_URL").rstrip("/"), 
    config("CLOUDFLARE_DEFAULT_PAGE_URL").rstrip("/")
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Set-Cookie", "Access-Control-Allow-Headers", "Access-Control-Allow-Origin", "Authorization"],
)

@app.get("/")
def root():
    return f"I am root endpoint"


app.include_router(account_router)
app.include_router(chat_router)

