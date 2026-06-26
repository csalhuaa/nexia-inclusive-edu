# InclusiveEdu Backend

Backend de accesibilidad educativa en tiempo real. Recibe audio y capturas de pantalla desde un aula, los procesa con IA (Groq) y los transmite vía WebSocket a los participantes.

## Arquitectura

Clean Architecture en 4 capas:

```
domain/ports/         ← Interfaces abstractas (STTProvider, VisionProvider, RealtimePublisher, ClassroomRepository)
application/use_cases/ ← Casos de uso (ingest_audio, ingest_screenshot, join_classroom, get_classroom_state)
application/services/   ← Servicios transversales (deduplicación de screenshots)
infrastructure/providers/ ← Implementaciones concretas (Groq STT, Groq Vision, GCP placeholder)
infrastructure/repositories/ ← Repositorios en memoria
infrastructure/realtime/     ← Publisher en memoria vía ConnectionManager
presentation/api/routes/     ← Endpoints REST (/health, /join, /state, /audio, /screenshots)
presentation/websockets/     ← WebSocket handler + ConnectionManager (broadcast por aula)
core/                ← Config (Settings via Pydantic) y DI (Container)
schemas/             ← Pydantic models de request/response y eventos
```

## Requisitos

- Python 3.12+
- Cuenta en [GroqCloud](https://console.groq.com) con API key

## Setup

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate     # Windows
# source .venv/bin/activate  # Linux/Mac

pip install -r requirements.txt
```

Crear `.env` a partir del ejemplo:

```bash
cp .env.example .env
# Editar GROQ_API_KEY con tu clave de GroqCloud
```

## Ejecutar

```bash
uvicorn main:app --reload --port 8000
```

Servidor en `http://localhost:8000`.

## Endpoints REST

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/health` | Health check |
| `POST` | `/api/v1/classrooms/{id}/join` | Unirse a un aula (`userId`, `role`) |
| `GET` | `/api/v1/classrooms/{id}/state` | Estado del aula (participantes, última actividad) |
| `POST` | `/api/v1/classrooms/{id}/audio` | Enviar audio (WAV) → devuelve transcripción |
| `POST` | `/api/v1/classrooms/{id}/screenshots` | Enviar captura (PNG) → devuelve explicación |

## WebSocket

Conectar: `ws://localhost:8000/ws/classrooms/{id}`

Eventos que recibe el cliente:

```json
{"type": "transcript.final", "classroom_id": "...", "userId": "...", "text": "...", "timestamp": "..."}
{"type": "screenshot.processed", "classroom_id": "...", "userId": "...", "explanation": "...", "timestamp": "..."}
```

## Testing

```bash
# Tests básicos (sin IA)
python test_e2e.py

# Tests completos con IA (requiere GROQ_API_KEY en .env)
python test_e2e.py --with-ai

# Solo WebSocket + IA
python test_e2e.py --with-ai --ws-only
```

## Variables de entorno

| Variable | Default | Descripción |
|----------|---------|-------------|
| `GROQ_API_KEY` | `""` | API key de GroqCloud |
| `GROQ_BASE_URL` | `https://api.groq.com/openai/v1` | Base URL de la API |
| `GROQ_STT_MODEL` | `whisper-large-v3-turbo` | Modelo de transcripción |
| `GROQ_VISION_MODEL` | `meta-llama/llama-4-scout-17b-16e-instruct` | Modelo de visión |
| `STT_PROVIDER` | `groq` | Proveedor de STT |
| `VISION_PROVIDER` | `groq` | Proveedor de visión |
| `API_PREFIX` | `/api/v1` | Prefijo de rutas REST |
| `APP_ENV` | `development` | Entorno |

## Proveedores

- **Groq** — implementación actual (STT con Whisper, visión con Llama-4-Scout)
- **GCP** — placeholder listo para implementar (Google Cloud Speech-to-Text + Vision API)
