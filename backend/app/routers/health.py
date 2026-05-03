from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.dependencies import http_error

router = APIRouter()


@router.get("/health")
async def health(db: AsyncSession = Depends(get_db)) -> dict:
    try:
        result = await db.execute(text("SELECT 1"))
        result.scalar_one()
    except SQLAlchemyError:
        http_error(503, "db_unavailable", "Database query failed.")
    return {
        "status": "ok",
        "db_status": "connected",
        "db_response": "SELECT 1 returned 1 row",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
