from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class UserMeResponse(BaseModel):
    user_id: UUID
    username: str
    email: str
    role: str
    created_at: datetime


class UpdateMeRequest(BaseModel):
    current_password: str
    new_username: Optional[str] = Field(None, min_length=3, max_length=50)
    new_email: Optional[str] = Field(None, min_length=3, max_length=255)
    new_password: Optional[str] = Field(None, min_length=6, max_length=128)
