import type { SignGlossPayload } from "@/features/deaf-student/types/signEvents";

export type UserRole = "teacher" | "deaf-student" | "blind-student";

export type SessionStatus = "idle" | "connecting" | "live" | "ended";

export type ConnectionMode = "offline" | "demo" | "api" | "websocket";

export type ParticipantAccessibility = "deaf" | "blind" | "none";

export type Participant = {
  id: string;
  name: string;
  role: UserRole;
  accessibility?: ParticipantAccessibility;
  isOnline: boolean;
  lastSeenAt?: number;
};

export type SlideContent = {
  id: string;
  title: string;
  topic: string;
  body: string;
  expression?: string;
  imageUrl?: string;
};

export type SubtitleEntry = {
  id: string;
  text: string;
  timestamp: number;
  isFinal: boolean;
};

export type MediaState = {
  audio: boolean;
  video: boolean;
  screenShare: boolean;
  boardCamera: boolean;
};

export type ClassroomSession = {
  id: string;
  code: string;
  title: string;
  status: SessionStatus;
  role: UserRole | null;
  slideIndex: number;
  slides: SlideContent[];
  participants: Participant[];
  media: MediaState;
  subtitles: SubtitleEntry[];
  currentCaption: string;
  interpreterActive: boolean;
  connectionMode: ConnectionMode;
  subtitleSpeed: number;
};

export type JoinClassroomPayload = {
  code: string;
  role: UserRole;
  displayName?: string;
};

export type CreateClassroomPayload = {
  title: string;
  teacherName?: string;
};

export type ScreenFramePayload = {
  data: string;
  width: number;
  height: number;
};

export type ClassroomEvent =
  | { type: "subtitle"; payload: SubtitleEntry }
  | { type: "caption"; payload: string }
  | { type: "sign_gloss"; payload: SignGlossPayload }
  | { type: "screen_frame"; payload: ScreenFramePayload }
  | { type: "teacher_audio_chunk"; payload: { data: string; mimeType: string } }
  | { type: "teacher_speaking"; payload: { active: boolean } }
  | { type: "webrtc_ready"; payload: { from: string } }
  | { type: "webrtc_offer"; payload: { from: string; target: string; description: RTCSessionDescriptionInit } }
  | { type: "webrtc_answer"; payload: { from: string; target: string; description: RTCSessionDescriptionInit } }
  | { type: "webrtc_ice"; payload: { from: string; target?: string; candidate: RTCIceCandidateInit } }
  | { type: "slide"; payload: number }
  | { type: "participant"; payload: Participant }
  | { type: "media"; payload: MediaState }
  | { type: "session_end" };
