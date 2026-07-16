import os
import logging
from aiogram.dispatcher.middlewares.base import BaseMiddleware
from aiogram.types import Message, Update
from aiogram.fsm.context import FSMContext
from services.supabase_client import get_supabase

logger = logging.getLogger(__name__)

class PasswordMiddleware(BaseMiddleware):
    async def __call__(self, handler, event: Update, data: dict):
        # Only process Message updates
        if not isinstance(event, Message):
            return await handler(event, data)

        message: Message = event
        tg_user = data.get("tg_user")
        state: FSMContext = data.get("state")

        # If user record is missing, treat as not authorized
        authorized = tg_user.get("authorized") if tg_user else False

        # Allow password entry flow even when not authorized
        if not authorized:
            # If we are already waiting for a password, let the handler run
            current_state = await state.get_state()
            if current_state in ["AuthState:waiting_for_password", "AuthState:waiting_for_password_cooldown"]:
                return await handler(event, data)

            # Otherwise block all commands and reply with error
            await message.answer("❌ Неверный PIN-код. Повторите попытку.")
            logger.warning(f"❌ Invalid PIN attempt: {message.from_user.id}")
            # Stop further processing
            return

        # User is authorized – proceed normally
        return await handler(event, data)