"""
Seed static data for CollabCore with Supabase
Run: python seed_data.py
"""

import requests
from supabase_config import (
    supabase_admin,
    SKILLS_TABLE,
    UNIVERSITIES_TABLE,
    CATEGORIES_TABLE
)

def clear_table(table_name):
    print(f"Clearing {table_name} table...")
    try:
        rows = supabase_admin.table(table_name).select("id").execute().data or []
        if rows:
            ids = [row["id"] for row in rows if "id" in row]
            for row_id in ids:
                supabase_admin.table(table_name).delete().eq("id", row_id).execute()
        print(f"✓ Cleared {table_name}\n")
    except Exception as e:
        print(f"⚠ Could not fully clear {table_name}: {e}\n")


def seed_skills():
    skills = [
        "Python", "JavaScript", "React", "Node.js", "Java", "C++", "C#",
        "HTML/CSS", "TypeScript", "Go", "Rust", "Swift", "Kotlin",
        "Machine Learning", "Deep Learning", "Data Science", "AI",
        "React Native", "Flutter", "iOS Development", "Android Development",
        "AWS", "Docker", "Kubernetes", "DevOps", "CI/CD",
        "SQL", "MongoDB", "PostgreSQL", "Firebase", "Redis",
        "REST APIs", "GraphQL", "Microservices", "System Design",
        "Git", "Agile", "Project Management", "UI/UX Design",
        "Figma", "Photoshop", "Game Development", "Unity", "Unreal Engine",
        "Blockchain", "Web3", "Smart Contracts", "Solidity",
        "Cybersecurity", "Penetration Testing", "Networking"
    ]

    rows = [{"name": skill} for skill in skills]
    supabase_admin.table(SKILLS_TABLE).insert(rows).execute()
    print(f"✅ Added {len(rows)} skills")


def seed_universities():
    print("Fetching USA universities from API...")
    try:
        url = "http://universities.hipolabs.com/search?country=United%20States"
        response = requests.get(url, timeout=60)
        response.raise_for_status()
        universities_data = response.json()

        rows = []
        for uni in universities_data:
            rows.append({
                "name": uni["name"],
                "state_province": uni.get("state-province"),
                "country": uni.get("country", "United States"),
                "domains": uni.get("domains", []),
                "web_pages": uni.get("web_pages", [])
            })

        if rows:
            supabase_admin.table(UNIVERSITIES_TABLE).insert(rows).execute()

        print(f"✅ Added {len(rows)} universities")

    except Exception as e:
        print(f"❌ Error fetching universities: {e}")


def seed_categories():
    categories = [
        {"name": "AI/ML", "description": "Artificial Intelligence and Machine Learning projects", "icon": "🤖"},
        {"name": "Web Development", "description": "Full-stack web applications and websites", "icon": "🌐"},
        {"name": "Mobile", "description": "iOS and Android mobile applications", "icon": "📱"},
        {"name": "Game Development", "description": "Video games and interactive experiences", "icon": "🎮"},
        {"name": "Data Science", "description": "Data analysis, visualization, and insights", "icon": "📊"},
        {"name": "Blockchain", "description": "Web3, DeFi, and blockchain applications", "icon": "⛓️"},
        {"name": "DevOps", "description": "Infrastructure, deployment, and automation", "icon": "🔧"},
        {"name": "Cybersecurity", "description": "Security tools and ethical hacking", "icon": "🔒"},
        {"name": "IoT", "description": "Internet of Things and hardware projects", "icon": "📡"},
        {"name": "Other", "description": "Other types of projects", "icon": "💡"}
    ]

    supabase_admin.table(CATEGORIES_TABLE).insert(categories).execute()
    print(f"✅ Added {len(categories)} categories")


if __name__ == "__main__":
    print("=" * 50)
    print("CollabCore - Supabase Seeding")
    print("=" * 50)

    try:
        seed_skills()
        seed_universities()
        seed_categories()
        print("\n✅ All data seeded successfully!")
    except Exception as e:
        print(f"\n❌ Error: {e}")