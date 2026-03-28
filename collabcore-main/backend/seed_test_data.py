"""
Seed test users and projects for CollabCore using Supabase
Run: python seed_test_data.py
"""

import random
from datetime import datetime, timedelta, timezone

from supabase_config import (
    supabase_admin,
    USERS_TABLE,
    PROJECTS_TABLE,
    APPLICATIONS_TABLE
)

TEST_EMAIL_PATTERN = "test{}@collabcore.dev"
TEST_PASSWORD = "testpass123"

FIRST_NAMES = [
    "Alex", "Sam", "Jordan", "Taylor", "Morgan", "Casey", "Riley", "Avery",
    "Quinn", "Reese", "Drew", "Cameron", "Jamie", "Dakota", "Skylar", "Sage"
]

LAST_NAMES = [
    "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis"
]

UNIVERSITIES = [
    "MIT", "Stanford University", "Harvard University", "UC Berkeley",
    "Carnegie Mellon University", "Georgia Institute of Technology"
]

SKILLS = [
    "Python", "JavaScript", "React", "Node.js", "Java", "C++", "TypeScript",
    "Machine Learning", "AI", "Data Science", "PostgreSQL", "Docker"
]

PROJECT_TEMPLATES = [
    {
        "title": "AI-Powered Study Assistant",
        "description": "Building an intelligent study companion for students.",
        "skills": ["Python", "Machine Learning", "AI", "React"],
        "category": "AI/ML",
        "difficulty": "intermediate",
        "duration": "3 months"
    },
    {
        "title": "Campus Event Finder",
        "description": "Mobile/web app for campus events.",
        "skills": ["React", "Node.js", "PostgreSQL"],
        "category": "Mobile",
        "difficulty": "beginner",
        "duration": "2 months"
    }
]

BIOS = [
    "Passionate about building products that solve real problems.",
    "CS major with focus on AI and web development.",
    "Full-stack developer interested in open source.",
    "Data science enthusiast."
]


def now_iso():
    return datetime.now(timezone.utc).isoformat()


def generate_test_users(num_users=20):
    print(f"Creating {num_users} test users...\n")
    created_users = []

    for i in range(1, num_users + 1):
        email = TEST_EMAIL_PATTERN.format(i)
        full_name = f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}"

        try:
            auth_res = supabase_admin.auth.admin.create_user({
                "email": email,
                "password": TEST_PASSWORD,
                "email_confirm": True
            })
            user = auth_res.user
        except Exception:
            # If exists, skip auth creation and continue
            existing = supabase_admin.table(USERS_TABLE).select("*").eq("email", email).limit(1).execute()
            if existing.data:
                created_users.append(existing.data[0]["id"])
                continue
            else:
                print(f"⚠ Could not create or find user {email}")
                continue

        role = random.choice(["student", "project_leader", "both"])
        user_skills = random.sample(SKILLS, random.randint(3, 6))
        university = random.choice(UNIVERSITIES)

        profile = {
            "id": user.id,
            "uid": user.id,
            "email": email,
            "full_name": full_name,
            "university": university,
            "bio": random.choice(BIOS),
            "skills": user_skills,
            "role": role,
            "rating": round(random.uniform(3.5, 5.0), 1),
            "projects_count": 0,
            "avatar_url": None,
            "created_at": now_iso(),
            "updated_at": now_iso()
        }

        supabase_admin.table(USERS_TABLE).insert(profile).execute()
        created_users.append(user.id)
        print(f"✓ Created: {email}")

    print(f"\n✅ Users ready: {len(created_users)}\n")
    return created_users


def generate_projects_for_users(user_ids):
    total_projects = 0

    for user_id in user_ids:
        user_res = supabase_admin.table(USERS_TABLE).select("*").eq("id", user_id).limit(1).execute()
        if not user_res.data:
            continue

        user = user_res.data[0]
        if user["role"] not in ["project_leader", "both"]:
            continue

        num_projects = random.randint(1, 3)

        for _ in range(num_projects):
            template = random.choice(PROJECT_TEMPLATES)
            project_data = {
                "title": template["title"],
                "description": template["description"],
                "owner_id": user_id,
                "required_skills": template["skills"],
                "team_size_limit": random.randint(3, 6),
                "current_team_size": 1,
                "status": random.choice(["recruiting", "active"]),
                "tags": template["skills"][:3],
                "category": template["category"],
                "difficulty": template["difficulty"],
                "duration": template["duration"],
                "created_at": now_iso(),
                "updated_at": now_iso()
            }
            supabase_admin.table(PROJECTS_TABLE).insert(project_data).execute()
            total_projects += 1

        supabase_admin.table(USERS_TABLE).update({
            "projects_count": num_projects,
            "updated_at": now_iso()
        }).eq("id", user_id).execute()

    print(f"✅ Projects created: {total_projects}")
    return total_projects


def main():
    print("=" * 60)
    print("CollabCore - Seed Test Data (Supabase)")
    print("=" * 60)

    try:
        user_ids = generate_test_users(20)
        num_projects = generate_projects_for_users(user_ids)

        print("\n✅ Test data seeded successfully!")
        print(f"Users: {len(user_ids)}")
        print(f"Projects: {num_projects}")
        print("Password for all test users: testpass123")

    except Exception as e:
        print(f"\n❌ Error: {e}")


if __name__ == "__main__":
    main()