from supabase import create_client, Client

# ==============================
# SUPABASE CONFIG
# ==============================

SUPABASE_URL = "https://YOUR_PROJECT.supabase.co"
SUPABASE_ANON_KEY = "YOUR_ANON_KEY"
SUPABASE_SERVICE_ROLE_KEY = "YOUR_SERVICE_ROLE_KEY"

# Public/normal client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

# Admin/service client
supabase_admin: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

# ==============================
# TABLE NAMES
# ==============================

USERS_TABLE = "users"
POSTS_TABLE = "posts"
PROJECTS_TABLE = "projects"
APPLICATIONS_TABLE = "applications"
SKILLS_TABLE = "skills"
UNIVERSITIES_TABLE = "universities"
CATEGORIES_TABLE = "categories"