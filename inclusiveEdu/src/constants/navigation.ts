import { ROUTES } from "./routes";

export type NavItem = {
  label: string;
  to: string;
  ariaLabel: string;
};

export const CLASSROOM_NAV: NavItem[] = [
  { label: "Inicio", to: ROUTES.home, ariaLabel: "Ir al inicio" },
  { label: "Crear sesión", to: ROUTES.createSession, ariaLabel: "Crear una sesión" },
  { label: "Unirse a sesión", to: ROUTES.joinSession, ariaLabel: "Unirse a una sesión" },
  { label: "FAQ", to: `${ROUTES.home}#faq`, ariaLabel: "Ir a preguntas frecuentes" },
];

export const HOME_NAV: NavItem[] = [
  { label: "Inicio", to: ROUTES.home, ariaLabel: "Ir al inicio" },
  { label: "Crear sesión", to: ROUTES.createSession, ariaLabel: "Crear una sesión" },
  { label: "Unirse a sesión", to: ROUTES.joinSession, ariaLabel: "Unirse a una sesión" },
  { label: "FAQ", to: `${ROUTES.home}#faq`, ariaLabel: "Ir a preguntas frecuentes" },
];

export const FOOTER_LINKS: NavItem[] = [
  { label: "Inicio", to: ROUTES.home, ariaLabel: "Ir al inicio" },
  { label: "Crear sesión", to: ROUTES.createSession, ariaLabel: "Crear una sesión" },
  { label: "Unirse a sesión", to: ROUTES.joinSession, ariaLabel: "Unirse a una sesión" },
  { label: "FAQ", to: `${ROUTES.home}#faq`, ariaLabel: "Ir a preguntas frecuentes" },
];
