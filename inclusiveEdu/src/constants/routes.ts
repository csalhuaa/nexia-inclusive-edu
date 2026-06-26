export const ROUTES = {
  home: "/",
  teacher: "/docente",
  deafStudent: "/estudiante/sordo",
  blindStudent: "/estudiante/ciego",
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];
