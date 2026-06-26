import secrets
import string

from app.domain.ports.repository import ClassroomRepository, ClassroomState


class CreateClassroomUseCase:
    def __init__(self, repo: ClassroomRepository) -> None:
        self._repo = repo

    async def execute(self, title: str) -> ClassroomState:
        classroom_id = await self._generate_unique_code()
        return await self._repo.create_classroom(classroom_id, title)

    async def _generate_unique_code(self) -> str:
        alphabet = string.ascii_uppercase + string.digits
        while True:
            code = "".join(secrets.choice(alphabet) for _ in range(6))
            if not await self._repo.exists(code):
                return code
