from aiogram.types import TelegramObject
from aiogram.dispatcher.middlewares.base import BaseMiddleware
from services.supabase_client import get_supabase
from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)


class AuthMiddleware(BaseMiddleware):
    async def __call__(self, handler, event: TelegramObject, data: dict):
        user = data.get("event_from_user")
        tg_record = None
        if user:
            try:
                supabase = get_supabase()
                tid = user.id
                existing = (
                    supabase.table("telegram_users")
                    .select("*")
                    .eq("telegram_id", tid)
                    .execute()
                )
                now = datetime.now(timezone.utc).isoformat()
                if existing.data:
                    tg_record = existing.data[0]
                    supabase.table("telegram_users").update(
                        {
                            "last_activity": now,
                            "username": user.username,
                            "full_name": user.full_name,
                        }
                    ).eq("telegram_id", tid).execute()
                else:
                    new_rec = {
                        "telegram_id": tid,
                        "username": user.username,
                        "full_name": user.full_name,
                        "language": "ru",
                        "created_at": now,
                        "last_activity": now,
                    }
                    res = supabase.table("telegram_users").insert(new_rec).execute()
                    tg_record = res.data[0] if res.data else new_rec
            except Exception as e:
                logger.error(f"[auth-middleware] {e}")
        data["tg_user"] = tg_record
        return await handler(event, data)