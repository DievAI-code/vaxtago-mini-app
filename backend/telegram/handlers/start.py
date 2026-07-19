from aiogram import Router, F
from aiogram.filters import Command
from aiogram.types import Message, KeyboardButton, ReplyKeyboardMarkup, InlineKeyboardMarkup, InlineKeyboardButton
from aiogram.fsm.context import FSMContext
from keyboards.main_menu import main_menu_keyboard, contact_keyboard, language_keyboard, bot_main_inline_keyboard
from services.supabase_client import get_supabase
from services.i18n import t
from datetime import datetime, timezone
import os
import logging

logger = logging.getLogger(__name__)

router = Router()

MINI_APP_URL = "https://vaxtago-bydievds.vercel.app/"


@router.message(Command("start"))
async def cmd_start(message: Message, state: FSMContext, tg_user: dict | None):
    lang = tg_user.get("language", "ru") if tg_user else "ru"
    user_id = message.from_user.id

    supabase = get_supabase()
    now = datetime.now(timezone.utc).isoformat()

    existing = supabase.table("telegram_users").select("*").eq("telegram_id", user_id).execute()
    if existing.data:
        supabase.table("telegram_users").update({
            "username": message.from_user.username,
            "first_name": message.from_user.first_name,
            "last_name": message.from_user.last_name,
            "language_code": message.from_user.language_code or "ru",
            "last_login": now,
        }).eq("telegram_id", user_id).execute()
        user = existing.data[0]
    else:
        new_rec = {
            "telegram_id": user_id,
            "username": message.from_user.username,
            "first_name": message.from_user.first_name,
            "last_name": message.from_user.last_name,
            "language_code": message.from_user.language_code or "ru",
            "photo_url": None,
            "created_at": now,
            "last_login": now,
        }
        res = supabase.table("telegram_users").insert(new_rec).execute()
        user = res.data[0] if res.data else new_rec

    await message.answer(
        f"👋 Добро пожаловать в VaxtaGo, {message.from_user.first_name}!\n\n"
        "🤖 AI помощник для работы, документов и жизни в России.\n\n"
        "Выберите действие:",
        reply_markup=bot_main_inline_keyboard(lang, MINI_APP_URL),
    )


@router.message(Command("help"))
async def cmd_help(message: Message, tg_user: dict | None):
    lang = tg_user.get("language", "ru") if tg_user else "ru"
    help_text = (
        "📋 Доступные команды:\n\n"
        "/start - Главное меню\n"
        "/menu - Открыть меню\n"
        "/help - Помощь\n\n"
        "Или используйте кнопки ниже 👇"
    )
    await message.answer(help_text, reply_markup=bot_main_inline_keyboard(lang, MINI_APP_URL))