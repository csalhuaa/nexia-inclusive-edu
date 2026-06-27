from typing import Any

from fastapi import WebSocket


class ConnectionManager:
    def __init__(self) -> None:
        self._rooms: dict[str, list[WebSocket]] = {}

    async def connect(self, classroom_id: str, ws: WebSocket) -> None:
        await ws.accept()
        if classroom_id not in self._rooms:
            self._rooms[classroom_id] = []
        self._rooms[classroom_id].append(ws)

    async def disconnect(self, classroom_id: str, ws: WebSocket) -> None:
        room = self._rooms.get(classroom_id)
        if not room:
            return
        if ws in room:
            room.remove(ws)
        if not room:
            del self._rooms[classroom_id]

    async def broadcast(
        self, classroom_id: str, event: dict[str, Any]
    ) -> None:
        await self.broadcast_except(classroom_id, event)

    async def broadcast_except(
        self,
        classroom_id: str,
        event: dict[str, Any],
        exclude: WebSocket | None = None,
    ) -> None:
        if classroom_id not in self._rooms:
            return
        dead: list[WebSocket] = []
        for ws in list(self._rooms[classroom_id]):
            if ws is exclude:
                continue
            try:
                await ws.send_json(event)
            except Exception:
                dead.append(ws)
        for ws in dead:
            await self.disconnect(classroom_id, ws)
