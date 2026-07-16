from aiogram.fsm.state import StatesGroup, State


class AuthState(StatesGroup):
    waiting_for_password = State()
    waiting_for_password_cooldown = State()