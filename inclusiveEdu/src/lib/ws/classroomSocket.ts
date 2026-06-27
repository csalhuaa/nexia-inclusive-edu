import { env } from "@/config/env";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { ClassroomEvent, UserRole } from "@/types/classroom";

export type ClassroomEventHandler = (event: ClassroomEvent) => void;

export class ClassroomSocket {
  private socket: WebSocket | null = null;
  private pendingEvents: ClassroomEvent[] = [];
  private openHandlers: Array<() => void> = [];

  private normalizeEvent(raw: unknown): ClassroomEvent | null {
    const event = raw as { type?: string; payload?: Record<string, unknown> };
    if (!event?.type) return null;

    if (event.type === "transcript.final") {
      return {
        type: "subtitle",
        payload: {
          id: crypto.randomUUID(),
          text: String(event.payload?.text ?? ""),
          timestamp: Date.now(),
          isFinal: true,
        },
      };
    }

    if (event.type === "screen.explanation.ready" || event.type === "screenshot.processed") {
      return {
        type: "caption",
        payload: String(event.payload?.explanation ?? event.payload?.text ?? ""),
      };
    }

    if (event.type === "tts") {
      return {
        type: "caption",
        payload: String(event.payload?.text ?? ""),
      };
    }

    if (event.type === "classroom.joined") {
      const role = String(event.payload?.role ?? "deaf") as "teacher" | "blind" | "deaf";
      const frontendRole: UserRole =
        role === "blind" ? "blind-student" : role === "deaf" ? "deaf-student" : "teacher";
      return {
        type: "participant",
        payload: {
          id: String(event.payload?.userId ?? crypto.randomUUID()),
          name: String(event.payload?.userId ?? "Participante"),
          role: frontendRole,
          accessibility: role === "blind" ? "blind" : role === "deaf" ? "deaf" : "none",
          isOnline: true,
        },
      };
    }

    if (
      [
        "subtitle",
        "caption",
        "sign_gloss",
        "screen_frame",
        "screen_share_stopped",
        "teacher_audio_chunk",
        "teacher_speaking",
        "webrtc_ready",
        "webrtc_offer",
        "webrtc_answer",
        "webrtc_ice",
        "slide",
        "participant",
        "media",
        "session_end",
      ].includes(event.type)
    ) {
      return event as ClassroomEvent;
    }

    return null;
  }

  connect(sessionId: string, onEvent: ClassroomEventHandler, onClose?: () => void) {
    this.disconnect();

    const url = `${env.wsUrl}${API_ENDPOINTS.ws(sessionId)}`;
    this.socket = new WebSocket(url);

    this.socket.onopen = () => {
      const queued = [...this.pendingEvents];
      this.pendingEvents = [];
      queued.forEach((event) => this.send(event));
      this.openHandlers.forEach((handler) => handler());
    };

    this.socket.onmessage = (message) => {
      try {
        const event = this.normalizeEvent(JSON.parse(message.data as string));
        if (event) onEvent(event);
      } catch {
        // Ignorar mensajes malformados hasta que el backend esté listo
      }
    };

    this.socket.onclose = () => onClose?.();
    this.socket.onerror = () => onClose?.();
  }

  send(event: ClassroomEvent) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(event));
      return;
    }

    if (this.socket?.readyState === WebSocket.CONNECTING) {
      this.pendingEvents.push(event);
    }
  }

  onOpen(handler: () => void) {
    this.openHandlers.push(handler);
    if (this.socket?.readyState === WebSocket.OPEN) handler();
    return () => {
      this.openHandlers = this.openHandlers.filter((item) => item !== handler);
    };
  }

  disconnect() {
    this.socket?.close();
    this.socket = null;
    this.pendingEvents = [];
  }

  get isConnected() {
    return this.socket?.readyState === WebSocket.OPEN;
  }
}

export const classroomSocket = new ClassroomSocket();
