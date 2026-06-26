import json

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.core.container import get_container

router = APIRouter()


@router.websocket("/ws/classrooms/{classroom_id}")
async def classroom_websocket(
    websocket: WebSocket,
    classroom_id: str,
):
    container = get_container()
    cm = container.connection_manager

    await cm.connect(classroom_id, websocket)
    try:
        while True:
            message = await websocket.receive_text()
            try:
                event = json.loads(message)
            except json.JSONDecodeError:
                continue
            if isinstance(event, dict):
                await cm.broadcast_except(classroom_id, event, exclude=websocket)
    except WebSocketDisconnect:
        pass
    finally:
        await cm.disconnect(classroom_id, websocket)
