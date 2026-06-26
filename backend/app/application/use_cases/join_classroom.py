from app.domain.ports.repository import ClassroomRepository, ParticipantInfo
from app.domain.ports.realtime import RealtimePublisher, EventEnvelope
from app.schemas.events import now_utc


class JoinClassroomUseCase:
    def __init__(
        self,
        repo: ClassroomRepository,
        publisher: RealtimePublisher,
    ) -> None:
        self._repo = repo
        self._publisher = publisher

    async def execute(
        self, classroom_id: str, user_id: str, role: str
    ) -> ParticipantInfo:
        participant = ParticipantInfo(user_id=user_id, role=role)
        await self._repo.add_participant(classroom_id, participant)

        await self._publisher.publish(
            classroom_id,
            EventEnvelope(
                type="classroom.joined",
                classroom_id=classroom_id,
                timestamp=now_utc(),
                payload={"userId": user_id, "role": role},
            ),
        )

        return participant
