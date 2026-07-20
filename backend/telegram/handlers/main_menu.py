from aiogram import Router, F
from aiogram.filters import Command
from aiogram.types import Message, CallbackQuery
from keyboards.main_menu import main_menu_keyboard, profession_keyboard, vacancy_inline_keyboard, saved_vacancy_inline_keyboard
from services.i18n import t
from services.supabase_client import get_supabase
from services.vacancy_service import get_vacancies, add_favorite
from services.employer_service import search_employer

router = Router()


@router.message(Command("menu"))
@router.message(F.text.startswith("📋"))
async def cmd_menu(message: Message, tg_user: dict | None):
    lang = tg_user.get("language", "ru") if tg_user else "ru"
    await message.answer("Главное меню:", reply_markup=main_menu_keyboard(lang))


@router.message(F.text == "🔍 Найти работу")
async def menu_find_job(message: Message, tg_user: dict | None):
    lang = tg_user.get("language", "ru") if tg_user else "ru"
    await message.answer(t("select_profession", lang), reply_markup=profession_keyboard(lang))


@router.message(F.text == "⭐ Вакансии")
async def menu_vacancies(message: Message, tg_user: dict | None):
    lang = tg_user.get("language", "ru") if tg_user else "ru"
    # Show saved vacancies
    supabase = get_supabase()
    user_id = message.from_user.id
    saved = supabase.table("saved_vacancies").select("*").eq("telegram_id", user_id).execute().data or []
    
    if not saved:
        await message.answer(t("no_saved", lang), reply_markup=main_menu_keyboard(lang))
        return
    
    for s in saved:
        await message.answer(
            f"👷 {s['title']}\n🏢 {s['company']}\n📍 {s['city']}\n💰 {s['salary']}\n\n━━━━━━━━━━━━━━",
            reply_markup=saved_vacancy_inline_keyboard(s['id'], lang)
        )


@router.message(F.text == "📄 Перевод документов")
async def menu_translate_doc(message: Message, tg_user: dict | None):
    lang = tg_user.get("language", "ru") if tg_user else "ru"
    await message.answer(t("translate_options", lang), reply_markup=main_menu_keyboard(lang))


@router.message(F.text == "📷 Скан документа")
async def menu_scan_doc(message: Message, tg_user: dict | None):
    lang = tg_user.get("language", "ru") if tg_user else "ru"
    await message.answer(t("scan_doc", lang), reply_markup=main_menu_keyboard(lang))


@router.message(F.text == "⚖️ Проверить работодателя")
async def menu_check_employer(message: Message, tg_user: dict | None):
    lang = tg_user.get("language", "ru") if tg_user else "ru"
    await message.answer(t("employer_prompt", lang), reply_markup=main_menu_keyboard(lang))


@router.message(F.text == "🛂 Миграция")
async def menu_migration(message: Message, tg_user: dict | None):
    lang = tg_user.get("language", "ru") if tg_user else "ru"
    await message.answer(t("migration_section", lang), reply_markup=main_menu_keyboard(lang))


@router.message(F.text == "🚆 Маршрут и билеты")
async def menu_route_tickets(message: Message, tg_user: dict | None):
    lang = tg_user.get("language", "ru") if tg_user else "ru"
    await message.answer(t("route_options", lang), reply_markup=main_menu_keyboard(lang))


@router.message(F.text == "🏠 Жильё")
async def menu_housing(message: Message, tg_user: dict | None):
    lang = tg_user.get("language", "ru") if tg_user else "ru"
    await message.answer(t("housing_info", lang), reply_markup=main_menu_keyboard(lang))


@router.message(F.text == "🤖 AI-помощник")
async def menu_ai(message: Message, tg_user: dict | None):
    lang = tg_user.get("language", "ru") if tg_user else "ru"
    await message.answer(t("ai_prompt", lang), reply_markup=main_menu_keyboard(lang))


@router.message(F.text == "👤 Кабинет")
async def menu_cabinet(message: Message, tg_user: dict | None):
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
        f"🔐 Статус: {tg_user.get('auth_status')}\n"
    )
    await message.answer(text, reply_markup=main_menu_keyboard(lang))


@router.message(F.text == "⚙️ Настройки")
async def menu_settings(message: Message, tg_user: dict | None):
    lang = tg_user.get("language", "ru") if tg_user else "ru"
    await message.answer(t("settings_prompt", lang), reply_markup=language_keyboard())


@router.message(F.text == "ℹ️ О VaxtaGo")
async def menu_about(message: Message, tg_user: dict | None):
    lang = tg_user.get("language", "ru") if tg_user else "ru"
    await message.answer(t("about_text", lang), reply_markup=main_menu_keyboard(lang))


# Profession selection handler
@router.callback_query(F.data.startswith("prof:"))
async def prof_select(callback: CallbackQuery, tg_user: dict | None):
    lang = tg_user.get("language", "ru") if tg_user else "ru"
    profession = callback.data.split(":")[1]
    
    # Search for vacancies
    vacancies = get_vacancies(limit=5)
    filtered = [v for v in vacancies if profession.lower() in v.get('title', '').lower()]
    
    if not filtered:
        await callback.message.answer(f"По профессии '{profession}' вакансий не найдено.", reply_markup=main_menu_keyboard(lang))
        await callback.answer()
        return
    
    for v in filtered:
        text = (
            f"👷 {v.get('title')}\n"
            f"🏢 {v.get('employers', {}).get('name', '-')}\n"
            f"📍 {v.get('city')}\n"
            f"💰 {v.get('salary_from')}–{v.get('salary_to')} ₽\n"
            f"📝 {(v.get('description') or '')[:200]}\n\n"
            f"━━━━━━━━━━━━━━"
        )
        await callback.message.answer(text, reply_markup=vacancy_inline_keyboard(v.get('id'), lang))
    
    await callback.answer()


