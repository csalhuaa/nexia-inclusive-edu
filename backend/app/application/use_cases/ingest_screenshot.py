import asyncio
import time

from app.domain.ports.vision import VisionProvider
from app.domain.ports.repository import ClassroomRepository
from app.domain.ports.realtime import RealtimePublisher, EventEnvelope
from app.application.services.deduplication import DeduplicationService
from app.infrastructure.providers.groq.vision import VisionRateLimitError
from app.schemas.events import now_utc


class IngestScreenshotUseCase:
    def __init__(
        self,
        vision: VisionProvider,
        repo: ClassroomRepository,
        publisher: RealtimePublisher,
        dedup: DeduplicationService,
    ) -> None:
        self._vision = vision
        self._repo = repo
        self._publisher = publisher
        self._dedup = dedup
        self._locks: dict[str, asyncio.Lock] = {}
        self._last_analysis_at: dict[str, float] = {}
        self._min_interval_seconds = 8.0

    async def execute(
        self, classroom_id: str, image_data: bytes, force: bool = False
    ) -> dict[str, str] | None:
        image_hash = self._dedup.hash_image(image_data)

        last_hash = await self._repo.get_latest_screenshot_hash(classroom_id)
        if not force and last_hash == image_hash:
            return None

        lock = self._locks.setdefault(classroom_id, asyncio.Lock())
        async with lock:
            now = time.monotonic()
            last_analysis_at = self._last_analysis_at.get(classroom_id, 0.0)
            if not force and now - last_analysis_at < self._min_interval_seconds:
                return None

            explanation_dict = await self._vision.explain_screenshot(image_data)

            self._last_analysis_at[classroom_id] = time.monotonic()

        await self._repo.update_screen_explanation(classroom_id, explanation_dict["summary"], explanation_dict["full_text"])
        await self._repo.set_latest_screenshot_hash(classroom_id, image_hash)

        await self._publisher.publish(
            classroom_id,
            EventEnvelope(
                type="screenshot.processed",
                classroom_id=classroom_id,
                timestamp=now_utc(),
                payload={
                    "explanation": explanation_dict["summary"],
                    "full_text": explanation_dict["full_text"]
                },
            ),
        )

        return explanation_dict
