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
  TEACHER: "point",
  STUDENT: "point",
  TODAY: "chest",
  STUDY: "hands",
  LEARN: "hands",
  DERIVATIVE: "explain",
  DERIVADA: "explain",
  FUNCTION: "explain",
  FUNCION: "explain",
  EQUATION: "write",
  ECUACION: "write",
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
  HASH: "explain",
  CLAVE: "show",
  SEGURIDAD: "emphasis",
};

export function getAnimationForGloss(gloss: string): SignAnimation {
  return glossAnimationMap[gloss.toUpperCase()] ?? "explain";
}
