import httpx

from app.domain.ports.stt import STTProvider


class GroqSTTProvider(STTProvider):
    def __init__(self, api_key: str, base_url: str, model: str) -> None:
        self._api_key = api_key
        self._base_url = base_url
        self._model = model

    async def transcribe(self, audio_data: bytes, content_type: str) -> str:
        if not self._api_key:
            raise ValueError("GROQ_API_KEY not configured")

        filename = "audio.webm" if "webm" in content_type else "audio.wav"

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self._base_url}/audio/transcriptions",
                headers={"Authorization": f"Bearer {self._api_key}"},
                files={"file": (filename, audio_data, content_type)},
                data={
                    "model": self._model,
                    "response_format": "json",
                    "language": "es",
                    "temperature": "0.0",
                    "prompt": "Esta es una clase en español. Ignora el silencio y ruido de fondo. No traduzcas.",
                },
                timeout=60,
            )
            response.raise_for_status()
            return response.json()["text"]
