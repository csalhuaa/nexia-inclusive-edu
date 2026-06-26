"""
End-to-end test for Inclusive EDU API.

Usage:
    # Terminal 1: start the server
    uvicorn main:app --reload --port 8000

    # Terminal 2: run tests
    python test_e2e.py                          # basic tests (skip AI)
    python test_e2e.py --with-ai                 # full tests with Groq AI
    python test_e2e.py --with-ai --ws-only       # only WebSocket + AI
    python test_e2e.py --help                    # see all options

Requires: httpx, websockets (both in requirements.txt)
"""

import argparse
import asyncio
import io
import json
import os
import struct
import sys
import time
import wave
import zlib

import httpx

BASE_URL = os.getenv("API_BASE_URL", "http://localhost:8000")
ROOM = os.getenv("TEST_CLASSROOM_ID", "test-room-e2e")
PASS = 0
FAIL = 0


def check(label: str, ok: bool, detail: str = ""):
    global PASS, FAIL
    status = "PASS" if ok else "FAIL"
    if ok:
        PASS += 1
    else:
        FAIL += 1
    msg = f"  [{status}] {label}"
    if detail:
        msg += f"  ({detail})" if ok else f"\n          {detail}"
    print(msg)


def make_minimal_wav(duration_ms: int = 500) -> bytes:
    sample_rate = 16000
    num_samples = int(sample_rate * duration_ms / 1000)
    with io.BytesIO() as buf:
        with wave.open(buf, "wb") as wf:
            wf.setnchannels(1)
            wf.setsampwidth(2)
            wf.setframerate(sample_rate)
            wf.writeframes(b"\x00\x00" * num_samples)
        return buf.getvalue()


def make_minimal_png(width: int = 4, height: int = 4, r: int = 0, g: int = 255, b: int = 0) -> bytes:
    raw = b""
    for _ in range(height):
        raw += b"\x00"
        for _ in range(width):
            raw += bytes([r, g, b])
    compressed = zlib.compress(raw)

    def chunk(chunk_type: bytes, data: bytes) -> bytes:
        c = chunk_type + data
        crc = struct.pack(">I", zlib.crc32(c) & 0xFFFFFFFF)
        return struct.pack(">I", len(data)) + c + crc

    return (b"\x89PNG\r\n\x1a\n"
            + chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0))
            + chunk(b"IDAT", compressed)
            + chunk(b"IEND", b""))


async def test_health(client: httpx.AsyncClient):
    r = await client.get("/health")
    check("GET /health returns 200", r.status_code == 200)
    check("health body has status=ok", r.json().get("status") == "ok")


async def test_create_classroom(client: httpx.AsyncClient):
    global ROOM
    r = await client.post("/api/v1/classrooms", json={"title": "Clase E2E"})
    check("POST create classroom returns 200", r.status_code == 200)
    data = r.json()
    ROOM = data.get("code", ROOM)
    check("create response has 6-char code", len(ROOM) == 6, ROOM)


async def test_join_classroom(client: httpx.AsyncClient):
    r = await client.post(
        f"/api/v1/classrooms/{ROOM}/join",
        json={"userId": "teacher-1", "role": "teacher"},
    )
    check("POST join teacher returns 200", r.status_code == 200)
    data = r.json()
    check("join response has userId", data.get("userId") == "teacher-1")

    r2 = await client.post(
        f"/api/v1/classrooms/{ROOM}/join",
        json={"userId": "student-1", "role": "blind"},
    )
    check("POST join blind student returns 200", r2.status_code == 200)


async def test_classroom_state(client: httpx.AsyncClient):
    r = await client.get(f"/api/v1/classrooms/{ROOM}/state")
    check("GET state returns 200", r.status_code == 200)
    data = r.json()
    check("state has classroomId", data.get("classroomId") == ROOM)
    check("state has 2 participants", len(data.get("participants", [])) == 2)
    check("participant is teacher", data["participants"][0]["role"] == "teacher")


async def test_audio_transcription(client: httpx.AsyncClient):
    wav = make_minimal_wav(500)
    r = await client.post(
        f"/api/v1/classrooms/{ROOM}/audio",
        files={"file": ("test.wav", wav, "audio/wav")},
    )
    ok = r.status_code == 200
    check("POST audio returns 200", ok, str(r.json()))
    if ok:
        transcript = r.json().get("transcript", "")
        check("audio transcript is non-empty", bool(transcript), transcript[:80])


