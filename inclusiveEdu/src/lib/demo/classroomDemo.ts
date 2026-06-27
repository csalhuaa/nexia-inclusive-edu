import { IMAGES } from "@/constants/assets";
import type { ClassroomSession, Participant, SlideContent } from "@/types/classroom";

export const DEMO_SLIDES: SlideContent[] = [
  {
    id: "slide-1",
    title: "Operaciones Básicas",
    topic: "Suma",
    body: "5 + 5 = ?",
    expression: "5 + 5 = ___",
  },
  {
    id: "slide-2",
    title: "Operaciones Básicas",
    topic: "Resultado",
    body: "La respuesta es 10",
    expression: "5 + 5 = 10",
  },
  {
    id: "slide-3",
    title: "Biología Celular - Lección 4",
    topic: "La célula",
    body: "Estructura de la célula eucariota",
    imageUrl: IMAGES.biologySlide,
  },
  {
    id: "slide-4",
    title: "Biología Celular - Lección 4",
    topic: "Mitocondria",
    body: "La mitocondria genera energía para la célula",
    imageUrl: IMAGES.biologySlide,
  },
  {
    id: "slide-5",
    title: "Biología Celular - Lección 4",
    topic: "Repaso",
    body: "Repasemos los organelos principales",
    imageUrl: IMAGES.biologySlide,
  },
];

export const DEMO_PARTICIPANTS: Participant[] = [
  {
    id: "p1",
    name: "María S.",
    role: "deaf-student",
    accessibility: "deaf",
    isOnline: true,
  },
  {
    id: "p2",
    name: "Juan P.",
    role: "blind-student",
    accessibility: "blind",
    isOnline: true,
  },
  {
    id: "p3",
    name: "Ana L.",
    role: "deaf-student",
    accessibility: "none",
    isOnline: true,
  },
];

export const DEMO_SUBTITLE_PHRASES = [
  "Bienvenidos a la clase de hoy.",
  "Hoy aprenderemos sobre la estructura celular.",
  "La mitocondria es conocida como la central energética de la célula.",
  "Genera la mayor parte del ATP que la célula necesita para funcionar.",
  "Observen el diagrama: el núcleo contiene el material genético.",
  "Las ribosomas son responsables de la síntesis de proteínas.",
  "¿Alguna pregunta hasta aquí?",
  "Perfecto, continuemos con el siguiente organelo.",
  "El retículo endoplasmático transporta sustancias dentro de la célula.",
  "Recuerden repasar estos conceptos para la próxima sesión.",
];

export const DEMO_CAPTIONS = [
  "El docente está explicando la suma de 5 + 5",
  "La respuesta correcta es 10",
  "Ahora pasaremos al siguiente ejercicio",
  "Por favor, revisen sus materiales de apoyo",
  "La mitocondria produce energía para la célula",
];

function generateClassCode(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export function createDemoSession(title = "Sesión de hoy"): ClassroomSession {
  return {
    id: crypto.randomUUID(),
    code: generateClassCode(),
    title,
    status: "live",
    role: null,
    slideIndex: 0,
    slides: DEMO_SLIDES,
    participants: DEMO_PARTICIPANTS,
    media: { audio: true, video: true, screenShare: false, boardCamera: false },
    subtitles: [],
    currentCaption: DEMO_CAPTIONS[0],
    interpreterActive: true,
    connectionMode: "demo",
    subtitleSpeed: 1,
  };
}

export function formatClassCode(value: string): string {
  return value.replace(/\s/g, "").toUpperCase().slice(0, 6);
}

export function buildSessionSummary(session: ClassroomSession): string {
  const lines = [
    `# Resumen — ${session.title}`,
    `Código: ${session.code}`,
    `Diapositivas: ${session.slides.length}`,
    "",
    "## Subtítulos",
    ...session.subtitles.map((s) => `- ${s.text}`),
    "",
    "## Narración",
    session.currentCaption,
  ];
  return lines.join("\n");
}
