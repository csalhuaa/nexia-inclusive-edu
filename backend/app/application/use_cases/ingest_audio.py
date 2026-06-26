from app.domain.ports.stt import STTProvider
from app.domain.ports.repository import ClassroomRepository
from app.domain.ports.realtime import RealtimePublisher, EventEnvelope
from app.schemas.events import now_utc


class IngestAudioUseCase:
    def __init__(
        self,
        stt: STTProvider,
        repo: ClassroomRepository,
        publisher: RealtimePublisher,
    ) -> None:
        self._stt = stt
        self._repo = repo
        self._publisher = publisher

    async def execute(
        self, classroom_id: str, audio_data: bytes, content_type: str
    ) -> str:
        transcript = await self._stt.transcribe(audio_data, content_type)
        transcript = transcript.strip()
        if not transcript:
            return ""

        await self._repo.update_transcript(classroom_id, transcript)

        await self._publisher.publish(
            classroom_id,
            EventEnvelope(
                type="transcript.final",
                classroom_id=classroom_id,
                timestamp=now_utc(),
                payload={"text": transcript},
            ),
        )

        return transcript
