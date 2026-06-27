export type SignAnimation =
  | "idle"
  | "wave"
  | "point"
  | "chest"
  | "hands"
  | "explain"
  | "write"
  | "draw"
  | "question"
  | "emphasis"
  | "show";

export const glossAnimationMap: Record<string, SignAnimation> = {
  HELLO: "wave",
  HOLA: "wave",
  TEACHER: "point",
  PROFESOR: "point",
  STUDENT: "point",
  TODAY: "chest",
  HOY: "chest",
  STUDY: "hands",
  ESTUDIAR: "hands",
  LEARN: "hands",
  APRENDER: "hands",
  DERIVATIVE: "explain",
  DERIVADA: "explain",
  FUNCTION: "explain",
  FUNCION: "explain",
  FUNCIÓN: "explain",
  EQUATION: "write",
  ECUACION: "write",
  ECUACIÓN: "write",
  GRAPH: "draw",
  GRAFICO: "draw",
  QUESTION: "question",
  PREGUNTA: "question",
  ANSWER: "explain",
  RESPUESTA: "explain",
  IMPORTANT: "emphasis",
  IMPORTANTE: "emphasis",
  EXAMPLE: "show",
  EJEMPLO: "show",
  BOARD: "write",
  PIZARRA: "write",
  CLASS: "show",
  CLASE: "show",
  EXPLAIN: "explain",
  EXPLICAR: "explain",
  TOPIC: "show",
  TEMA: "show",
  HASH: "explain",
  CLAVE: "show",
  SEGURIDAD: "emphasis",
};

export function getAnimationForGloss(gloss: string): SignAnimation {
  return glossAnimationMap[gloss.toUpperCase()] ?? "explain";
}
