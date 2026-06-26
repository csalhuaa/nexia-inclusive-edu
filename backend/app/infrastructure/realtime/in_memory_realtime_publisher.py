from app.domain.ports.realtime import RealtimePublisher, EventEnvelope
from app.presentation.websockets.connection_manager import ConnectionManager


class InMemoryRealtimePublisher(RealtimePublisher):
    def __init__(self, connection_manager: ConnectionManager) -> None:
        self._cm = connection_manager

    async def publish(
        self, classroom_id: str, event: EventEnvelope
    ) -> None:
        await self._cm.broadcast(
            classroom_id,
            {
                "type": event.type,
                "classroomId": event.classroom_id,
                "timestamp": event.timestamp,
                "payload": event.payload,
            },
        )
