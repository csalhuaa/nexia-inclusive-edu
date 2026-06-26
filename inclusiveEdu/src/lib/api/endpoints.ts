export const API_ENDPOINTS = {
  health: "/health",
  classrooms: "/api/v1/classrooms",
  join: (code: string) => `/api/v1/classrooms/${code}/join`,
  session: (id: string) => `/api/v1/classrooms/${id}/state`,
  audio: (id: string) => `/api/v1/classrooms/${id}/audio`,
  screenshots: (id: string) => `/api/v1/classrooms/${id}/screenshots`,
  ws: (id: string) => `/classrooms/${id}`,
} as const;