async def test_screenshot_vision(client: httpx.AsyncClient):
    png = make_minimal_png()
    r = await client.post(
        f"/api/v1/classrooms/{ROOM}/screenshots",
        files={"file": ("test.png", png, "image/png")},
    )
    ok = r.status_code == 200
    check("POST screenshot returns 200", ok, str(r.json()))
    if ok:
        data = r.json()
        check("screenshot not duplicate", not data.get("duplicate", True), str(data))
        check("screenshot has explanation", bool(data.get("explanation")),
              (data.get("explanation") or "")[:80])


async def test_screenshot_dedup(client: httpx.AsyncClient):
    png = make_minimal_png()
    created = await client.post("/api/v1/classrooms", json={"title": "Dedup E2E"})
    classroom_id = created.json().get("code", ROOM)
    r1 = await client.post(
        f"/api/v1/classrooms/{classroom_id}/screenshots",
        files={"file": ("test.png", png, "image/png")},
    )
    r2 = await client.post(
        f"/api/v1/classrooms/{classroom_id}/screenshots",
        files={"file": ("test.png", png, "image/png")},
    )
    check("dedup: first call is not duplicate", r1.status_code == 200 and not r1.json().get("duplicate"))
    check("dedup: second call is duplicate", r2.status_code == 200 and r2.json().get("duplicate") is True)


async def test_websocket_connect():
    global ROOM
    url = BASE_URL.replace("http://", "ws://").replace("https://", "wss://")
    async with httpx.AsyncClient() as client:
        from websockets.asyncio.client import connect as ws_connect

        created = await client.post(f"{BASE_URL}/api/v1/classrooms", json={"title": "WS E2E"})
        if created.status_code == 200:
            ROOM = created.json().get("code", ROOM)

        async with ws_connect(f"{url}/ws/classrooms/{ROOM}") as ws:
            check("WebSocket connected", True)

            wav = make_minimal_wav(500)
            r = await client.post(
                f"{BASE_URL}/api/v1/classrooms/{ROOM}/audio",
                files={"file": ("test.wav", wav, "audio/wav")},
            )
            if r.status_code != 200:
                check("WebSocket: audio ingested", False, str(r.json()))
                return

            transcript = r.json().get("transcript", "")
            check("WebSocket: audio transcribed", bool(transcript), transcript[:60])

            try:
                msg = await asyncio.wait_for(ws.recv(), timeout=15)
                event = json.loads(msg) if isinstance(msg, (str, bytes)) else msg
                check("WebSocket: received event", True, f"type={event.get('type')}")
                check("WebSocket: event is transcript.final",
                      event.get("type") == "transcript.final",
                      json.dumps(event, ensure_ascii=False)[:120])
            except asyncio.TimeoutError:
                check("WebSocket: no event received (timeout)", False)


async def main():
    parser = argparse.ArgumentParser(description="Test Inclusive EDU API")
    parser.add_argument("--with-ai", action="store_true",
                        help="Include AI-dependent tests (audio, vision)")
    parser.add_argument("--ws-only", action="store_true",
                        help="Only run WebSocket test")
    parser.add_argument("--base-url", default=BASE_URL, help="API base URL")
    args = parser.parse_args()

    base = args.base_url
    has_grok = bool(os.getenv("GROQ_API_KEY"))

    print(f"Testing against: {base}")
    print(f"GROQ_API_KEY: {'✓ set' if has_grok else '✗ not set'}")
    print()

    async with httpx.AsyncClient(base_url=base) as client:
        if not args.ws_only:
            print("=== Basic REST tests ===")
            await test_health(client)
            await test_create_classroom(client)
            await test_join_classroom(client)
            await test_classroom_state(client)
            await test_screenshot_dedup(client)
            print()

        if args.with_ai and has_grok:
            print("=== AI Provider tests ===")
            await test_audio_transcription(client)
            await test_screenshot_vision(client)
            print()

            print("=== WebSocket test ===")
            await test_websocket_connect()
            print()
        elif args.with_ai and not has_grok:
            print("SKIP: --with-ai requires GROQ_API_KEY env var")
            print()

    print(f"{'='*40}")
    print(f"  PASS: {PASS}  |  FAIL: {FAIL}")
    print(f"{'='*40}")
    return 0 if FAIL == 0 else 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
