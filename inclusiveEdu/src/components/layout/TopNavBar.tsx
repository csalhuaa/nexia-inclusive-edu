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
        const isHashLink = item.to.includes("#");
        const isActive = !isHashLink && activePath === item.to;

        if (isHashLink) {
          return (
            <a
              key={item.label}
              href={item.to}
              aria-label={item.ariaLabel}
            className="rounded-full px-3 py-2 font-body text-label-lg font-medium text-on-surface-variant transition-colors hover:bg-primary-fixed/70 hover:text-primary"
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
              "rounded-full px-3 py-2 font-body text-label-lg transition-colors",
              isActive
                ? "bg-primary text-on-primary shadow-sm"
                : "font-medium text-on-surface-variant hover:bg-primary-fixed/70 hover:text-primary",
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
  const { session, leaveClassroom, endClassroom } = useClassroom();
  const navItems = variant === "home" ? HOME_NAV : CLASSROOM_NAV;

  const handleLeave = () => {
    if (session?.role === "teacher") {
      endClassroom();
    } else {
      leaveClassroom();
    }
    navigate(ROUTES.home);
  };

  return (
    <header className="sticky top-0 z-50 flex w-full items-center justify-between border-b border-outline-variant/70 bg-white/85 px-gutter py-3 shadow-[0_8px_28px_rgba(18,32,51,0.08)] backdrop-blur-xl">
      <div className="flex min-w-0 items-center gap-4 md:gap-6">
        <NavLink
          to={ROUTES.home}
          className="flex shrink-0 items-center gap-3 font-headline text-headline-md font-bold text-on-surface"
          aria-label="Inclusive EDU — Inicio"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-on-primary shadow-[0_10px_24px_rgba(37,72,199,0.2)]">
            <Icon name="diversity_3" size={22} />
          </span>
          <span>
            Inclusive <span className="text-primary">EDU</span>
          </span>
        </NavLink>
        {variant === "classroom" && (
          <div className="hidden md:block">
            {session ? (
              <span className="rounded-full border border-primary/20 bg-primary-fixed/70 px-3 py-2 font-body text-label-lg font-semibold text-on-primary-fixed">
                <ClassroomRoleLabel role={session.role} />
              </span>
            ) : (
              <NavLinks items={navItems} activePath={pathname} />
            )}
          </div>
        )}
      </div>
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
            aria-label={session.role === "teacher" ? "Finalizar clase" : "Salir de la clase"}
            className="hidden items-center gap-1 rounded-xl px-3 py-2 font-body text-label-sm text-on-surface-variant transition-colors hover:bg-error-container hover:text-on-error-container md:flex"
          >
            <Icon name="logout" size={18} />
            {session.role === "teacher" ? "Finalizar" : "Salir"}
          </button>
        )}
        {variant === "home" && <NavLinks items={navItems} activePath={pathname} />}
      </div>
    </header>
  );
}
