import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

sample_badges = [
    {
        "id": "baby_steps",
        "name": "Baby Steps",
        "description": "Completed your first 2 facts",
        "icon": "👣"
    },
    {
        "id": "curious_cat",
        "name": "Curious Cat",
        "description": "Viewed 10 different facts",
        "icon": "🐱"
    },
    {
        "id": "daily_grind",
        "name": "Daily Grind",
        "description": "Completed 5-day streak",
        "icon": "📅"
    },
    {
        "id": "super_streak",
        "name": "Super Streak",
        "description": "Completed 14-day streak",
        "icon": "🔥"
    },
    {
        "id": "topic_master",
        "name": "Topic Master",
        "description": "Earned 100 points in a topic",
        "icon": "🎓"
    },
    {
        "id": "explorer",
        "name": "Explorer",
        "description": "Viewed content in 5 different topics",
        "icon": "🧭"
    },
    {
        "id": "first_like",
        "name": "First Like",
        "description": "Liked your first content",
        "icon": "👍"
    },
    {
        "id": "content_saver",
        "name": "Content Saver",
        "description": "Saved 3 pieces of content",
        "icon": "💾"
    },
    {
        "id": "feedback_hero",
        "name": "Feedback Hero",
        "description": "Gave your first feedback",
        "icon": "📝"
    },
    {
        "id": "fast_learner",
        "name": "Fast Learner",
        "description": "Completed 5 facts in under 5 mins",
        "icon": "⚡"
    },
    {
        "id": "share_the_knowledge",
        "name": "Share the Knowledge",
        "description": "Shared a fact with a friend",
        "icon": "📤"
    },
    {
        "id": "coin_collector",
        "name": "Coin Collector",
        "description": "Earned 500 coins",
        "icon": "🪙"
    }
]

for badge in sample_badges:
    badge["coin_reward"] = 50
    response = supabase.table("badges").insert(badge).execute()
    print(f"Inserted {badge['id']}: {response}") 