# Vacancy action handlers
@router.callback_query(F.data.startswith("vac:apply:"))
async def vac_apply(callback: CallbackQuery, tg_user: dict | None):
    lang = tg_user.get("language", "ru") if tg_user else "ru"
    vacancy_id = int(callback.data.split(":")[2])
    
    await callback.message.answer(t("apply_prepared", lang))
    await callback.message.answer(
        t("btn_contact_employer", lang) + "\n" + t("btn_create_resume", lang),
        reply_markup=apply_keyboard(lang)
    )
    
    # Log the application
    supabase = get_supabase()
    supabase.table("vacancy_applications").insert({
        "telegram_id": callback.from_user.id,
        "vacancy_id": vacancy_id,
        "status": "applied",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }).execute()
    
    await callback.answer()


@router.callback_query(F.data.startswith("vac:save:"))
async def vac_save(callback: CallbackQuery, tg_user: dict | None):
    lang = tg_user.get("language", "ru") if tg_user else "ru"
    vacancy_id = int(callback.data.split(":")[2])
    
    # Get vacancy details
    supabase = get_supabase()
    vacancy = supabase.table("vacancies").select("*").eq("id", vacancy_id).execute().data
    
    if not vacancy:
        await callback.message.answer("Вакансия не найдена.", reply_markup=main_menu_keyboard(lang))
        await callback.answer()
        return
    
    v = vacancy[0]
    
    # Save to saved_vacancies
    supabase.table("saved_vacancies").insert({
        "telegram_id": callback.from_user.id,
        "vacancy_id": v.get("id"),
        "title": v.get("title"),
        "company": v.get("employers", {}).get("name", ""),
        "city": v.get("city"),
        "salary": f"{v.get('salary_from')}–{v.get('salary_to')} ₽",
        "url": v.get("url", ""),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }).execute()
    
    await callback.message.answer(t("saved_vacancy", lang), reply_markup=main_menu_keyboard(lang))
    await callback.answer()


@router.callback_query(F.data.startswith("vac:check:"))
async def vac_check_employer(callback: CallbackQuery, tg_user: dict | None):
    lang = tg_user.get("language", "ru") if tg_user else "ru"
    vacancy_id = int(callback.data.split(":")[2])
    
    # Get vacancy details
    supabase = get_supabase()
    vacancy = supabase.table("vacancies").select("*").eq("id", vacancy_id).execute().data
    
    if not vacancy:
        await callback.message.answer("Вакансия не найдена.", reply_markup=main_menu_keyboard(lang))
        await callback.answer()
        return
    
    company_name = vacancy[0].get("employers", {}).get("name", "")
    
    # Check employer
    results = search_employer(company_name)
    
    if results:
        await callback.message.answer("✅ Компания найдена.", reply_markup=main_menu_keyboard(lang))
    else:
        await callback.message.answer("⚠️ Требуется дополнительная проверка.", reply_markup=main_menu_keyboard(lang))
    
    await callback.answer()


@router.callback_query(F.data.startswith("vac:open:"))
async def vac_open(callback: CallbackQuery, tg_user: dict | None):
    lang = tg_user.get("language", "ru") if tg_user else "ru"
    vacancy_id = int(callback.data.split(":")[2])
    
    # Get vacancy details
    supabase = get_supabase()
    vacancy = supabase.table("vacancies").select("*").eq("id", vacancy_id).execute().data
    
    if not vacancy:
        await callback.message.answer("Вакансия не найдена.", reply_markup=main_menu_keyboard(lang))
        await callback.answer()
        return
    
    v = vacancy[0]
    await callback.message.answer(f"🔗 {v.get('url', 'https://hh.ru')}", reply_markup=main_menu_keyboard(lang))
    await callback.answer()


# Cabinet handlers
@router.callback_query(F.data.startswith("cab:vacancies"))
async def cab_vacancies(callback: CallbackQuery, tg_user: dict | None):
    lang = tg_user.get("language", "ru") if tg_user else "ru"
    user_id = callback.from_user.id
    
    supabase = get_supabase()
    saved = supabase.table("saved_vacancies").select("*").eq("telegram_id", user_id).execute().data or []
    
    if not saved:
        await callback.message.answer(t("no_saved", lang), reply_markup=main_menu_keyboard(lang))
        await callback.answer()
        return
    
    for s in saved:
        text = (
            f"👷 {s['title']}\n"
            f"🏢 {s['company']}\n"
            f"📍 {s['city']}\n"
            f"💰 {s['salary']}\n\n"
            f"━━━━━━━━━━━━━━"
        )
        await callback.message.answer(text, reply_markup=saved_vacancy_inline_keyboard(s['id'], lang))
    
    await callback.answer()


@router.callback_query(F.data.startswith("cab:vac:delete:"))
async def cab_vac_delete(callback: CallbackQuery, tg_user: dict | None):
    lang = tg_user.get("language", "ru") if tg_user else "ru"
    vacancy_id = int(callback.data.split(":")[3])
    
    supabase = get_supabase()
    supabase.table("saved_vacancies").delete().eq("id", vacancy_id).execute()
    
    await callback.message.answer(t("deleted_vacancy", lang), reply_markup=main_menu_keyboard(lang))
    await callback.answer()