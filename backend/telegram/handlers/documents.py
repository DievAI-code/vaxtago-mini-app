from aiogram import Router, F
from aiogram.filters import Command
from aiogram.types import Message, Document, PhotoSize
from keyboards.main_menu import main_menu_keyboard
from services.supabase_client import get_supabase
from services.ai_service import ask_ai
from services.i18n import t
from datetime import datetime, timezone
import os
import tempfile
import logging

logger = logging.getLogger(__name__)
router = Router()


@router.message(Command("documents"))
@router.message(F.text.startswith("📂"))
async def cmd_documents(message: Message, tg_user: dict | None):
    lang = tg_user.get("language", "ru") if tg_user else "ru"
    await message.answer(t("doc_received", lang), reply_markup=main_menu_keyboard(lang))


@router.message(F.document | F.photo)
async def handle_document(message: Message, tg_user: dict | None):
    lang = tg_user.get("language", "ru") if tg_user else "ru"
    await message.answer(t("doc_received", lang))

    file_obj: Document | PhotoSize = message.document or message.photo[-1]
    tid = message.from_user.id
    uid = tg_user.get("linked_user_id") if tg_user else None

    try:
        supabase = get_supabase()
        # Download file
        file = await message.bot.get_file(file_obj.file_id)
        path = file.file_path
        with tempfile.NamedTemporaryFile(delete=False) as tmp:
            await message.bot.download_file(path, tmp.name)
            tmp_path = tmp.name

        ext = os.path.splitext(file_obj.file_name or "doc.pdf")[1] or ".pdf"
        storage_path = f"{tid}/{datetime.now(timezone.utc).timestamp()}{ext}"
        supabase.storage.from_("documents").upload(
            storage_path, tmp_path, {"content-type": file_obj.mime_type or "application/octet-stream"}
        )
        os.unlink(tmp_path)

        # Store metadata
        supabase.table("documents").insert(
            {
                "user_id": uid,
                "type": ext.replace(".", ""),
                "status": "uploaded",
                "risk_level": "low",
                "metadata": {"telegram_id": tid, "storage_path": storage_path},
                "expires_at": datetime.now(timezone.utc).isoformat(),
            }
        ).execute()

        # AI summary (placeholder OCR text)
        summary = await ask_ai(
            "Кратко опиши, какие поля важно проверить в этом миграционном документе "
            "и на какие сроки обратить внимание.",
            lang,
        )
        await message.answer(f"📝 AI-резюме:\n{summary}", reply_markup=main_menu_keyboard(lang))
    except Exception as e:
        logger.error(f"[documents] {e}")
        await message.answer("⚠️ Не удалось обработать документ.", reply_markup=main_menu_keyboard(lang))