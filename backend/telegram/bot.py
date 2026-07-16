import asyncio
import sys
from aiogram import Bot, Dispatcher
from aiogram.client.default import DefaultBotProperties
from config import TELEGRAM_BOT_TOKEN
from dispatcher import create_dispatcher
from services.logging_setup import setup_logging

logger = setup_logging()


async def main() -> None:
    if not TELEGRAM_BOT_TOKEN:
        logger.error("TELEGRAM_BOT_TOKEN is not set. The bot cannot start.")
        logger.error("Add TELEGRAM_BOT_TOKEN to your .env file (see .env.example).")
        return

    bot = Bot(token=TELEGRAM_BOT_TOKEN, default=DefaultBotProperties(parse_mode="HTML"))
    dp = create_dispatcher()
    logger.info("Starting VaxtaGo Telegram Bot...")
    await dp.start_polling(bot)


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except (KeyboardInterrupt, SystemExit):
        logger.info("Bot stopped.")
        sys.exit(0)