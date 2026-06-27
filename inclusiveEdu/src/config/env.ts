const envApi = import.meta.env.VITE_API_URL;
const envWs = import.meta.env.VITE_WS_URL;

const isExternalAccess = typeof window !== 'undefined' && window.location.hostname !== 'localhost';

const apiUrl = (isExternalAccess && envApi?.includes("localhost")) ? "" : (envApi ?? "");
const wsUrl = (isExternalAccess && envWs?.includes("localhost"))
  ? `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`
  : (envWs ?? "ws://localhost:8000/ws");
const demoFallback = import.meta.env.VITE_ENABLE_DEMO_FALLBACK !== "false";
const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY ?? "";

export const env = {
  apiUrl,
  wsUrl,
  demoFallback,
  geminiApiKey,
  isDev: import.meta.env.DEV,
} as const;
