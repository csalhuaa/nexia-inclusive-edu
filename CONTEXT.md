# InclusiveEdu — Contexto completo del software

## 1. Visión general

**InclusiveEdu** es una plataforma educativa de accesibilidad en tiempo real. Un docente transmite audio y capturas de pantalla de su clase; los estudiantes reciben transcripciones (estudiante sordo) o narración por voz + descripciones de imagen (estudiante ciego) vía WebSocket.

**Repo:** monorepo de dos paquetes independientes sin tooling compartido.

```
/
├── backend/          → Python FastAPI (Clean Architecture)
├── inclusiveEdu/     → React + Vite + TypeScript (frontend)
```

---

## 2. Backend (`backend/`)

### 2.1 Stack

- Python 3.12+, FastAPI, Uvicorn
- Pydantic (v2) para schemas y settings
- httpx para llamadas HTTP asíncronas a Groq API
- `websockets` para WebSocket server-side
- Sin base de datos persistente (todo en memoria)
- Sin auth (todos los endpoints son públicos)

### 2.2 Arquitectura: Clean Architecture en 4 capas

```
domain/ports/              → Interfaces abstractas (ABC)
application/use_cases/     → Casos de uso (orquestan lógica)
infrastructure/            → Implementaciones concretas
presentation/              → REST endpoints + WebSocket
core/                      → Config (Pydantic Settings) + DI Container
schemas/                   → Pydantic models de request/response
```

### 2.3 Capa domain/ports — Contratos abstractos

| Puerto | Archivo | Método abstracto |
|--------|---------|------------------|
| `STTProvider` | `ports/stt.py` | `transcribe(audio_data, content_type) → str` |
| `VisionProvider` | `ports/vision.py` | `explain_screenshot(image_data) → str` |
| `ClassroomRepository` | `ports/repository.py` | CRUD de aulas, participantes, transcripciones, hashes |
| `RealtimePublisher` | `ports/realtime.py` | `publish(classroom_id, EventEnvelope)` |

**`ClassroomState`** (dataclass central):
```python
classroom_id, title, participants[], latest_transcript, latest_screen_explanation, latest_screenshot_hash
```

### 2.4 Capa application/use_cases — Casos de uso

| Use case | Archivo | Dependencias | Acción |
|----------|---------|-------------|--------|
| `CreateClassroomUseCase` | `create_classroom.py` | `Repository` | Genera código de 6 caracteres (uppercase + digits), crea aula |
| `JoinClassroomUseCase` | `join_classroom.py` | `Repository + RealtimePublisher` | Agrega participante, emite `classroom.joined` |
| `IngestAudioUseCase` | `ingest_audio.py` | `STTProvider + Repository + RealtimePublisher` | Transcribe audio, guarda transcript, emite `transcript.final` |
| `IngestScreenshotUseCase` | `ingest_screenshot.py` | `VisionProvider + Repository + RealtimePublisher + DeduplicationService` | Analiza imagen con IA, guarda explanation, emite `screenshot.processed`. Tiene rate-limiting interno (8s entre análisis) y lock por aula |
| `GetClassroomStateUseCase` | `get_classroom_state.py` | `Repository` | Retorna el estado actual del aula |

### 2.5 Capa infrastructure — Implementaciones

#### Proveedores de IA

**Groq STT** (`providers/groq/stt.py`):
- Usa `httpx.AsyncClient` para POST multipart a `{base_url}/audio/transcriptions`
- Modelo: `whisper-large-v3-turbo`
- **⚠️ Quirk:** El filename del upload debe incluir `.wav` o `.webm` porque Groq inspecciona la extensión, no el content-type
- Content-type determina si usa `audio.wav` o `audio.webm` como filename

**Groq Vision** (`providers/groq/vision.py`):
- Envía imagen como base64 data URI a `{base_url}/chat/completions`
- Modelo: `meta-llama/llama-4-scout-17b-16e-instruct`
- **⚠️ Quirk:** Groq requiere imágenes de al menos 2×2 píxeles (1×1 da 400)
- System prompt en español para descripciones educativas (pizarra, diapositivas, texto, fórmulas)
- Limpia la respuesta con regex: elimina tags `<think>`, markdown, y frases como "the user/prompt/image"
- Rate limit 429 lanza `VisionRateLimitError`

**GCP** (`providers/gcp_placeholder/`): Placeholder listo para implementar Google Cloud STT + Vision API.

