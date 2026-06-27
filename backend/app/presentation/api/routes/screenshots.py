from fastapi import APIRouter, Depends, UploadFile, File

from app.core.container import Container
from app.domain.ports.realtime import EventEnvelope
from app.infrastructure.providers.groq.vision import VisionRateLimitError
from app.presentation.api.dependencies import get_container
from app.schemas.events import now_utc

router = APIRouter(prefix="/api/v1/classrooms", tags=["screenshots"])


@router.post("/{classroom_id}/screenshots")
async def ingest_screenshot(
    classroom_id: str,
    file: UploadFile = File(...),
    force: bool = False,
    container: Container = Depends(get_container),
):
    image_data = await file.read()
    try:
        explanation = await container.ingest_screenshot.execute(
            classroom_id, image_data, force=force
        )
    except VisionRateLimitError:
        explanation = {
            "summary": "La pantalla compartida cambió, pero el servicio de visión está limitado temporalmente.",
            "full_text": ""
        }
        await container.realtime_publisher.publish(
            classroom_id,
            EventEnvelope(
                type="screenshot.processed",
                classroom_id=classroom_id,
                timestamp=now_utc(),
                payload={
                    "explanation": explanation["summary"],
                    "full_text": explanation["full_text"]
                },
            ),
        )
        return {"explanation": explanation["summary"], "full_text": explanation["full_text"], "duplicate": False, "rateLimited": True}
    if explanation is None:
        return {"explanation": None, "full_text": None, "duplicate": True, "rateLimited": False}
    return {"explanation": explanation["summary"], "full_text": explanation["full_text"], "duplicate": False, "rateLimited": False}
