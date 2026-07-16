import httpx
from config import OPENROUTER_API_KEY, AI_MODEL
from datetime import datetime, timezone

SYSTEM_PROMPT = (
    "You are VaxtaGo AI assistant for migrant workers in Russia. "
    "Help with jobs, documents, employer verification, translation and safety. "
    "Be concise and reply in the user's language."
)

GREETINGS = {
    "ru": "Вот что я рекомендую:",
    "uz": "Mana tavsiyam:",
    "tg": "Ин тавсияи ман аст:",
    "ky": "Сунушуму төмөнкүдөй:",
    "en": "Here is my recommendation:",
}


def detect_language(text: str) -> str:
    low = text.lower()
    if any(w in low for w in ["hello", "hi", "job", "contract", "help", "police", "migration"]):
        return "en"
    if any(w in low for w in ["салом", "кор", "шартнома", "кӯмак"]):
        return "tg"
    if any(w in low for w in ["salom", "ish", "yordam", "shartnoma"]):
        return "uz"
    if any(w in low for w in ["салам", "иш", "жардам", "келишим"]):
        return "ky"
    return "ru"


def fallback_reply(message: str, language: str = "ru") -> str:
    low = message.lower()
    intro = GREETINGS.get(language, GREETINGS["ru"])
    if low == "/start":
        return "👋 Добро пожаловать в VaxtaGo Bot. Я помогу с работой, документами, проверкой работодателя, переводом и безопасностью."
    if low == "/help":
        return "Команды: /start, /help, /jobs, /profile, /settings, /translate, /documents, /verify, /address, /ai."
    if "работ" in low or "vacan" in low or "иш" in low:
        return f"{intro} проверьте AI-анализ вакансии: реальный доход, риск мошенничества и рейтинг работодателя."
    if "договор" in low or "contract" in low or "шарт" in low or "ҳуҷҷат" in low:
        return f"{intro} загрузите фото/PDF договора — я выделю штрафы, скрытые удержания и права сотрудника."
    if "мвд" in low or "полиц" in low or "gov" in low:
        return f"{intro} ближайшие МВД отображаются в навигаторе VaxtaGo. Возьмите паспорт, миграционную карту и регистрацию."
    if "sos" in low or "опас" in low or "help" in low:
        return f"{intro} нажмите кнопку SOS — платформа отправит координаты и уведомит доверенные контакты."
    return f"{intro} я поддерживаю текст, голос, фото и PDF. Могу проверить работодателя, перевести документы и составить roadmap."


async def ask_ai(message: str, language: str = "ru") -> str:
    if not OPENROUTER_API_KEY:
        return fallback_reply(message, language)
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": AI_MODEL,
                    "messages": [
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user", "content": message},
                    ],
                },
            )
            resp.raise_for_status()
            data = resp.json()
            return data["choices"][0]["message"]["content"]
    except Exception:
        return fallback_reply(message, language)