import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { ConnectionBadge } from "@/components/classroom/ConnectionBadge";
import { CLASSROOM_NAV, HOME_NAV, type NavItem } from "@/constants/navigation";
import { ROUTES } from "@/constants/routes";
import { useClassroom } from "@/hooks/useClassroom";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/Icon";

type TopNavBarProps = {
  variant?: "home" | "classroom";
};

function NavLinks({ items, activePath }: { items: NavItem[]; activePath: string }) {
  return (
    <nav aria-label="Navegación principal" className="hidden items-center gap-6 lg:flex">
      {items.map((item) => {
        const isActive = item.to !== "#" && activePath === item.to;

        if (item.to === "#") {
          return (
            <a
              key={item.label}
              href={item.to}
              aria-label={item.ariaLabel}
              className="rounded-md px-3 py-2 font-body text-body-md font-medium text-on-primary/80 transition-colors hover:bg-primary-container/20"
            >
              {item.label}
            </a>
          );
        }

        return (
          <NavLink
            key={item.to}
            to={item.to}
            aria-label={item.ariaLabel}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "px-2 py-1 font-body text-body-md transition-colors",
              isActive
                ? "border-b-4 border-on-primary pb-1 font-bold text-on-primary"
                : "font-medium text-on-primary/80 hover:bg-primary-container/20",
            )}
          >
            {item.label}
          </NavLink>
        );
      })}
    </nav>
  );
}

function ClassroomRoleLabel({ role }: { role: string | null }) {
  if (role === "teacher") return "Vista docente";
  if (role === "deaf-student") return "Estudiante sordo";
  if (role === "blind-student") return "Estudiante ciego";
  return "Clase";
}

export function TopNavBar({ variant = "classroom" }: TopNavBarProps) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { session, endSession } = useClassroom();
  const navItems = variant === "home" ? HOME_NAV : CLASSROOM_NAV;

  const handleLeave = () => {
    endSession();
    navigate(ROUTES.home);
  };

  return (
    <header className="sticky top-0 z-50 flex w-full items-center justify-between bg-primary px-gutter py-unit shadow-md">
      <div className="flex min-w-0 items-center gap-4 md:gap-6">
        <NavLink
          to={ROUTES.home}
          className="shrink-0 font-headline text-headline-md font-bold text-on-primary"
          aria-label="Inclusive EDU — Inicio"
        >
          Inclusive EDU
        </NavLink>
        {variant === "classroom" && (
          <div className="hidden md:block">
            {session ? (
              <span className="rounded-full bg-primary-container/20 px-3 py-2 font-body text-body-md font-medium text-on-primary/90">
                <ClassroomRoleLabel role={session.role} />
              </span>
            ) : (
              <NavLinks items={navItems} activePath={pathname} />
            )}
          </div>
        )}
      </div>

      {variant === "home" && <NavLinks items={navItems} activePath={pathname} />}

      <div className="flex items-center gap-2">
        {variant === "classroom" && session && (
          <div className="mr-2 hidden sm:block">
            <ConnectionBadge />
          </div>
        )}
        {variant === "classroom" && session && (
          <button
            type="button"
            onClick={handleLeave}
            aria-label="Salir de la clase"
            className="hidden items-center gap-1 rounded-lg px-3 py-2 font-body text-label-sm text-on-primary/90 transition-colors hover:bg-primary-container/20 md:flex"
          >
            <Icon name="logout" size={18} />
            Salir
          </button>
        )}
        <button
          type="button"
          aria-label="Configuración"
          className="flex min-h-touch-target-min min-w-touch-target-min items-center justify-center rounded-full p-2 text-on-primary transition-colors hover:bg-primary-container/20 focus-visible:ring-3 focus-visible:ring-secondary focus-visible:ring-offset-2"
        >
          <Icon name="settings" />
        </button>
        <button
          type="button"
          aria-label="Perfil de usuario"
          className="flex min-h-touch-target-min min-w-touch-target-min items-center justify-center rounded-full p-2 text-on-primary transition-colors hover:bg-primary-container/20 focus-visible:ring-3 focus-visible:ring-secondary focus-visible:ring-offset-2"
        >
          <Icon name="account_circle" filled />
        </button>
      </div>
    </header>
  );
}
