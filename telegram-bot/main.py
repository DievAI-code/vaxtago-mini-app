import asyncio
import logging
import sys
from aiogram import Bot, Dispatcher
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode
from aiogram.fsm.storage.memory import MemoryStorage

from config import BOT_TOKEN, LOG_LEVEL
from handlers import start, jobs, employer, translate, ocr, support, profile, settings, admin

# Configure logging
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL),
    format="%(asctime)s - [%(levelname)s] - %(name)s - %(message)s",
)
logger = logging.getLogger(__name__)


async def main() -> None:
    """Main entry point for the VaxtaGo Telegram Bot."""
    if not BOT_TOKEN:
        logger.error("BOT_TOKEN is not set. Please configure it in .env file.")
        sys.exit(1)

    # Initialize bot with HTML parse mode
    bot = Bot(
        token=BOT_TOKEN,
        default=DefaultBotProperties(parse_mode=ParseMode.HTML)
    )

    # Use memory storage for FSM (can be replaced with RedisStorage for production)
    storage = MemoryStorage()
    dp = Dispatcher(storage=storage)

    # Register all routers
    dp.include_router(start.router)
    dp.include_router(jobs.router)
    dp.include_router(employer.router)
    dp.include_router(translate.router)
    dp.include_router(ocr.router)
    dp.include_router(support.router)
    dp.include_router(profile.router)
    dp.include_router(settings.router)
    dp.include_router(admin.router)

    logger.info("Starting VaxtaGo Telegram Bot...")
    
    try:
        await dp.start_polling(bot)
    except (KeyboardInterrupt, SystemExit):
        logger.info("Bot stopped by user.")
    finally:
        await bot.session.close()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except Exception as e:
        logger.critical(f"Critical error: {e}")
        sys.exit(1)