#### Repositorio

**InMemoryClassroomRepository** (`repositories/in_memory_classroom_repository.py`):
- `dict[str, ClassroomState]` en memoria
- **⚠️ Los datos se pierden al reiniciar el servidor**
- Método `_ensure()` que crea automáticamente un aula si no existe (comportamiento permisivo para MVP)

#### Realtime Publisher

**InMemoryRealtimePublisher** (`realtime/in_memory_realtime_publisher.py`):
- Delega en `ConnectionManager.broadcast()` que itera sobre WebSocket connections por aula
- Convierte `EventEnvelope` a dict con camelCase keys (`classroomId` en lugar de `classroom_id`)

#### Servicios transversales

**DeduplicationService** (`application/services/deduplication.py`):
- SHA256 hash de la imagen completa
- Se compara con `latest_screenshot_hash` del aula
- Si el hash coincide, se salta el análisis de IA

### 2.6 Capa presentation — Endpoints

#### REST API

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/health` | Health check → `{"status": "ok"}` |
| `POST` | `/api/v1/classrooms` | Crear aula (body: `{title, teacherName?}`) → código 6 chars |
| `POST` | `/api/v1/classrooms/{id}/join` | Unirse (body: `{userId, role, displayName?}`). Roles: `teacher`, `blind`, `deaf` |
| `GET` | `/api/v1/classrooms/{id}/state` | Estado actual |
| `POST` | `/api/v1/classrooms/{id}/audio` | Subir audio (multipart `file`) → `{transcript}` |
| `POST` | `/api/v1/classrooms/{id}/screenshots` | Subir screenshot (multipart `file`, query `force`) → `{explanation, duplicate, rateLimited?}` |

**Role mapping backend ↔ frontend:**
- `blind` → `blind-student`
- `deaf` → `deaf-student`
- `teacher` → `teacher`

**ALLOWED_ROLES:** `{"teacher", "blind", "deaf"}`

**CORS:** Solo permite `http://localhost:5173`

#### WebSocket

**Endpoint:** `ws://localhost:8000/ws/classrooms/{classroom_id}`

**Eventos que envía el servidor:**
| Tipo | Origen | Payload |
|------|--------|---------|
| `transcript.final` | IngestAudioUseCase | `{text: string}` |
| `screenshot.processed` | IngestScreenshotUseCase | `{explanation: string}` |
| `classroom.joined` | JoinClassroomUseCase | `{userId, role}` |

**Comportamiento:** El WebSocket hace relay de cualquier mensaje JSON que recibe del cliente a los demás participantes del aula (broadcast excepto el emisor). Esto permite signaling WebRTC.

#### DI Container

**`app.core.container.Container`** — Singleton global:
```
Settings → GroqSTTProvider + GroqVisionProvider
         → InMemoryClassroomRepository + InMemoryRealtimePublisher(ConnectionManager)
         → DeduplicationService
         → Use cases (CreateClassroom, JoinClassroom, IngestAudio, IngestScreenshot, GetClassroomState)
```

Se accede vía `get_container()` (lazy singleton con `lru_cache` para settings, variable global para container).

### 2.7 Testing

**Archivo:** `test_e2e.py` — 12 tests contra servidor en ejecución.

| Comando | Alcance |
|---------|---------|
| `python test_e2e.py` | Tests REST básicos (health, create, join, state, dedup) |
| `python test_e2e.py --with-ai` | Incluye audio transcription, screenshot vision, WebSocket |
| `python test_e2e.py --with-ai --ws-only` | Solo WebSocket + IA |

Requiere `GROQ_API_KEY` en `.env` para `--with-ai`.

**Helpers de test:**
- `make_minimal_wav(500)` — WAV de 500ms en silencio (16kHz, mono, 16-bit)
- `make_minimal_png(4, 4)` — PNG verde de 4×4px (Groq requiere ≥2×2)

### 2.8 Configuración (.env)

| Variable | Default | Notas |
|----------|---------|-------|
| `GROQ_API_KEY` | `""` | Requerida para IA |
| `GROQ_BASE_URL` | `https://api.groq.com/openai/v1` | |
| `GROQ_STT_MODEL` | `whisper-large-v3-turbo` | |
| `GROQ_VISION_MODEL` | `meta-llama/llama-4-scout-17b-16e-instruct` | ⚠️ `.env.example` tiene valor desactualizado |
| `STT_PROVIDER` | `groq` | |
| `VISION_PROVIDER` | `groq` | |
| `API_PREFIX` | `/api/v1` | |
| `APP_ENV` | `development` | |

