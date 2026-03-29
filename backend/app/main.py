from fastapi import FastAPI
from pydantic_settings import BaseSettings  
from fastapi.middleware.cors import CORSMiddleware
from decouple import config
from app.account.routers import router as account_router
from app.chat.routers import router as chat_router



class Settings(BaseSettings):
    app_title: str = "Hi ALL App"
    environment: str = config("HA_ENVIRONMENT", default="development")
    frontend_url: str = config("FRONTEND_URL")
    cloudflare_url: str = config("CLOUDFLARE_DEFAULT_PAGE_URL")


settings = Settings()

# Only show docs if not production
show_docs = settings.environment.lower() != "production"

app = FastAPI(
    title=settings.app_title,
    docs_url="/docs" if show_docs else None,
    redoc_url="/redoc" if show_docs else None,
    openapi_url="/openapi.json" if show_docs else None,
)

origins = [
    settings.frontend_url.rstrip("/"),
    settings.cloudflare_url.rstrip("/")
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=[
        "Content-Type", 
        "Set-Cookie", 
        "Access-Control-Allow-Headers", 
        "Access-Control-Allow-Origin", 
        "Authorization"
    ],
    expose_headers=["*"],
)

@app.get("/")
def root():
    return f"I am root endpoint"


app.include_router(account_router)
app.include_router(chat_router)

