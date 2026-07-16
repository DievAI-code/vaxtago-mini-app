/*
VaxtaGo
Created by Dmitry Diev
AI Development Assistant: ChatGPT (OpenAI)
Copyright © 2026
*/
from aiogram import Router, F
from aiogram.filters import Command
from aiogram.types import Message
from keyboards.main_menu import main_menu_keyboard
from services.i18n import t

router = Router()


@router.message(Command("about"))
@router.message(F.text.startswith("О проекте"))
async def cmd_about(message: Message, tg_user: dict | None):
    lang = tg_user.get("language", "ru") if tg_user else "ru"
    about_text = (
        f"{t('menu_about', lang) if 'enu_about' in t('', lang) else 'О проекте'}\n\n"
        "VaxtaGo — это платформа, созданная для помощи мигрантам из Узбекистана и других стран Центральной Азии в адаптации и успешной работе в России. Мы объединяем передовые технологии искусственного интеллекта с глубоким пониманием потребностей наших пользователей.\n\n"
        "Наша миссия:\n"
        "Помочь migrant workers безопадно находить работу, понимать документы, общаться без языковых барьеров и защищать себя от мошенничества и эксплуатации.\n\n"
        "Ключевые функции:\n"
        "• AI-ассистент: Консультации по работе, документам, безопасности и многому другому на вашем языке.\n"
        "• Поиск работы: Подбор вакансий с анализом зарплаты, рисков и реального дохода.\n"
        "• Документы: OCR, перевод, проверка ошибок и напоминания о сроках действия.\n"
        "• Безопасность: Проверка работодателя по ИНН/ОГРН, SOS-кнопка и уведомления доверенным контактам.\n"
        "• Telegram-бот: Доступ ко всем функциям через популярный мессенджер.\n\n"
        "© 2026 VaxtaGo\n"
        "Made by Dmitry Diev\n"
        "Built with ChatGPT"
    )
    await message.answer(about_text, reply_markup=main_menu_keyboard(lang))