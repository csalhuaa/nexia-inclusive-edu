from abc import ABC, abstractmethod
from dataclasses import dataclass, field


@dataclass
class ParticipantInfo:
    user_id: str
    role: str


@dataclass
class ClassroomState:
    classroom_id: str
    title: str = "Clase en vivo"
    participants: list[ParticipantInfo] = field(default_factory=list)
    latest_transcript: str | None = None
    latest_screen_explanation: str | None = None
    latest_screenshot_hash: str | None = None


class ClassroomRepository(ABC):
    @abstractmethod
    async def create_classroom(self, classroom_id: str, title: str) -> ClassroomState: ...

    @abstractmethod
    async def exists(self, classroom_id: str) -> bool: ...

    @abstractmethod
    async def add_participant(
        self, classroom_id: str, participant: ParticipantInfo
    ) -> None: ...

    @abstractmethod
    async def remove_participant(
        self, classroom_id: str, user_id: str
    ) -> None: ...

    @abstractmethod
    async def update_transcript(
        self, classroom_id: str, transcript: str
    ) -> None: ...

    @abstractmethod
    async def update_screen_explanation(
        self, classroom_id: str, explanation: str
    ) -> None: ...

    @abstractmethod
    async def get_state(self, classroom_id: str) -> ClassroomState: ...

    @abstractmethod
    async def get_latest_screenshot_hash(
        self, classroom_id: str
    ) -> str | None: ...

    @abstractmethod
    async def set_latest_screenshot_hash(
        self, classroom_id: str, hash_value: str
    ) -> None: ...
