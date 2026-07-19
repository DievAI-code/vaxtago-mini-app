from aiogram.types import ReplyKeyboardMarkup, KeyboardButton, InlineKeyboardMarkup, InlineKeyboardButton
from aiogram.utils.keyboard import InlineKeyboardBuilder
from services.i18n import t


def main_menu_keyboard(lang: str = "ru") -> ReplyKeyboardMarkup:
    buttons = [
        [KeyboardButton(text=t("menu_find_job", lang)), KeyboardButton(text=t("menu_vacancies", lang))],
        [KeyboardButton(text=t("menu_translate_doc", lang)), KeyboardButton(text=t("menu_scan_doc", lang))],
        [KeyboardButton(text=t("menu_check_employer", lang)), KeyboardButton(text=t("menu_migration", lang))],
        [KeyboardButton(text=t("menu_route_tickets", lang)), KeyboardButton(text=t("menu_housing", lang))],
        [KeyboardButton(text=t("menu_ai", lang)), KeyboardButton(text=t("menu_cabinet", lang))],
        [KeyboardButton(text=t("menu_settings", lang)), KeyboardButton(text=t("menu_about", lang))],
    ]
    return ReplyKeyboardMarkup(keyboard=buttons, resize_keyboard=True)


def contact_keyboard(lang: str = "ru") -> ReplyKeyboardMarkup:
    return ReplyKeyboardMarkup(
        keyboard=[[KeyboardButton(text=t("share_phone", lang), request_contact=True)]],
        resize_keyboard=True,
        one_time_keyboard=True,
    )


def language_keyboard() -> ReplyKeyboardMarkup:
    return ReplyKeyboardMarkup(
        keyboard=[[KeyboardButton(text="🇷🇺 Русский"), KeyboardButton(text="🇺🇿 O'zbekcha")]],
        resize_keyboard=True,
        one_time_keyboard=True,
    )


def profession_keyboard(lang: str = "ru") -> InlineKeyboardMarkup:
    professions = ["Сварщик", "Водитель", "Строитель", "Электрик", "Разнорабочий", "Другое"]
    builder = InlineKeyboardBuilder()
    for p in professions:
        builder.button(text=p, callback_data=f"prof:{p}")
    builder.adjust(2)
    return builder.as_markup()


def vacancy_inline_keyboard(vacancy_id: int, lang: str = "ru") -> InlineKeyboardMarkup:
    builder = InlineKeyboardBuilder()
    builder.button(text=t("btn_apply", lang), callback_data=f"vac:apply:{vacancy_id}")
    builder.button(text=t("btn_save", lang), callback_data=f"vac:save:{vacancy_id}")
    builder.button(text=t("btn_check_employer", lang), callback_data=f"vac:check:{vacancy_id}")
    builder.button(text=t("btn_open", lang), callback_data=f"vac:open:{vacancy_id}")
    builder.adjust(1)
    return builder.as_markup()


def saved_vacancy_inline_keyboard(vacancy_id: int, lang: str = "ru") -> InlineKeyboardMarkup:
    builder = InlineKeyboardBuilder()
    builder.button(text="🗑 Удалить", callback_data=f"cab:vac:delete:{vacancy_id}")
    builder.button(text=t("btn_open", lang), callback_data=f"vac:open:{vacancy_id}")
    builder.adjust(1)
    return builder.as_markup()


def bot_main_inline_keyboard(lang: str = "ru", mini_app_url: str = "") -> InlineKeyboardMarkup:
    """Main menu shown after /start with Mini App launch button."""
    MINI_APP_URL = "https://vaxtago-bydievds.vercel.app/"
    builder = InlineKeyboardBuilder()
    builder.button(text="🔍 Найти работу", callback_data="bot:jobs")
    builder.button(text="🤖 AI Помощник", callback_data="bot:ai")
    builder.button(text="📄 Перевод документов", callback_data="bot:translate")
    builder.button(text="🛡 Проверить работодателя", callback_data="bot:employer")
    builder.button(text="⭐ Избранное", callback_data="bot:favorites")
    builder.button(text="👤 Профиль", callback_data="bot:profile")
    builder.button(text="🚀 Открыть VaxtaGo", web_app={"url": MINI_APP_URL})
    builder.adjust(2)
    return builder.as_markup()