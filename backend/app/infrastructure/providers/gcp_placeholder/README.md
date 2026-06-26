# GCP Provider Placeholder

Para agregar GCP como provider real, crea estos archivos siguiendo los mismos contratos:

## STT — GCP Speech-to-Text

`infrastructure/providers/gcp/stt.py`:

```python
from google.cloud import speech
from app.domain.ports.stt import STTProvider

class GCPSTTProvider(STTProvider):
    async def transcribe(self, audio_data: bytes, content_type: str) -> str:
        client = speech.SpeechClient()
        audio = speech.RecognitionAudio(content=audio_data)
        config = speech.RecognitionConfig(
            encoding=speech.RecognitionConfig.AudioEncoding.WEBM_OPUS,
            language_code="es-ES",
        )
        response = client.recognize(config=config, audio=audio)
        return response.results[0].alternatives[0].transcript
```

## Vision — GCP Vision AI

`infrastructure/providers/gcp/vision.py`:

```python
from google.cloud import vision
from app.domain.ports.vision import VisionProvider

class GCPVisionProvider(VisionProvider):
    async def explain_screenshot(self, image_data: bytes) -> str:
        client = vision.ImageAnnotatorClient()
        image = vision.Image(content=image_data)
        response = client.label_detection(image=image)
        labels = [label.description for label in response.label_annotations]
        return f"Elementos detectados: {', '.join(labels[:5])}"
```

## Registro

En `core/container.py` agrega al `_build_*` correspondiente:

```python
elif self.settings.stt_provider == "gcp":
    return GCPSTTProvider()
```

Agrega `GCP_CREDENTIALS_PATH` a `Settings` si es necesario y las dependencias a `requirements.txt`.
