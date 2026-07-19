-- Добавляем поле phone_number если его нет
alter table public.telegram_users
  add column if not exists phone_number text;