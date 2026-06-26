const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:8000";
const wsUrl = import.meta.env.VITE_WS_URL ?? "ws://localhost:8000/ws";
const demoFallback = import.meta.env.VITE_ENABLE_DEMO_FALLBACK !== "false";

export const env = {
  apiUrl,
  wsUrl,
  demoFallback,
  isDev: import.meta.env.DEV,
} as const;
