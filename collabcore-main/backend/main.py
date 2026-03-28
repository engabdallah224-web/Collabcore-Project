from fastapi import FastAPI, HTTPException, Depends, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
from datetime import datetime, timezone

from supabase_config import (
    supabase,
    supabase_admin,
    USERS_TABLE,
    POSTS_TABLE
)

app = FastAPI(title="CollabCore API - Supabase")

# ==============================
# CORS
# ==============================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # production-ka ku xaddid frontend domain-kaaga
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


# ==============================
# AUTH MIDDLEWARE
# ==============================
async def verify_token(authorization: str = Header(None)) -> dict:
    """
    Verify Supabase JWT from Authorization header
    Header format: Bearer <access_token>
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")

    token = authorization.split("Bearer ")[1].strip()

    try:
        user_response = supabase.auth.get_user(token)
        user = getattr(user_response, "user", None)

        if not user:
            raise HTTPException(status_code=401, detail="Invalid or expired token")

        return {
            "uid": user.id,
            "email": getattr(user, "email", None)
        }
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")


# ==============================
# AUTH ENDPOINTS
# ==============================
@app.post("/api/auth/signup")
async def signup(request: Request):
    """
    Create user in Supabase Auth + users table
    """
    try:
        data = await request.json()

        email = data.get("email")
        password = data.get("password")

        if not email or not password:
            raise HTTPException(status_code=400, detail="Email and password are required")

        role = data.get("role", "student").lower()
        valid_roles = ["student", "project_leader", "both"]
        if role not in valid_roles:
            raise HTTPException(
                status_code=400,
                detail=f"Role must be one of: {', '.join(valid_roles)}"
            )

        # Create user using admin client
        auth_response = supabase_admin.auth.admin.create_user({
            "email": email,
            "password": password,
            "email_confirm": True
        })

        user = auth_response.user
        if not user:
            raise HTTPException(status_code=400, detail="Failed to create auth user")

        user_data = {
            "id": user.id,
            "uid": user.id,
            "email": email,
            "full_name": data.get("full_name", ""),
            "university": data.get("university", ""),
            "skills": data.get("skills", []),
            "bio": data.get("bio", ""),
            "role": role,
            "rating": 0.0,
            "projects_count": 0,
            "avatar_url": None,
            "created_at": now_iso(),
            "updated_at": now_iso()
        }

        insert_response = supabase_admin.table(USERS_TABLE).insert(user_data).execute()

        return {
            "success": True,
            "message": "User created successfully",
            "user": {
                "uid": user.id,
                "email": email,
                "role": role
            },
            "profile": insert_response.data[0] if insert_response.data else user_data
        }

    except Exception as e:
        msg = str(e)
        if "already" in msg.lower():
            raise HTTPException(status_code=400, detail="Email already exists")
        raise HTTPException(status_code=400, detail=msg)


@app.post("/api/auth/login")
async def login(request: Request):
    """
    Login using Supabase Auth
    """
    try:
        data = await request.json()
        email = data.get("email")
        password = data.get("password")

        if not email or not password:
            raise HTTPException(status_code=400, detail="Email and password are required")

        login_response = supabase.auth.sign_in_with_password({
            "email": email,
            "password": password
        })

        user = login_response.user
        session = login_response.session

        if not user or not session:
            raise HTTPException(status_code=401, detail="Invalid login credentials")

        profile_response = supabase_admin.table(USERS_TABLE).select("*").eq("id", user.id).limit(1).execute()
        profile = profile_response.data[0] if profile_response.data else None

        return {
            "success": True,
            "message": "Login successful",
            "access_token": session.access_token,
            "refresh_token": session.refresh_token,
            "user": profile if profile else {
                "id": user.id,
                "uid": user.id,
                "email": user.email
            }
        }

    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))


@app.get("/api/auth/me")
async def get_current_user(token_data: dict = Depends(verify_token)):
    """
    Get current authenticated user's profile
    """
    try:
        uid = token_data["uid"]

        response = supabase_admin.table(USERS_TABLE).select("*").eq("id", uid).limit(1).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="User profile not found")

        return {
            "success": True,
            "user": response.data[0]
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ==============================
# POSTS ENDPOINTS
# ==============================
@app.post("/api/posts")
async def create_post(request: Request, token_data: dict = Depends(verify_token)):
    try:
        data = await request.json()
        uid = token_data["uid"]

        if not data.get("title") or not data.get("description"):
            raise HTTPException(status_code=400, detail="Title and description are required")

        post_data = {
            "title": data["title"],
            "description": data["description"],
            "required_skills": data.get("required_skills", []),
            "category": data.get("category", "Other"),
            "status": "open",
            "author_id": uid,
            "team_size": data.get("team_size", 5),
            "current_team_size": 1,
            "created_at": now_iso(),
            "updated_at": now_iso()
        }

        response = supabase_admin.table(POSTS_TABLE).insert(post_data).execute()

        return {
            "success": True,
            "message": "Post created successfully",
            "post": response.data[0] if response.data else post_data
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/posts")
async def get_posts(
    status: Optional[str] = None,
    category: Optional[str] = None,
    limit: int = 20
):
    try:
        query = supabase_admin.table(POSTS_TABLE).select("*").order("created_at", desc=True).limit(limit)

        if status:
            query = query.eq("status", status)
        if category:
            query = query.eq("category", category)

        response = query.execute()

        return {
            "success": True,
            "posts": response.data or [],
            "count": len(response.data or [])
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/posts/{post_id}")
async def get_post(post_id: str):
    try:
        response = supabase_admin.table(POSTS_TABLE).select("*").eq("id", post_id).limit(1).execute()

        if not response.data:
            raise HTTPException(status_code=404, detail="Post not found")

        return {
            "success": True,
            "post": response.data[0]
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/posts/user/{user_id}")
async def get_user_posts(user_id: str):
    try:
        response = (
            supabase_admin
            .table(POSTS_TABLE)
            .select("*")
            .eq("author_id", user_id)
            .order("created_at", desc=True)
            .execute()
        )

        return {
            "success": True,
            "posts": response.data or [],
            "count": len(response.data or [])
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ==============================
# HEALTH CHECK
# ==============================
@app.get("/")
async def root():
    return {
        "message": "CollabCore API is running with Supabase!",
        "version": "2.0.0",
        "database": "supabase",
        "endpoints": {
            "auth": "/api/auth/*",
            "posts": "/api/posts/*"
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)