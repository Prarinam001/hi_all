from fastapi import FastAPI
from app.account.routers import router as account_router

from app.chat.routers import router as chat_router
from fastapi.middleware.cors import CORSMiddleware
from decouple import config


app = FastAPI(title="Hi ALL App")

origin = [config("FRONTEND_URL")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origin,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

@app.get("/")
def root():
    return f"I am root endpoint"


app.include_router(account_router)
app.include_router(chat_router)

