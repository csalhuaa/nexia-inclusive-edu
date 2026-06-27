export type AvatarGesture =
  | "idle"
  | "speaking"
  | "wave"
  | "point"
  | "hands"
  | "explain"
  | "write"
  | "show"
  | "question"
  | "emphasis"
  | "chest";

export const gestureMap: Record<string, AvatarGesture> = {
  HOY: "chest",
  TODAY: "chest",
  ESTUDIAR: "hands",
  STUDY: "hands",
  APRENDER: "hands",
  LEARN: "hands",
  DERIVADA: "explain",
  DERIVATIVE: "explain",
  FUNCION: "explain",
  FUNCIÓN: "explain",
  FUNCTION: "explain",
  ECUACION: "write",
  ECUACIÓN: "write",
  EQUATION: "write",
  PIZARRA: "write",
  BOARD: "write",
  PROFESOR: "point",
  TEACHER: "point",
  CLASE: "show",
  CLASS: "show",
  IMPORTANTE: "emphasis",
  IMPORTANT: "emphasis",
  EJEMPLO: "show",
  EXAMPLE: "show",
  PREGUNTA: "question",
  QUESTION: "question",
  RESPUESTA: "explain",
  ANSWER: "explain",
  EXPLICAR: "explain",
  EXPLAIN: "explain",
  TEMA: "show",
  TOPIC: "show",
  HOLA: "wave",
  HELLO: "wave",
};

export function getGestureForGloss(gloss: string | null, isSpeaking = false): AvatarGesture {
  if (!gloss) return isSpeaking ? "speaking" : "idle";
  return gestureMap[gloss.toUpperCase()] ?? "explain";
}
