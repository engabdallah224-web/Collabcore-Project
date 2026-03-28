"""
Enhanced CollabCore FastAPI Backend - Supabase Version
"""

from fastapi import FastAPI, HTTPException, Depends, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
from datetime import datetime, timezone

from supabase_config import (
    supabase,
    supabase_admin,
    USERS_TABLE,
    POSTS_TABLE,
    PROJECTS_TABLE,
    APPLICATIONS_TABLE
)

from chat_models import (
    MessageCreate, MessageUpdate, MessageResponse, MessagesResponse,
    MessageType, MessageSender, format_message_timestamp
)

from workspace_models import (
    TaskCreate, TaskUpdate, TaskResponse, TaskStatus, TaskPriority,
    MeetingCreate, MeetingUpdate, MeetingResponse, MeetingType,
    ProjectSettingsUpdate, ProjectSettingsResponse,
    ProjectAnalytics, MeetingAnalytics,
    calculate_task_completion_rate, is_task_overdue, format_duration
)

from vcs_models import (
    RepositoryConnect, RepositoryUpdate, RepositoryResponse,
    CommitListResponse, PullRequestListResponse, RepositoryStats
)

from document_models import (
    DocumentCreate, DocumentUpdate, DocumentResponse, DocumentListResponse,
    FolderCreate, FolderUpdate, FolderResponse,
    DocumentVersion, DocumentVersionListResponse
)

from github_service import GitHubService
from gitlab_service import GitLabService

app = FastAPI(title="Enhanced CollabCore API - Supabase")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


async def verify_token(authorization: str = Header(None)) -> dict:
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


@app.get("/")
async def root():
    return {
        "message": "Enhanced CollabCore API is running with Supabase!",
        "version": "2.0.0"
    }


@app.get("/api/health")
async def health():
    return {
        "success": True,
        "status": "healthy",
        "database": "supabase",
        "timestamp": now_iso()
    }


@app.get("/api/auth/me")
async def get_current_user(token_data: dict = Depends(verify_token)):
    uid = token_data["uid"]

    response = supabase_admin.table(USERS_TABLE).select("*").eq("id", uid).limit(1).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="User profile not found")

    return {
        "success": True,
        "user": response.data[0]
    }


@app.get("/api/projects")
async def get_projects(limit: int = 20):
    try:
        response = (
            supabase_admin
            .table(PROJECTS_TABLE)
            .select("*")
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )

        return {
            "success": True,
            "projects": response.data or [],
            "count": len(response.data or [])
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/projects")
async def create_project(request: Request, token_data: dict = Depends(verify_token)):
    try:
        data = await request.json()
        uid = token_data["uid"]

        if not data.get("title") or not data.get("description"):
            raise HTTPException(status_code=400, detail="Title and description are required")

        project_data = {
            "title": data["title"],
            "description": data["description"],
            "owner_id": uid,
            "required_skills": data.get("required_skills", []),
            "team_size_limit": data.get("team_size_limit", 5),
            "current_team_size": 1,
            "status": data.get("status", "recruiting"),
            "tags": data.get("tags", []),
            "category": data.get("category", "other"),
            "difficulty": data.get("difficulty", "intermediate"),
            "duration": data.get("duration", "3-6 months"),
            "created_at": now_iso(),
            "updated_at": now_iso()
        }

        response = supabase_admin.table(PROJECTS_TABLE).insert(project_data).execute()

        return {
            "success": True,
            "project": response.data[0] if response.data else project_data
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))