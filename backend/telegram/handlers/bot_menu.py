from aiogram import Router, F
from aiogram.types import CallbackQuery
from aiogram.fsm.context import FSMContext
from services.i18n import t
from services.supabase_client import get_supabase

router = Router()


@router.callback_query(F.data.startswith("bot:"))
async def bot_menu_callback(callback: CallbackQuery, state: FSMContext, tg_user: dict | None):
    lang = tg_user.get("language", "ru") if tg_user else "ru"
    action = callback.data.split(":")[1]

    if action == "jobs":
        await callback.message.answer(t("jobs_prompt", lang))
    elif action == "ai":
        await callback.message.answer(t("ai_prompt", lang))
    elif action == "translate":
        await callback.message.answer(t("translate_prompt", lang))
    elif action == "employer":
        await callback.message.answer(t("employer_prompt", lang))
    elif action == "favorites":
        supabase = get_supabase()
        favs = supabase.table("saved_vacancies").select("*").eq("telegram_id", callback.from_user.id).execute().data or []
        if not favs:
            await callback.message.answer("Избранного пока нет.")
        else:
            lines = [f"⭐ Избранное ({len(favs)}):"]
            for f in favs:
                lines.append(f"• {f.get('title')} — {f.get('company')}")
            await callback.message.answer("\n".join(lines))
    elif action == "profile":
        if not tg_user:
            await callback.message.answer(t("profile", lang))
            return
        text = (
            f"{t('profile', lang)}\n"
            f"🆔 Telegram: {tg_user.get('telegram_id')}\n"
            f"👤 Имя: {tg_user.get('full_name') or '-'}\n"
            f"📞 Телефон: {tg_user.get('phone') or 'не указан'}\n"
            f"🌐 Язык: {tg_user.get('language')}\n"
            f"🔗 Linked: {'да' if tg_user.get('linked_user_id') else 'нет'}"
        )
        await callback.message.answer(text)

    await callback.answer()