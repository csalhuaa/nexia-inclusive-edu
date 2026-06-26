import httpx
from fastapi import APIRouter, Depends, UploadFile, File

from app.core.container import Container
from app.presentation.api.dependencies import get_container

router = APIRouter(prefix="/api/v1/classrooms", tags=["audio"])


@router.post("/{classroom_id}/audio")
async def ingest_audio(
    classroom_id: str,
    file: UploadFile = File(...),
    container: Container = Depends(get_container),
):
    audio_data = await file.read()
    try:
        transcript = await container.ingest_audio.execute(
            classroom_id, audio_data, file.content_type or "audio/webm"
        )
    except httpx.HTTPStatusError as exc:
        if exc.response.status_code in {400, 429}:
            return {"transcript": "", "skipped": True}
        raise
    return {"transcript": transcript}
