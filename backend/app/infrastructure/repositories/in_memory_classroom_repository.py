from app.domain.ports.repository import (
    ClassroomRepository,
    ClassroomState,
    ParticipantInfo,
)


class InMemoryClassroomRepository(ClassroomRepository):
    def __init__(self) -> None:
        self._rooms: dict[str, ClassroomState] = {}

    async def create_classroom(self, classroom_id: str, title: str) -> ClassroomState:
        if classroom_id in self._rooms:
            raise ValueError(f"Classroom {classroom_id} already exists")

        self._rooms[classroom_id] = ClassroomState(
            classroom_id=classroom_id,
            title=title,
        )
        return self._rooms[classroom_id]

    async def exists(self, classroom_id: str) -> bool:
        return classroom_id in self._rooms

    def _ensure(self, classroom_id: str) -> ClassroomState:
        if classroom_id not in self._rooms:
            self._rooms[classroom_id] = ClassroomState(
                classroom_id=classroom_id
            )
        return self._rooms[classroom_id]

    async def add_participant(
        self, classroom_id: str, participant: ParticipantInfo
    ) -> None:
        room = self._ensure(classroom_id)
        if not any(p.user_id == participant.user_id for p in room.participants):
            room.participants.append(participant)

    async def remove_participant(
        self, classroom_id: str, user_id: str
    ) -> None:
        room = self._ensure(classroom_id)
        room.participants = [
            p for p in room.participants if p.user_id != user_id
        ]

    async def update_transcript(
        self, classroom_id: str, transcript: str
    ) -> None:
        room = self._ensure(classroom_id)
        room.latest_transcript = transcript

    async def update_screen_explanation(
        self, classroom_id: str, explanation: str, full_text: str = ""
    ) -> None:
        room = self._ensure(classroom_id)
        room.latest_screen_explanation = explanation
        room.latest_screen_full_text = full_text

    async def get_state(self, classroom_id: str) -> ClassroomState:
        return self._ensure(classroom_id)

    async def get_latest_screenshot_hash(
        self, classroom_id: str
    ) -> str | None:
        return self._ensure(classroom_id).latest_screenshot_hash

    async def set_latest_screenshot_hash(
        self, classroom_id: str, hash_value: str
    ) -> None:
        self._ensure(classroom_id).latest_screenshot_hash = hash_value
