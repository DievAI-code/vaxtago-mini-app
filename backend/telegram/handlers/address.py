from aiogram import Router, F
from aiogram.filters import Command
from aiogram.types import Message
from keyboards.main_menu import main_menu_keyboard
from services.i18n import t

router = Router()


@router.message(Command("address"))
@router.message(F.text.startswith("🚆"))
async def cmd_address(message: Message, tg_user: dict | None):
    lang = tg_user.get("language", "ru") if tg_user else "ru"
    await message.answer(t("send_address", lang), reply_markup=main_menu_keyboard(lang))