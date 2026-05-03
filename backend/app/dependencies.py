from typing import NoReturn
from uuid import UUID

from jwt import PyJWTError
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.models.user import User
from app.services.auth_service import decode_access_token

security = HTTPBearer()


def http_error(status_code: int, error: str, message: str) -> NoReturn:
    raise HTTPException(status_code=status_code, detail={"error": error, "message": message})


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    session: AsyncSession = Depends(get_db),
) -> User:
    token = credentials.credentials
    try:
        payload = decode_access_token(token)
    except PyJWTError:
        http_error(401, "invalid_token", "Invalid or expired token.")
    user_id = payload.get("sub")
    if not user_id:
        http_error(401, "invalid_token", "Invalid or expired token.")
    try:
        parsed_user_id = UUID(user_id)
    except ValueError:
        http_error(401, "invalid_token", "Invalid or expired token.")
    user = await session.get(User, parsed_user_id)
    if not user:
        http_error(401, "invalid_token", "Invalid or expired token.")
    return user


async def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "admin":
        http_error(403, "forbidden", "Admin access required.")
    return current_user
