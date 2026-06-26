# InclusiveEdu — agent instructions

Two-package monorepo: `backend/` (Python/FastAPI) + `inclusiveEdu/` (React/Vite/TypeScript). No root-wide scripts or CI.

## Backend (`backend/`)

**Stack:** Python 3.12+, FastAPI, Uvicorn, Pydantic, httpx, WebSockets  
**Architecture:** Clean Architecture — `domain/ports/` → `application/use_cases/` → `infrastructure/providers/` → `presentation/api/`  
**DI:** Global singleton via `app.core.container.get_container()`

| Action | Command |
|--------|---------|
| Install | `pip install -r requirements.txt` (inside `.venv`) |
| Run dev | `uvicorn main:app --reload --port 8000` |
| Test (basic) | `python test_e2e.py` |
| Test (with AI) | `python test_e2e.py --with-ai` |
| WS only | `python test_e2e.py --with-ai --ws-only` |

**Environment:** Copy `backend/.env.example` → `backend/.env`, set `GROQ_API_KEY`.

**Critical quirks:**
- Groq STT: uploaded filename MUST include `.wav` extension (e.g., `audio.wav`), not just correct content-type
- Groq vision: images must be ≥ 2x2 pixels (test helper uses 4x4 PNGs)
- **No auth** on any endpoint; all public
- **In-memory only** — restarting the server clears all classrooms
- CORS allows only `http://localhost:5173`
- `.env.example` vision model may be stale; canonical default is `meta-llama/llama-4-scout-17b-16e-instruct` (see `app/core/config.py:15`)

## Frontend (`inclusiveEdu/`)

**Stack:** React 19, TypeScript 6, Vite 8, Tailwind CSS 4, pnpm 11, react-router-dom v7  
**Package manager:** `pnpm` (not npm)

| Action | Command |
|--------|---------|
| Install | `pnpm install` |
| Dev | `pnpm dev` (port 5173) |
| Build | `pnpm build` (runs `tsc -b && vite build`) |
| Lint | `pnpm lint` |

**Aliases:** `@/` → `src/` (Vite resolve + tsconfig paths).  
**Routes:** `/` (home), `/docente` (teacher), `/estudiante/sordo` (deaf student), `/estudiante/ciego` (blind student).  
**Env vars:** `VITE_API_URL` (default `http://localhost:8000`), `VITE_WS_URL` (default `ws://localhost:8000/ws`), `VITE_ENABLE_DEMO_FALLBACK` (default `true`).  
**Demo mode:** Enabled by default — works offline without the backend via `lib/demo/classroomDemo.ts`.  
**No test suite** exists for the frontend.

## Key integration

- REST API at `/api/v1/classrooms/{id}` — join, state, audio, screenshots
- WebSocket at `/ws/classrooms/{id}` — broadcasts `transcript.final` and `screenshot.processed` events
- WebRTC signaling for teacher→blind-student live audio via WebSocket (`webrtc_offer/answer/ice/ready`)
- Full integration: start backend → start frontend → open `/docente` → join room → upload audio/screenshots

## Design notes

- `backend/app/infrastructure/repositories/` is in-memory (`dict`-backed); swap to DB for persistence
- `backend/app/infrastructure/realtime/` delegates to `ConnectionManager.broadcast()`; swap to Redis for scaling
- `backend/app/infrastructure/providers/gcp_placeholder/` is a stub ready for Google Cloud implementation
- `backend/app/application/services/deduplication.py` uses dHash + LRU to skip re-processing identical screenshots
- All backend Python imports use `app.` absolute prefix (no relative imports observed)
