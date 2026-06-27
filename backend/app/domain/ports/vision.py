from abc import ABC, abstractmethod


class VisionProvider(ABC):
    @abstractmethod
    async def explain_screenshot(self, image_data: bytes) -> dict[str, str]:
        ...
