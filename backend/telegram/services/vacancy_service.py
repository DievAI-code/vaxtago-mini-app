from services.supabase_client import get_supabase
from datetime import datetime, timezone


def get_vacancies(limit: int = 5, city: str | None = None) -> list:
    supabase = get_supabase()
    query = (
        supabase.table("vacancies")
        .select("*, employers(name, rating, licenses_status)")
        .order("published_at", desc=True)
        .limit(limit)
    )
    if city:
        query = query.eq("city", city)
    return query.execute().data or []


def get_vacancy(vacancy_id: int) -> dict | None:
    supabase = get_supabase()
    res = (
        supabase.table("vacancies")
        .select("*, employers(name, rating, licenses_status, reviews_count)")
        .eq("id", vacancy_id)
        .execute()
    )
    return res.data[0] if res.data else None


def add_favorite(telegram_id: int, item_type: str, item_id: int, user_id: str | None = None) -> None:
    supabase = get_supabase()
    supabase.table("favorites").insert(
        {
            "telegram_id": telegram_id,
            "item_type": item_type,
            "item_id": item_id,
            "user_id": user_id,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
    ).execute()


def get_favorites(telegram_id: int) -> list:
    supabase = get_supabase()
    return supabase.table("favorites").select("*").eq("telegram_id", telegram_id).execute().data or []


def save_vacancy(telegram_id: int, vacancy_data: dict) -> None:
    supabase = get_supabase()
    supabase.table("saved_vacancies").insert(
        {
            "telegram_id": telegram_id,
            "vacancy_id": vacancy_data.get("id"),
            "title": vacancy_data.get("title"),
            "company": vacancy_data.get("employers", {}).get("name", ""),
            "city": vacancy_data.get("city"),
            "salary": f"{vacancy_data.get('salary_from')}–{vacancy_data.get('salary_to')} ₽",
            "url": vacancy_data.get("url", ""),
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
    ).execute()


def get_saved_vacancies(telegram_id: int) -> list:
    supabase = get_supabase()
    return supabase.table("saved_vacancies").select("*").eq("telegram_id", telegram_id).order("created_at", desc=True).execute().data or []


def delete_saved_vacancy(vacancy_id: int) -> None:
    supabase = get_supabase()
    supabase.table("saved_vacancies").delete().eq("id", vacancy_id).execute()