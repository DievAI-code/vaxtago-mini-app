from aiogram import Router, F
from aiogram.filters import Command
from aiogram.types import Message
from keyboards.main_menu import main_menu_keyboard
from services.ai_service import ask_ai
from services.i18n import t

router = Router()


@router.message(Command("ai"))
@router.message(F.text.startswith("🤖"))
async def cmd_ai(message: Message, tg_user: dict | None):
    lang = tg_user.get("language", "ru") if tg_user else "ru"
    text = message.text.replace("/ai", "").replace("🤖", "").strip()
    if not text:
        await message.answer("Напишите вопрос после /ai или через меню 🤖", reply_markup=main_menu_keyboard(lang))
        return
    await message.answer("🤖 ...")
    reply = await ask_ai(text, lang)
    await message.answer(reply, reply_markup=main_menu_keyboard(lang))


@router.message(F.text & ~F.text.startswith("/"))
async def free_text_ai(message: Message, tg_user: dict | None):
    # Only respond to free text when not in a menu command
    lang = tg_user.get("language", "ru") if tg_user else "ru"
    reply = await ask_ai(message.text or "", lang)
    await message.answer(reply, reply_markup=main_menu_keyboard(lang))