from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import JSONResponse
from app.account.schemas import (
    ForgetPasswordRequest,
    PasswordChangeRequest,
    PasswordResetRequest,
    UserCreate,
    UserLogin,
    UserOut,
)
from app.account.services import (
    change_password,
    create_user,
    authenticate_user,
    email_verification_send,
    password_reset_email_send,
    verify_email_token,
    verify_password_reset_token,
    get_user_by_email
)
from app.db.config import SessionDep
from app.account.utils import create_tokens, revoke_refresh_token, verify_refresh_token
from app.account.models import User
from app.account.dependency import get_current_user, require_admin

router = APIRouter(prefix="/api/account", tags=["Account"])


@router.post("/register", response_model=UserOut)
async def register(session: SessionDep, user: UserCreate):
    return await create_user(session, user)


@router.post("/login")
async def login(session: SessionDep, user_login: UserLogin):
    user = await authenticate_user(session, user_login)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Credentials"
        )
    tokens = await create_tokens(session, user)
    return {"message": "Login Successful", "tokens": tokens}


@router.get("/profile", response_model=UserOut)
async def get_user_details(user: User = Depends(get_current_user)):
    return user


@router.post("/refresh")
async def get_refresh_token(session: SessionDep, request: Request, data: dict):
    token = data.get("ha_refresh_token")
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing Refresh Token"
        )
    user = await verify_refresh_token(session, token)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or Expires Token",
        )
    tokens = await create_tokens(session, user)
    return {"message": "Token refreshed successfully", "tokens": tokens}


@router.post("/send-verification-email")
async def send_verification_email(user: User = Depends(get_current_user)):
    return await email_verification_send(user)


@router.get("/verify-email")
async def verify_email(session: SessionDep, token: str):
    return await verify_email_token(session, token)


@router.post("/change-password")
async def verify_email(
    session: SessionDep,
    data: PasswordChangeRequest,
    user: User = Depends(get_current_user),
):
    user = await change_password(session, user, data)
    return {"msg": "Password Changed Successfully"}


@router.post("/send-password-reset-email")
async def send_password_reset_email(session: SessionDep, data: ForgetPasswordRequest):
    return await password_reset_email_send(session, data)


@router.post("/verify-password-reset-email")
async def verify_password_reset_email(session: SessionDep, data: PasswordResetRequest):
    return await verify_password_reset_token(session, data)


@router.get("/admin")
async def get_admin(user: User = Depends(require_admin)):
    return {"msg": f"welcome admin {user.email}"}


@router.post("/logout")
async def logout(
    session: SessionDep, request: Request, data: dict, user: User = Depends(get_current_user)
):
    refress_token = data.get("ha_refresh_token")
    if refress_token:
        await revoke_refresh_token(session, refress_token)
    return {"detail": "Logged out"}

@router.get("/search")
async def search_user(session: SessionDep, email: str):
    user = await get_user_by_email(session, email)
    return user
