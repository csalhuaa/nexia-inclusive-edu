import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useClassroom } from "@/hooks/useClassroom";
import { ROUTES } from "@/constants/routes";
import type { UserRole } from "@/types/classroom";
import { useToast } from "@/hooks/useToast";

type UseSessionGuardOptions = {
  role: UserRole;
  autoCreate?: boolean;
};

export function useSessionGuard({ role, autoCreate = true }: UseSessionGuardOptions) {
  const { session, createSession, isLoading } = useClassroom();
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    if (session || isLoading) return;

    if (autoCreate && role === "teacher") {
      void createSession();
      return;
    }

    if (!autoCreate) {
      showToast("Únete a una clase desde el inicio", "error");
      navigate(ROUTES.home);
    }
  }, [session, isLoading, autoCreate, role, createSession, navigate, showToast]);

  useEffect(() => {
    if (!session || session.status === "ended") return;
    if (session.role === role) return;

    const targetByRole: Record<UserRole, string> = {
      teacher: ROUTES.teacher,
      "deaf-student": ROUTES.deafStudent,
      "blind-student": ROUTES.blindStudent,
    };

    showToast("Esta vista no corresponde a tu rol en la clase", "error");
    navigate(targetByRole[session.role ?? role], { replace: true });
  }, [navigate, role, session, showToast]);

  useEffect(() => {
    if (session?.status === "ended") {
      navigate(ROUTES.home);
    }
  }, [session?.status, navigate]);

  return {
    session,
    isLoading,
    isReady: !!session && session.status === "live",
  };
}
