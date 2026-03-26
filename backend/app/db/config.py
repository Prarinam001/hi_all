from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from fastapi import Depends
from typing import AsyncGenerator, Annotated
from decouple import config
import ssl


DB_USER = config("DB_USER")
DB_NAME = config("DB_NAME")
DB_PASS = config("DB_PASSWORD")
DB_PORT = config("DB_PORT", cast=int)
DB_HOST = config("DB_HOST")

ssl_context = ssl.create_default_context()
ssl_context.check_hostname = False
ssl_context.verify_mode = ssl.CERT_NONE

DATABASE_URL = f"mysql+aiomysql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
# DATABASE_URL = "sqlite+aiosqlite:///./app.db"

engine = create_async_engine(
    DATABASE_URL, 
    echo=True, 
    future=True, 
    pool_pre_ping=True,
    connect_args={
        "ssl": ssl_context
    }
)
async_session = async_sessionmaker(
    bind=engine, expire_on_commit=False, class_=AsyncSession
)


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async with async_session() as session:
        yield session


SessionDep = Annotated[AsyncSession, Depends(get_session)]
