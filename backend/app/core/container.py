from functools import lru_cache

from app.core.config import Settings
from app.domain.ports.stt import STTProvider
from app.domain.ports.vision import VisionProvider
from app.domain.ports.realtime import RealtimePublisher
from app.domain.ports.repository import ClassroomRepository
from app.infrastructure.providers.groq.stt import GroqSTTProvider
from app.infrastructure.providers.groq.vision import GroqVisionProvider
from app.infrastructure.repositories.in_memory_classroom_repository import (
    InMemoryClassroomRepository,
)
from app.infrastructure.realtime.in_memory_realtime_publisher import (
    InMemoryRealtimePublisher,
)
from app.presentation.websockets.connection_manager import ConnectionManager
from app.application.services.deduplication import DeduplicationService
from app.application.use_cases.join_classroom import JoinClassroomUseCase
from app.application.use_cases.create_classroom import CreateClassroomUseCase
from app.application.use_cases.ingest_audio import IngestAudioUseCase
from app.application.use_cases.ingest_screenshot import IngestScreenshotUseCase
from app.application.use_cases.get_classroom_state import GetClassroomStateUseCase


class Container:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.connection_manager = ConnectionManager()

        self.stt_provider: STTProvider = self._build_stt_provider()
        self.vision_provider: VisionProvider = self._build_vision_provider()

        self.repository: ClassroomRepository = InMemoryClassroomRepository()
        self.realtime_publisher: RealtimePublisher = InMemoryRealtimePublisher(
            self.connection_manager
        )

        self.deduplication = DeduplicationService()

        self.create_classroom = CreateClassroomUseCase(self.repository)
        self.join_classroom = JoinClassroomUseCase(
            self.repository, self.realtime_publisher
        )
        self.ingest_audio = IngestAudioUseCase(
            self.stt_provider, self.repository, self.realtime_publisher
        )
        self.ingest_screenshot = IngestScreenshotUseCase(
            self.vision_provider, self.repository, self.realtime_publisher,
            self.deduplication
        )
        self.get_classroom_state = GetClassroomStateUseCase(self.repository)

    def _build_stt_provider(self) -> STTProvider:
        if self.settings.stt_provider == "groq":
            return GroqSTTProvider(
                api_key=self.settings.groq_api_key,
                base_url=self.settings.groq_base_url,
                model=self.settings.groq_stt_model,
            )
        raise ValueError(f"Unknown STT provider: {self.settings.stt_provider}")

    def _build_vision_provider(self) -> VisionProvider:
        if self.settings.vision_provider == "groq":
            return GroqVisionProvider(
                api_key=self.settings.groq_api_key,
                base_url=self.settings.groq_base_url,
                model=self.settings.groq_vision_model,
            )
        raise ValueError(f"Unknown vision provider: {self.settings.vision_provider}")


@lru_cache
def get_settings() -> Settings:
    return Settings()


_container: Container | None = None


def get_container() -> Container:
    global _container
    if _container is None:
        _container = Container(get_settings())
    return _container
