from aiogram import Router, F
from aiogram.filters import Command
from aiogram.types import Message
from keyboards.main_menu import main_menu_keyboard
from services.i18n import t

router = Router()


@router.message(Command("profile"))
@router.message(F.text.startswith("👤"))
async def cmd_profile(message: Message, tg_user: dict | None):
    lang = tg_user.get("language", "ru") if tg_user else "ru"
    if not tg_user:
        await message.answer(t("profile", lang), reply_markup=main_menu_keyboard(lang))
        return
    text = (
        f"{t('profile', lang)}\n"
        f"🆔 Telegram: {tg_user.get('telegram_id')}\n"
        f"👤 Имя: {tg_user.get('full_name') or '-'}\n"
        f"📞 Телефон: {tg_user.get('phone') or 'не указан'}\n"
        f"🌐 Язык: {tg_user.get('language')}\n"
        f"🔗 Linked: {'да' if tg_user.get('linked_user_id') else 'нет'}"
    )
    await message.answer(text, reply_markup=main_menu_keyboard(lang))