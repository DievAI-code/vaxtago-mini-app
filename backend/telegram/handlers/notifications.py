from aiogram import Router, F
from aiogram.filters import Command
from aiogram.types import Message
from keyboards.main_menu import main_menu_keyboard
from services.supabase_client import get_supabase
from services.i18n import t

router = Router()


@router.message(Command("notifications"))
@router.message(F.text.startswith("🔔"))
async def cmd_notifications(message: Message, tg_user: dict | None):
    lang = tg_user.get("language", "ru") if tg_user else "ru"
    tid = message.from_user.id
    try:
        supabase = get_supabase()
        notifs = (
            supabase.table("notifications")
            .select("*")
            .eq("telegram_id", tid)
            .order("created_at", desc=True)
            .limit(10)
            .execute()
            .data
            or []
        )
    except Exception:
        notifs = []
    if not notifs:
        await message.answer("Уведомлений пока нет.", reply_markup=main_menu_keyboard(lang))
        return
    lines = ["🔔 Уведомления:"]
    for n in notifs:
        lines.append(f"• [{n.get('kind')}] {n.get('title')}")
    await message.answer("\n".join(lines), reply_markup=main_menu_keyboard(lang))