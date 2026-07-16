from aiogram import Router, F
from aiogram.filters import Command
from aiogram.types import Message, CallbackQuery
from keyboards.main_menu import main_menu_keyboard, vacancy_keyboard
from services.vacancy_service import get_vacancies, get_vacancy, add_favorite, get_favorites
from services.i18n import t

router = Router()


@router.message(Command("jobs"))
@router.message(F.text.startswith("🔎"))
async def cmd_jobs(message: Message, tg_user: dict | None):
    lang = tg_user.get("language", "ru") if tg_user else "ru"
    vacancies = get_vacancies(limit=5)
    if not vacancies:
        await message.answer(t("no_vacancies", lang), reply_markup=main_menu_keyboard(lang))
        return
    for v in vacancies:
        emp = v.get("employers") or {}
        text = (
            f"<b>{v.get('title')}</b>\n"
            f"🏢 {emp.get('name', '-')}\n"
            f"📍 {v.get('city')}\n"
            f"💰 {v.get('salary_from')}–{v.get('salary_to')} ₽\n"
            f"📝 {(v.get('description') or '')[:200]}"
        )
        await message.answer(text, parse_mode="HTML", reply_markup=vacancy_keyboard(v.get("id"), lang))


@router.callback_query(F.data.startswith("vacancy:"))
async def vacancy_details(callback: CallbackQuery, tg_user: dict | None):
    vid = int(callback.data.split(":")[1])
    v = get_vacancy(vid)
    if not v:
        await callback.answer("Not found")
        return
    emp = v.get("employers") or {}
    text = (
        f"<b>{v.get('title')}</b>\n🏢 {emp.get('name')}\n📍 {v.get('city')}\n"
        f"💰 {v.get('salary_from')}–{v.get('salary_to')} ₽\n🏠 Жильё: {v.get('housing_cost')} ₽\n"
        f"⚠️ Риск: {v.get('fraud_risk')}\n📝 {v.get('description')}"
    )
    await callback.message.answer(text, parse_mode="HTML")
    await callback.answer()


@router.callback_query(F.data.startswith("fav:v:"))
async def fav_vacancy(callback: CallbackQuery, tg_user: dict | None):
    vid = int(callback.data.split(":")[2])
    tid = callback.from_user.id
    uid = tg_user.get("linked_user_id") if tg_user else None
    add_favorite(tid, "vacancy", vid, uid)
    lang = tg_user.get("language", "ru") if tg_user else "ru"
    await callback.answer(t("added_favorite", lang))


@router.message(Command("favorites"))
@router.message(F.text.startswith("❤️"))
async def cmd_favorites(message: Message, tg_user: dict | None):
    lang = tg_user.get("language", "ru") if tg_user else "ru"
    favs = get_favorites(message.from_user.id)
    if not favs:
        await message.answer("Избранного пока нет.", reply_markup=main_menu_keyboard(lang))
        return
    lines = [f"❤️ Избранное ({len(favs)}):"]
    for f in favs:
        lines.append(f"• {f.get('item_type')} #{f.get('item_id')}")
    await message.answer("\n".join(lines), reply_markup=main_menu_keyboard(lang))