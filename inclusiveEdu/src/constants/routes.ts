export const ROUTES = {
  home: "/",
  createSession: "/create-session",
  joinSession: "/join-session",
  teacher: "/docente",
  deafStudent: "/estudiante/sordo",
  blindStudent: "/estudiante/ciego",
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];
