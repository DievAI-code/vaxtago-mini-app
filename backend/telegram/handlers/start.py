from aiogram import Router, F
from aiogram.filters import Command
from aiogram.types import Message, KeyboardButton, ReplyKeyboardMarkup
from aiogram.fsm.context import FSMContext
from states.auth import AuthState
from states.registration import RegistrationStates
from keyboards.main_menu import main_menu_keyboard, contact_keyboard, language_keyboard
from services.supabase_client import get_supabase
from services.i18n import t
from datetime import datetime, timezone
import os
import logging

logger = logging.getLogger(__name__)

router = Router()


@router.message(Command("start"))
async def cmd_start(message: Message, state: FSMContext, tg_user: dict | None):
    lang = tg_user.get("language", "ru") if tg_user else "ru"
    
    # Check if user exists and is already authorized
    supabase = get_supabase()
    user_id = message.from_user.id
    existing = supabase.table("telegram_users").select("*").eq("telegram_id", user_id).execute()
    
    if existing.data and len(existing.data) > 0:
        user = existing.data[0]
        if user.get("auth_status") == "AUTHORIZED":
            # User already authorized - show main menu directly
            await message.answer(t("welcome_commercial", lang), reply_markup=main_menu_keyboard(lang))
            return
    
    # New user or not authorized - request phone
    await message.answer(t("share_phone_prompt", lang), reply_markup=contact_keyboard(lang))
    await state.set_state(RegistrationStates.waiting_for_phone)


@router.message(F.contact, RegistrationStates.waiting_for_phone)
async def process_phone(message: Message, state: FSMContext, tg_user: dict | None):
    lang = tg_user.get("language", "ru") if tg_user else "ru"
    contact = message.contact
    if not contact:
        return
    
    supabase = get_supabase()
    user_id = message.from_user.id
    
    # Save user data with AUTHORIZED status
    supabase.table("telegram_users").upsert(
        {
            "telegram_id": user_id,
            "phone": contact.phone_number,
            "username": contact.username or tg_user.get("username") if tg_user else None,
            "first_name": contact.first_name or tg_user.get("first_name") if tg_user else None,
            "language": tg_user.get("language", "ru") if tg_user else "ru",
            "auth_status": "AUTHORIZED",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "last_activity": datetime.now(timezone.utc).isoformat(),
        },
        on_conflict="telegram_id",
    ).execute()
    
    await message.answer(t("authorized", lang), reply_markup=main_menu_keyboard(lang))
    await state.clear()
    logger.info(f"✅ User authorized: {user_id}")


@router.message(F.text, AuthState.waiting_for_password)
async def process_password(message: Message, state: FSMContext, tg_user: dict | None):
    entered = message.text.strip()
    correct_password = os.getenv("BOT_ACCESS_PASSWORD", "31975")

    if entered == correct_password:
        supabase = get_supabase()
        user_id = message.from_user.id
        
        # Update user to AUTHORIZED status
        supabase.table("telegram_users").upsert(
            {
                "telegram_id": user_id,
                "auth_status": "AUTHORIZED",
                "last_activity": datetime.now(timezone.utc).isoformat(),
            },
            on_conflict="telegram_id",
        ).execute()
        
        lang = tg_user.get("language", "ru") if tg_user else "ru"
        await message.answer(t("authorized", lang))
        await state.clear()
        logger.info(f"✅ User authorized via PIN: {user_id}")
        await message.answer(t("welcome_commercial", lang), reply_markup=main_menu_keyboard(lang))
    else:
        failed_attempts = await state.get_data()
        attempts = failed_attempts.get("password_attempts", 0) + 1
        await state.update_data(password_attempts=attempts)

        lang = tg_user.get("language", "ru") if tg_user else "ru"
        if attempts >= 3:
            await message.answer(
                "❌ Неверный PIN-код.\n\nПопробуйте ещё раз.\n\n⏳ Повторите попытку через 30 секунд."
            )
            await state.set_state(AuthState.waiting_for_password_cooldown)
            await state.update_data(cooldown_until=datetime.now(timezone.utc).timestamp() + 30)
        else:
            await message.answer(t("wrong_pin", lang))
        logger.warning(f"❌ Invalid password attempt: {message.from_user.id} (attempt {attempts})")


@router.message(F.text, AuthState.waiting_for_password_cooldown)
async def process_password_cooldown(message: Message, state: FSMContext, tg_user: dict | None):
    state_data = await state.get_data()
    cooldown_until = state_data.get("cooldown_until", 0)
    current_time = datetime.now(timezone.utc).timestamp()

    if current_time < cooldown_until:
        remaining = int(cooldown_until - current_time)
        await message.answer(f"⏳ Повторите попытку через {remaining} секунд.")
        return

    await state.clear()
    lang = tg_user.get("language", "ru") if tg_user else "ru"
    await message.answer(t("pin_prompt", lang))
    await state.set_state(AuthState.waiting_for_password)


@router.message(Command("help"))
async def cmd_help(message: Message, tg_user: dict | None):
    lang = tg_user.get("language", "ru") if tg_user else "ru"
    help_text = (
        "📋 Доступные команды:\n\n"
        "/start - Начать работу\n"
        "/help - Показать это сообщение\n"
        "/jobs - Найти работу\n"
        "/verify - Проверить работодателя\n"
        "/translate - Перевести документ\n"
        "/documents - Мои документы\n"
        "/profile - Профиль\n"
        "/settings - Настройки\n"
        "/ai - AI-помощник\n"
        "/address - Найти адрес\n"
        "/notifications - Уведомления\n"
        "/favorites - Избранное\n\n"
        "Также вы можете использовать кнопки главного меню."
    )
    await message.answer(help_text, reply_markup=main_menu_keyboard(lang))