from aiogram import Dispatcher
from middlewares.auth import AuthMiddleware
from middlewares.password import PasswordMiddleware
from handlers import start, jobs, employer, ai, translate, documents, profile, settings, notifications, main_menu, address, bot_menu

def create_dispatcher() -> Dispatcher:
    dp = Dispatcher()
    dp.update.outer_middleware(AuthMiddleware())
    dp.update.outer_middleware(PasswordMiddleware())
    dp.include_router(start.router)
    dp.include_router(jobs.router)
    dp.include_router(employer.router)
    dp.include_router(ai.router)
    dp.include_router(translate.router)
    dp.include_router(documents.router)
    dp.include_router(profile.router)
    dp.include_router(settings.router)
    dp.include_router(notifications.router)
    dp.include_router(main_menu.router)
    dp.include_router(address.router)
    dp.include_router(bot_menu.router)
    return dp