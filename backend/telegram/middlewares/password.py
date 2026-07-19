import os
import logging
from aiogram.dispatcher.middlewares.base import BaseMiddleware
from aiogram.types import Message, Update
from aiogram.fsm.context import FSMContext
from services.supabase_client import get_supabase

logger = logging.getLogger(__name__)

class PasswordMiddleware(BaseMiddleware):
    async def __call__(self, handler, event: Update, data: dict):
        # PIN auth removed — pass through all updates
        return await handler(event, data)