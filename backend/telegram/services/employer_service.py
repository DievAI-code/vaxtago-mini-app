from services.supabase_client import get_supabase


def search_employer(name: str) -> list:
    supabase = get_supabase()
    return (
        supabase.table("employers")
        .select("*")
        .ilike("name", f"%{name}%")
        .limit(5)
        .execute()
        .data
        or []
    )


def get_employer(employer_id: int) -> dict | None:
    supabase = get_supabase()
    res = supabase.table("employers").select("*").eq("id", employer_id).execute()
    return res.data[0] if res.data else None