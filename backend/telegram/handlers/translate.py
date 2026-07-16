from aiogram import Router, F
from aiogram.filters import Command
from aiogram.types import Message
from keyboards.main_menu import main_menu_keyboard
from services.ai_service import ask_ai
from services.i18n import t

router = Router()


@router.message(Command("translate"))
@router.message(F.text.startswith("📄"))
async def cmd_translate(message: Message, tg_user: dict | None):
    lang = tg_user.get("language", "ru") if tg_user else "ru"
    text = message.text.replace("/translate", "").replace("📄", "").strip()
    if not text:
        await message.answer("Отправьте текст для перевода (RU ⇄ UZ).", reply_markup=main_menu_keyboard(lang))
        return
    prompt = f"Переведи следующий текст с русского на узбекский или с узбекского на русский, сохраняя смысл:\n\n{text}"
    reply = await ask_ai(prompt, lang)
    await message.answer(reply, reply_markup=main_menu_keyboard(lang))\n\n\n@router.message(F.text == "📷 Фото")
async def translate_photo(message: Message, tg_user: dict | None):
    lang = tg_user.get(\"language\", \"ru\") if tg_user else \"ru\"\n    await message.answer(\"Отправьте фото для перевода (RU ⇄ UZ).\", reply_markup=main_menu_keyboard(lang))\n\n\n@router.message(F.document | F.photo)\nasync def handle_document(message: Message, tg_user: dict | None):
    lang = tg_user.get(\"language\", \"ru\") if tg_user else \"ru\"\n    await message.answer(\"📄 Документ получен. Выполняю распознавание и перевод...\", reply_markup=main_menu_keyboard(lang))\n    \n    # Handle document translation logic here\n    # This would typically involve OCR and translation services\n    \n    await message.answer(\"Перевод готов! (функция в разработке)\", reply_markup=main_menu_keyboard(lang))\n