### 2.9 Known issues del backend

- **In-memory:** Reiniciar el servidor borra todas las aulas
- **No auth:** Cualquiera puede crear/unirse/ingestar en cualquier aula
- **Vision model en `.env.example`** está desactualizado (`qwen/qwen3.6-27b`); el default real en `config.py` es `meta-llama/llama-4-scout-17b-16e-instruct`
- **Deduplication** usa SHA256 de la imagen completa (no dHash perceptual como dice DEVELOPMENT_CONTEXT.json)

---

## 3. Frontend (`inclusiveEdu/`)

### 3.1 Stack

- React 19, TypeScript 6, Vite 8
- Tailwind CSS 4 (PostCSS con `@tailwindcss/postcss`)
- react-router-dom v7 (BrowserRouter)
- pnpm 11 (package manager exclusivo)
- Sin test suite, sin storybook, sin state management externo

### 3.2 Estructura del frontend

```
src/
├── App.tsx                   ← Router + AppProviders
├── main.tsx                  ← Entrypoint
├── index.css                 ← Tailwind + design tokens (ClearView Inclusive)
├── config/env.ts             ← Env vars VITE_*
├── types/classroom.ts        ← Tipos compartidos
├── constants/
│   ├── routes.ts             ← Rutas: /, /docente, /estudiante/sordo, /estudiante/ciego
│   └── assets.ts             ← URLs de imágenes demo (interpreter, teacher camera, etc.)
├── context/
│   ├── ClassroomProvider.tsx  ← Estado global de la sesión (585 líneas)
│   ├── classroomContext.ts    ← Context + tipos del provider
│   └── ToastProvider.tsx      ← Sistema de notificaciones
├── hooks/
│   ├── useClassroom.ts       ← Hook para consumir ClassroomContext
│   ├── useSessionGuard.ts    ← Redirige si no hay sesión o rol incorrecto
│   └── useToast.ts           ← Hook para ToastContext
├── pages/
│   ├── HomePage.tsx          ← Landing + role selection
│   ├── TeacherPage.tsx       ← Panel del docente
│   ├── DeafStudentPage.tsx   ← Estudiante sordo (LSC + subtítulos)
│   └── BlindStudentPage.tsx  ← Estudiante ciego (narración + captions)
├── features/                 ← Feature-specific components
│   ├── home/                 ← RoleSelection, TeacherSetupDialog
│   ├── teacher/              ← ClassControlsBar, TeacherCameraPanel, TeacherWhiteboard, etc.
│   ├── deaf-student/         ← LiveSubtitlesPanel, SignLanguagePanel, StudentWhiteboard
│   └── blind-student/        ← LiveCaptionPanel, AudioStatusBar, ClassActionButtons
├── components/               ← UI comunes
│   ├── layout/               ← AppLayout, TopNavBar, Footer
│   ├── classroom/            ← SessionBar, SessionWidgets (PageLoader, etc.)
│   └── ui/                   ← Button, Icon, ToastContainer, etc.
├── lib/
│   ├── api/                  ← Cliente REST (client.ts, endpoints.ts, classroom.ts)
│   ├── ws/classroomSocket.ts ← Singleton WebSocket (ClassroomSocket)
│   ├── rtc/audioBridge.ts    ← WebRTC para audio docente→estudiante ciego
│   └── demo/classroomDemo.ts ← Datos de demostración offline
└── providers/
    └── AppProviders.tsx       ← ToastProvider + ClassroomProvider
```

### 3.3 Flujo de navegación

```
/ (HomePage)
├── "Impartir Clase" → TeacherSetupDialog (cámara+mic) → /docente (TeacherPage)
└── "Unirse a Clase" → ingresa código → elige rol:
    ├── Estudiante Sordo → /estudiante/sordo (DeafStudentPage)
    └── Estudiante Ciego → /estudiante/ciego (BlindStudentPage)
```

### 3.4 Tipos principales (`types/classroom.ts`)

```typescript
UserRole = "teacher" | "deaf-student" | "blind-student"
ConnectionMode = "offline" | "demo" | "api" | "websocket"
SessionStatus = "idle" | "connecting" | "live" | "ended"

ClassroomSession {
  id, code, title, status, role, slideIndex, slides[],
  participants[], media, subtitles[], currentCaption,
  interpreterActive, connectionMode, subtitleSpeed
}

ClassroomEvent (discriminated union):
  subitle | caption | sign_gloss | webrtc_* | slide | participant | media | session_end
```

