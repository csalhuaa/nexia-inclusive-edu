from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any


@dataclass
class EventEnvelope:
    type: str
    classroom_id: str
    timestamp: str
    payload: dict[str, Any]


class RealtimePublisher(ABC):
    @abstractmethod
    async def publish(self, classroom_id: str, event: EventEnvelope) -> None:
        ...
