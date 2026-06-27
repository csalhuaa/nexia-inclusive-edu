import type {
  ClassroomSession,
  CreateClassroomPayload,
  JoinClassroomPayload,
  UserRole,
} from "@/types/classroom";
import { apiRequest } from "./client";
import { API_ENDPOINTS } from "./endpoints";
import { env } from "@/config/env";

function roleToApi(role: UserRole): string {
  if (role === "blind-student") return "blind";
  if (role === "deaf-student") return "deaf";
  return "teacher";
}

export async function createClassroom(
  payload: CreateClassroomPayload,
): Promise<ClassroomSession> {
  return apiRequest<ClassroomSession>(API_ENDPOINTS.classrooms, {
    method: "POST",
    body: payload,
  });
}

export async function joinClassroom(
  payload: JoinClassroomPayload,
): Promise<ClassroomSession> {
  return apiRequest<ClassroomSession>(API_ENDPOINTS.join(payload.code), {
    method: "POST",
    body: {
      userId: payload.clientId || payload.displayName || crypto.randomUUID(),
      displayName: payload.displayName,
      role: roleToApi(payload.role),
    },
  });
}

export async function getClassroom(id: string): Promise<ClassroomSession> {
  return apiRequest<ClassroomSession>(API_ENDPOINTS.session(id));
}

export async function uploadScreenshot(classroomId: string, blob: Blob, force = false) {
  const formData = new FormData();
  const extension = blob.type.includes("jpeg") ? "jpg" : "png";
  formData.append("file", blob, `board.${extension}`);

  const url = new URL(
    `${env.apiUrl}${API_ENDPOINTS.screenshots(classroomId)}`,
    typeof window !== "undefined" ? window.location.origin : undefined
  );
  if (force) url.searchParams.set("force", "true");

  const response = await fetch(url.toString(), {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Screenshot upload failed: ${response.status}`);
  }

  return response.json() as Promise<{
    explanation: string | null;
    full_text: string | null;
    duplicate: boolean;
    rateLimited?: boolean;
  }>;
}

export async function uploadAudio(classroomId: string, blob: Blob) {
  const formData = new FormData();
  const extension = blob.type.includes("webm") ? "webm" : "wav";
  formData.append("file", blob, `teacher-audio.${extension}`);

  const response = await fetch(`${env.apiUrl}${API_ENDPOINTS.audio(classroomId)}`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Audio upload failed: ${response.status}`);
  }

  return response.json() as Promise<{ transcript: string }>;
}
