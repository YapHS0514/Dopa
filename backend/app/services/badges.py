from .supabase import get_supabase_client
from datetime import datetime

def check_and_award_badges(user_id: str):
    supabase = get_supabase_client()
    # 1. Count views
    view_count = supabase.table("user_interactions").select("*", count="exact").eq("user_id", user_id).eq("interaction_type", "view").execute().count
    # 2. Get existing badges
    existing_badges = supabase.table("user_badges").select("badge_id").eq("user_id", user_id).execute().data
    existing_ids = {b['badge_id'] for b in existing_badges}
    # 3. Award badge if criteria met
    if view_count >= 2 and "baby_steps" not in existing_ids:
        print(f"Inserting badge for user_id: {user_id}, badge_id: baby_steps")
        response = supabase.table("user_badges").insert({
            "user_id": user_id,
            "badge_id": "baby_steps",
            "earned_at": datetime.utcnow().isoformat()
        }).execute()
        print(f"Insert response: {response}")
        return "baby_steps"
    return None 