### 3.5 ClassroomProvider — Cerebro del frontend

El `ClassroomProvider` es el componente central que maneja todo el estado de la sesión (~585 líneas). Responsabilidades:

1. **Conexión al backend:** Detecta `apiAvailable`, conecta WebSocket, envía/recibe eventos
2. **Modo demo:** Si el backend no responde y `VITE_ENABLE_DEMO_FALLBACK=true`, usa datos simulados
3. **Subtítulos:** `pushSubtitle()` acumula hasta 20 entradas
4. **Narración por voz (TTS):** Usa `SpeechSynthesis` API con voz en español
   - `queueBoardNarration()` — cola con debounce de 18s entre narraciones
   - Sanitiza texto eliminando tags `<think>`, URLs, markdown
5. **Señas simuladas:** `buildSimulatedSignGloss()` traduce palabras clave a gloss (LSP)
6. **WebRTC:** `announceStudentAudioReady()` + `handleRtcEvent()` para audio en vivo
7. **Controles:** `toggleMedia()`, `nextSlide()`, `prevSlide()`, `toggleBoardCamera()`, etc.

### 3.6 WebSocket Client (`lib/ws/classroomSocket.ts`)

**Singleton** `ClassroomSocket` — conecta a `{VITE_WS_URL}/classrooms/{sessionId}`.

**Normalización de eventos del backend:**
| Backend event | Frontend event |
|--------------|----------------|
| `transcript.final` | `subtitle` |
| `screenshot.processed` / `screen.explanation.ready` | `caption` |
| `classroom.joined` | `participant` (mapea `blind→blind-student`, `deaf→deaf-student`) |
| `tts` | `caption` |
| `subtitle`, `caption`, `sign_gloss`, `webrtc_*`, etc. | Pasa-through |

Tiene cola de mensajes pendientes: eventos enviados mientras la conexión no está abierta se encolan y reenvían al abrir.

### 3.7 API Client (`lib/api/`)

- `client.ts`: `apiRequest<T>(path, options)` — fetch wrapper con manejo de errores, Content-Type JSON
- `endpoints.ts`: Constantes de rutas (`/health`, `/api/v1/classrooms/{id}`)
- `classroom.ts`: Funciones específicas:
  - `createClassroom(payload)` → POST a classrooms
  - `joinClassroom(payload)` → POST join con mapeo de roles
  - `uploadScreenshot(id, blob)` → POST multipart con FormData
  - `uploadAudio(id, blob)` → POST multipart con FormData
  - Mapeo de roles: `blind-student → blind`, `deaf-student → deaf`

### 3.8 WebRTC Audio Bridge (`lib/rtc/audioBridge.ts`)

**Comunicación docente → estudiante ciego** via WebRTC con signaling sobre WebSocket.

**Flujo:**
1. Estudiante ciego se conecta → envía `webrtc_ready` (con reintento cada 3s por hasta 15s)
2. Docente recibe `webrtc_ready` → crea `RTCPeerConnection` con el stream de audio del micrófono, genera offer, envía `webrtc_offer`
3. Estudiante recibe `webrtc_offer` → establece remote description, genera answer, envía `webrtc_answer`
4. Ambos intercambian ICE candidates via `webrtc_ice`
5. Estudiante recibe audio remoto → lo reproduce en un `AudioElement` oculto

**Config STUN:** `stun:stun.l.google.com:19302`

### 3.9 Demo mode (`lib/demo/classroomDemo.ts`)

Cuando el backend no está disponible y `VITE_ENABLE_DEMO_FALLBACK=true` (default), el frontend funciona completamente offline:

- **5 slides** de ejemplo (matemáticas y biología celular)
- **3 participantes** demo (María S. deaf, Juan P. blind, Ana L. deaf)
- **10 frases de subtítulos** que rotan cada 6s
- **5 captions** de narración visual
- `createDemoSession(title)` genera sesión con UUID + código aleatorio
- `buildSessionSummary()` exporta resumen a archivo de texto

### 3.10 Design System

Tailwind CSS 4 con tema personalizado "ClearView Inclusive":

