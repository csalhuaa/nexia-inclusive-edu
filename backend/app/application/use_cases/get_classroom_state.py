from app.domain.ports.repository import ClassroomRepository, ClassroomState


class GetClassroomStateUseCase:
    def __init__(self, repo: ClassroomRepository) -> None:
        self._repo = repo

    async def execute(self, classroom_id: str) -> ClassroomState:
        return await self._repo.get_state(classroom_id)
