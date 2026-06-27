from fastapi import APIRouter, Depends, HTTPException, status

from app.core.container import Container
from app.presentation.api.dependencies import get_container
from app.domain.ports.repository import ClassroomState
from app.schemas.api import CreateClassroomRequest, JoinRequest, StateResponse

router = APIRouter(prefix="/api/v1/classrooms", tags=["classrooms"])
ALLOWED_ROLES = {"teacher", "blind", "deaf"}


def _role_for_frontend(role: str | None) -> str | None:
    if role == "blind":
        return "blind-student"
    if role == "deaf":
        return "deaf-student"
    return role


def _accessibility_for_role(role: str) -> str:
    if role in {"blind", "blind-student"}:
        return "blind"
    if role in {"deaf", "deaf-student"}:
        return "deaf"
    return "none"


def _session_response(state: ClassroomState, role: str | None = None) -> dict:
    return {
        "id": state.classroom_id,
        "code": state.classroom_id,
        "title": state.title,
        "status": "live",
        "role": _role_for_frontend(role),
        "slideIndex": 0,
        "slides": [],
        "participants": [
            {
                "id": p.user_id,
                "name": p.user_id,
                "role": _role_for_frontend(p.role),
                "accessibility": _accessibility_for_role(p.role),
                "isOnline": True,
            }
            for p in state.participants
        ],
        "media": {
            "audio": role == "teacher",
            "video": role == "teacher",
            "screenShare": False,
            "boardCamera": role == "teacher",
        },
        "subtitles": [],
        "currentCaption": state.latest_screen_explanation or state.latest_transcript or "",
        "currentFullText": state.latest_screen_full_text or "",
        "interpreterActive": True,
        "connectionMode": "api",
        "subtitleSpeed": 1,
    }


@router.post("")
async def create_classroom(
    body: CreateClassroomRequest,
    container: Container = Depends(get_container),
):
    state = await container.create_classroom.execute(body.title)
    return _session_response(state, "teacher")


@router.post("/{classroom_id}/join")
async def join_classroom(
    classroom_id: str,
    body: JoinRequest,
    container: Container = Depends(get_container),
):
    if not await container.repository.exists(classroom_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Classroom not found",
        )
    if body.role not in ALLOWED_ROLES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Role must be teacher, blind, or deaf",
        )

    participant = await container.join_classroom.execute(
        classroom_id, body.user_id, body.role
    )
    state = await container.get_classroom_state.execute(classroom_id)
    return {
        "userId": participant.user_id,
        **_session_response(state, participant.role),
    }


@router.get("/{classroom_id}/state")
async def get_classroom_state(
    classroom_id: str,
    container: Container = Depends(get_container),
):
    if not await container.repository.exists(classroom_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Classroom not found",
        )

    state = await container.get_classroom_state.execute(classroom_id)
    return StateResponse(
        classroom_id=state.classroom_id,
        participants=[
            {"userId": p.user_id, "role": p.role}
            for p in state.participants
        ],
        latest_transcript=state.latest_transcript,
        latest_screen_explanation=state.latest_screen_explanation,
        latest_screen_full_text=state.latest_screen_full_text,
    )