- **Colores:** Esquema Material 3 adaptado (primary azul, secondary teal, tertiary naranja)
- **Tipografía:** Atkinson Hyperlegible Next (títulos), Inter (cuerpo) — ambas accesibles
- **Espaciado:** Sistema basado en `unit=8px`, `gutter=24px`
- **Iconos:** Google Material Symbols (clase `material-symbols-outlined`)
- **Accesibilidad:** `focus-visible` outline de 3px, `focus-ring` utility, scrollbar personalizado

### 3.11 Env vars del frontend

| Variable | Default | Descripción |
|----------|---------|-------------|
| `VITE_API_URL` | `http://localhost:8000` | URL base del backend REST |
| `VITE_WS_URL` | `ws://localhost:8000/ws` | URL base del WebSocket |
| `VITE_ENABLE_DEMO_FALLBACK` | `true` | Usar demo si backend no disponible |

---

## 4. Integración backend ↔ frontend

### 4.1 Flujo completo

```
1. Frontend POST /api/v1/classrooms          → Crea aula, recibe código
2. Frontend POST /api/v1/classrooms/{id}/join → Se une como participante
3. Frontend conecta WS a /ws/classrooms/{id}
4. Docente sube audio   POST /audio        → Backend transcribe con Groq → broadcast transcript.final
5. Docente sube screenshot POST /screenshots → Backend analiza con Groq → broadcast screenshot.processed
6. Estudiante ciego recibe caption vía WS → TTS narración en español
7. Estudiante sordo recibe subtitle vía WS → muestra en pantalla + simula señas LSC
8. WebRTC signaling via WS (webrtc_offer/answer/ice/ready)
```

### 4.2 Mapeo de eventos WebSocket

```
Backend (Python)                  Frontend (TypeScript)
─────────────────                ────────────────────
transcript.final                 → subtitle (con id+timetamp)
screenshot.processed             → caption
classroom.joined                 → participant (con role mapeado)
                                  ─
webrtc_* (relay)                 → webrtc_* (passthrough)
slide                            → slide
media                            → media
session_end                      → session_end
```

### 4.3 Mapeo de roles

```
Backend role    Frontend role
────────────    ─────────────
teacher         teacher
blind           blind-student
deaf            deaf-student
```

---

## 5. Quirks y advertencias

### Backend
- **Groq STT requiere extensión `.wav`** en el filename del upload (no basta con content-type)
- **Groq Vision requiere imágenes ≥ 2×2 píxeles** (1×1 retorna 400)
- **Sin persistencia:** reiniciar el servidor = perder todas las aulas
- **Sin autenticación:** cualquier endpoint es público
- **CORS restrictivo:** solo `http://localhost:5173`
- `.env.example` tiene `GROQ_VISION_MODEL` desactualizado

### Frontend
- **Sin tests** — no hay suite de pruebas
- **pnpm obligatorio** — npm/yarn no funcionan (lockfile pnpm-lock.yaml)
- **VITE_ENABLE_DEMO_FALLBACK=true** por defecto — puede enmascarar problemas de conexión
- **TTS depende del navegador** — SpeechSynthesis puede no tener voz español en todos los SO
- **WebRTC solo STUN** — sin servidor TURN, puede fallar en redes restrictivas
- **Modo demo usa timers** — `setInterval` de 6s para simular subtítulos; limpiar al salir

---

## 6. Comandos de desarrollo

### Backend
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
# Editar .env con GROQ_API_KEY
uvicorn main:app --reload --port 8000
python test_e2e.py
python test_e2e.py --with-ai
```

### Frontend
```bash
cd inclusiveEdu
pnpm install
pnpm dev          # http://localhost:5173
pnpm build        # tsc -b && vite build
pnpm lint         # eslint .
```

### Integración completa
```bash
# Terminal 1
cd backend && uvicorn main:app --reload --port 8000

# Terminal 2
cd inclusiveEdu && pnpm dev

# Abrir http://localhost:5173 → /docente → crear sala → compartir código
# Abrir otra pestaña → /estudiante/sordo o /estudiante/ciego → ingresar código
```

---

## 7. Próximos pasos (del DEVELOPMENT_CONTEXT.json)

- Auth (JWT o sesiones)
- Base de datos persistente (PostgreSQL/SQLite con SQLAlchemy)
- Redis pub/sub para escalar WebSocket horizontalmente
- Implementar provider GCP (google-cloud-speech + vision)
- Dockerizar
- CI/CD pipeline
- Logging estructurado
- Rate limiting
