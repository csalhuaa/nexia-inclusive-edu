import { ROUTES } from "./routes";

export type NavItem = {
  label: string;
  to: string;
  ariaLabel: string;
};

export const CLASSROOM_NAV: NavItem[] = [
  { label: "Docente", to: ROUTES.teacher, ariaLabel: "Vista Docente" },
  { label: "Estudiante Sordo", to: ROUTES.deafStudent, ariaLabel: "Vista Estudiante Sordo" },
  { label: "Estudiante Ciego", to: ROUTES.blindStudent, ariaLabel: "Vista Estudiante Ciego" },
];

export const HOME_NAV: NavItem[] = [
  { label: "¿Qué somos?", to: "#", ariaLabel: "Acerca de nosotros" },
  { label: "FAQ", to: "#", ariaLabel: "Preguntas frecuentes" },
];

export const FOOTER_LINKS: NavItem[] = [
  { label: "FAQ", to: "#", ariaLabel: "Ir a Preguntas Frecuentes" },
  { label: "Accessibility Settings", to: "#", ariaLabel: "Ir a Configuración de Accesibilidad" },
  { label: "Support", to: "#", ariaLabel: "Ir a Soporte" },
];
