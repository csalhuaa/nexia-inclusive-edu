from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.container import get_container, get_settings
from app.presentation.api.routes import health, classrooms, audio, screenshots
from app.presentation.websockets.classroom_socket import router as ws_router


def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(title="Inclusive EDU API", version="0.1.0")

    app.add_middleware(
        CORSMiddleware,
        allow_origin_regex="https?://.*",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.state.container = get_container()
    app.state.settings = settings

    app.include_router(health.router)
    app.include_router(classrooms.router)
    app.include_router(audio.router)
    app.include_router(screenshots.router)
    app.include_router(ws_router)

    return app


app = create_app()
