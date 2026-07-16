from aiogram import Router, F
from aiogram.filters import Command
from aiogram.types import Message
from keyboards.main_menu import main_menu_keyboard, employer_keyboard
from services.employer_service import search_employer, get_employer
from services.vacancy_service import add_favorite
from services.i18n import t

router = Router()


@router.message(Command("verify"))
@router.message(F.text.startswith("🏢"))
async def cmd_verify(message: Message, tg_user: dict | None):
    lang = tg_user.get("language", "ru") if tg_user else "ru"
    name = message.text.replace("/verify", "").replace("🏢", "").strip()
    if not name:
        await message.answer(t("enter_employer", lang), reply_markup=main_menu_keyboard(lang))
        return
    results = search_employer(name)
    if not results:
        await message.answer(t("employer_not_found", lang), reply_markup=main_menu_keyboard(lang))
        return
    for e in results:
        text = (
            f"<b>{e.get('name')}</b>\n"
            f"⭐ Рейтинг: {e.get('rating')} ({e.get('reviews_count')} отзывов)\n"
            f"✅ Статус: {e.get('licenses_status')}\n"
            f"🚩 Чёрный список: {'Да' if e.get('blacklist_flag') else 'Нет'}\n"
            f"💸 Налоговый долг: {'Да' if e.get('tax_debt_flag') else 'Нет'}\n"
            f"🤖 AI риск: {e.get('ai_risk_score')}"
        )
        await message.answer(text, parse_mode="HTML", reply_markup=employer_keyboard(e.get("id"), lang))


@router.callback_query(F.data.startswith("fav:e:"))
async def fav_employer(callback: CallbackQuery, tg_user: dict | None):
    eid = int(callback.data.split(":")[2])
    uid = tg_user.get("linked_user_id") if tg_user else None
    add_favorite(callback.from_user.id, "employer", eid, uid)
    lang = tg_user.get("language", "ru") if tg_user else "ru"
    await callback.answer(t("added_favorite", lang))