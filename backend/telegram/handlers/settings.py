from aiogram import Router, F
from aiogram.filters import Command
from aiogram.types import Message
from keyboards.main_menu import main_menu_keyboard, language_keyboard
from services.supabase_client import get_supabase
from services.i18n import t
from datetime import datetime, timezone

router = Router()


@router.message(Command("settings"))
@router.message(F.text.startswith("⚙"))
async def cmd_settings(message: Message, tg_user: dict | None):
    lang = tg_user.get("language", "ru") if tg_user else "ru"
    await message.answer("⚙ " + t("choose_language", lang), reply_markup=language_keyboard())


@router.message(F.text.in_({"🇷🇺 Русский", "🇺🇿 O'zbekcha"}))
async def change_language(message: Message, tg_user: dict | None):
    lang = "uz" if "O'zbek" in (message.text or "") else "ru"
    try:
        supabase = get_supabase()
        supabase.table("telegram_users").update(
            {"language": lang, "last_activity": datetime.now(timezone.utc).isoformat()}
        ).eq("telegram_id", message.from_user.id).execute()
    except Exception:
        pass
    await message.answer(t("settings_saved", lang), reply_markup=main_menu_keyboard(lang))


@router.message(Command("deleteaccount"))
async def delete_account(message: Message, tg_user: dict | None):
    try:
        supabase = get_supabase()
        supabase.table("telegram_users").delete().eq("telegram_id", message.from_user.id).execute()
        await message.answer("Аккаунт удалён.", reply_markup=main_menu_keyboard("ru"))
    except Exception:
        await message.answer("Ошибка удаления.")