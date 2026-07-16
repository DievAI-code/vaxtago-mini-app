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
    if not tg_user:\n        await message.answer(t(\"profile\", lang), reply_markup=main_menu_keyboard(lang))\n        return\n    text = (\n        f\"{t('profile', lang)}\\n\"\n        f\"🆔 Telegram: {tg_user.get('telegram_id')}\\n\"\n        f\"👤 Имя: {tg_user.get('full_name') or '-'}\\n\"\n        f\"📞 Телефон: {tg_user.get('phone') or 'не указан'}\\n\"\n        f\"🌐 Язык: {tg_user.get('language')}\\n\"\n        f\"🔐 Статус: {tg_user.get('auth_status')}\\n\"\n    )\n    await message.answer(text, reply_markup=main_menu_keyboard(lang))\n\n\n@router.message(F.text == \"⚙️ Настройки\")\nasync def menu_settings(message: Message, tg_user: dict | None):\n    lang = tg_user.get(\"language\", \"ru\") if tg_user else \"ru\"\n    await message.answer(t(\"settings_prompt\", lang), reply_markup=language_keyboard())\n\n\n@router.message(F.text == \"ℹ️ О VaxtaGo\")\nasync def menu_about(message: Message, tg_user: dict | None):\n    lang = tg_user.get(\"language\", \"ru\") if tg_user else \"ru\"\n    await message.answer(t(\"about_text\", lang), reply_markup=main_menu_keyboard(lang))\n\n\n# Profession selection handler\n@router.callback_query(F.data.startswith(\"prof:\"))\nasync def prof_select(callback: CallbackQuery, tg_user: dict | None):\n    lang = tg_user.get(\"language\", \"ru\") if tg_user else \"ru\"\n    profession = callback.data.split(\":\")[1]\n    \n    # Search for vacancies\n    vacancies = get_vacancies(limit=5)\n    filtered = [v for v in vacancies if profession.lower() in v.get('title', '').lower()]\n    \n    if not filtered:\n        await callback.message.answer(f\"По профессии '{profession}' вакансий не найдено.\", reply_markup=main_menu_keyboard(lang))\n        await callback.answer()\n        return\n    \n    for v in filtered:\n        text = (\n            f\"👷 {v.get('title')}\\n\"\n            f\"🏢 {v.get('employers', {}).get('name', '-')}\\n\"\n            f\"📍 {v.get('city')}\\n\"\n            f\"💰 {v.get('salary_from')}–{v.get('salary_to')} ₽\\n\"\n            f\"📝 {(v.get('description') or '')[:200]}\\n\\n\"\n            f\"━━━━━━━━━━━━━━\"\n        )\n        await callback.message.answer(text, reply_markup=vacancy_inline_keyboard(v.get('id'), lang))\n    \n    await callback.answer()\n\n\n# Vacancy action handlers\n@router.callback_query(F.data.startswith(\"vac:apply:\"))\nasync def vac_apply(callback: CallbackQuery, tg_user: dict | None):\n    lang = tg_user.get(\"language\", \"ru\") if tg_user else \"ru\"\n    vacancy_id = int(callback.data.split(\":\")[2])\n    \n    await callback.message.answer(t(\"apply_prepared\", lang))\n    await callback.message.answer(\n        t(\"btn_contact_employer\", lang) + \"\\n\" + t(\"btn_create_resume\", lang),\n        reply_markup=apply_keyboard(lang)\n    )\n    \n    # Log the application\n    supabase = get_supabase()\n    supabase.table(\"vacancy_applications\").insert({\n        \"telegram_id\": callback.from_user.id,\n        \"vacancy_id\": vacancy_id,\n        \"status\": \"applied\",\n        \"created_at\": datetime.now(timezone.utc).isoformat(),\n    }).execute()\n    \n    await callback.answer()\n\n\n@router.callback_query(F.data.startswith(\"vac:save:\"))\nasync def vac_save(callback: CallbackQuery, tg_user: dict | None):\n    lang = tg_user.get(\"language\", \"ru\") if tg_user else \"ru\"\n    vacancy_id = int(callback.data.split(\":\")[2])\n    \n    # Get vacancy details\n    supabase = get_supabase()\n    vacancy = supabase.table(\"vacancies\").select(\"*\").eq(\"id\", vacancy_id).execute().data\n    \n    if not vacancy:\n        await callback.message.answer(\"Вакансия не найдена.\", reply_markup=main_menu_keyboard(lang))\n        await callback.answer()\n        return\n    \n    v = vacancy[0]\n    \n    # Save to saved_vacancies\n    supabase.table(\"saved_vacancies\").insert({\n        \"telegram_id\": callback.from_user.id,\n        \"vacancy_id\": v.get(\"id\"),\n        \"title\": v.get(\"title\"),\n        \"company\": v.get(\"employers\", {}).get(\"name\", \"\"),\n        \"city\": v.get(\"city\"),\n        \"salary\": f\"{v.get('salary_from')}–{v.get('salary_to')} ₽\",\n        \"url\": v.get(\"url\", \"\"),\n        \"created_at\": datetime.now(timezone.utc).isoformat(),\n    }).execute()\n    \n    await callback.message.answer(t(\"saved_vacancy\", lang), reply_markup=main_menu_keyboard(lang))\n    await callback.answer()\n\n\n@router.callback_query(F.data.startswith(\"vac:check:\"))\nasync def vac_check_employer(callback: CallbackQuery, tg_user: dict | None):\n    lang = tg_user.get(\"language\", \"ru\") if tg_user else \"ru\"\n    vacancy_id = int(callback.data.split(\":\")[2])\n    \n    # Get vacancy details\n    supabase = get_supabase()\n    vacancy = supabase.table(\"vacancies\").select(\"*\").eq(\"id\", vacancy_id).execute().data\n    \n    if not vacancy:\n        await callback.message.answer(\"Вакансия не найдена.\", reply_markup=main_menu_keyboard(lang))\n        await callback.answer()\n        return\n    \n    company_name = vacancy[0].get(\"employers\", {}).get(\"name\", \"\")\n    \n    # Check employer\n    results = search_employer(company_name)\n    \n    if results:\n        await callback.message.answer(\"✅ Компания найдена.\", reply_markup=main_menu_keyboard(lang))\n    else:\n        await callback.message.answer(\"⚠️ Требуется дополнительная проверка.\", reply_markup=main_menu_keyboard(lang))\n    \n    await callback.answer()\n\n\n@router.callback_query(F.data.startswith(\"vac:open:\"))\nasync def vac_open(callback: CallbackQuery, tg_user: dict | None):\n    lang = tg_user.get(\"language\", \"ru\") if tg_user else \"ru\"\n    vacancy_id = int(callback.data.split(\":\")[2])\n    \n    # Get vacancy details\n    supabase = get_supabase()\n    vacancy = supabase.table(\"vacancies\").select(\"*\").eq(\"id\", vacancy_id).execute().data\n    \n    if not vacancy:\n        await callback.message.answer(\"Вакансия не найдена.\", reply_markup=main_menu_keyboard(lang))\n        await callback.answer()\n        return\n    \n    v = vacancy[0]\n    await callback.message.answer(f\"🔗 {v.get('url', 'https://hh.ru')}\", reply_markup=main_menu_keyboard(lang))\n    await callback.answer()\n\n\n# Cabinet handlers\n@router.callback_query(F.data.startswith(\"cab:vacancies\"))\nasync def cab_vacancies(callback: CallbackQuery, tg_user: dict | None):\n    lang = tg_user.get(\"language\", \"ru\") if tg_user else \"ru\"\n    user_id = callback.from_user.id\n    \n    supabase = get_supabase()\n    saved = supabase.table(\"saved_vacancies\").select(\"*\").eq(\"telegram_id\", user_id).execute().data or []\n    \n    if not saved:\n        await callback.message.answer(t(\"no_saved\", lang), reply_markup=main_menu_keyboard(lang))\n        await callback.answer()\n        return\n    \n    for s in saved:\n        text = (\n            f\"👷 {s['title']}\\n\"\n            f\"🏢 {s['company']}\\n\"\n            f\"📍 {s['city']}\\n\"\n            f\"💰 {s['salary']}\\n\\n\"\n            f\"━━━━━━━━━━━━━━\"\n        )\n        await callback.message.answer(text, reply_markup=saved_vacancy_inline_keyboard(s['id'], lang))\n    \n    await callback.answer()\n\n\n@router.callback_query(F.data.startswith(\"cab:vac:delete:\"))\nasync def cab_vac_delete(callback: CallbackQuery, tg_user: dict | None):\n    lang = tg_user.get(\"language\", \"ru\") if tg_user else \"ru\"\n    vacancy_id = int(callback.data.split(\":\")[3])\n    \n    supabase = get_supabase()\n    supabase.table(\"saved_vacancies\").delete().eq(\"id\", vacancy_id).execute()\n    \n    await callback.message.answer(t(\"deleted_vacancy\", lang), reply_markup=main_menu_keyboard(lang))\n    await callback.answer()\n