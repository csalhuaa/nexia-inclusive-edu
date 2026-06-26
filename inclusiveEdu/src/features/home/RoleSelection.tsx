import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { useClassroom } from "@/hooks/useClassroom";
import { formatClassCode } from "@/lib/demo/classroomDemo";
import { ROUTES } from "@/constants/routes";
import type { UserRole } from "@/types/classroom";
import { cn } from "@/lib/cn";

function RoleCard({
  title,
  description,
  icon,
  accentColor,
  children,
  onClick,
}: {
  title: string;
  description: string;
  icon: string;
  accentColor: "primary" | "secondary";
  children?: React.ReactNode;
  onClick?: () => void;
}) {
  const iconBg = accentColor === "primary" ? "bg-primary/10" : "bg-secondary/10";
  const iconColor = accentColor === "primary" ? "text-primary" : "text-secondary";
  const titleColor = accentColor === "primary" ? "text-primary" : "text-secondary";
  const hoverBorder =
    accentColor === "primary" ? "hover:border-primary" : "hover:border-secondary";

  return (
    <article
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      aria-label={title}
      className={cn(
        "focus-ring flex flex-col items-center rounded-2xl border-2 border-outline-variant bg-surface-container-lowest p-8 text-center shadow-sm transition-all",
        hoverBorder,
        onClick && "group cursor-pointer hover:shadow-md",
      )}
    >
      <div
        className={cn(
          "mb-6 rounded-full p-6",
          iconBg,
          onClick && "transition-transform duration-300 group-hover:scale-110",
        )}
      >
        <Icon name={icon} filled size={60} className={iconColor} />
      </div>
      <h2 className={cn("mb-4 font-headline text-headline-lg", titleColor)}>{title}</h2>
      <p className="mb-8 flex-grow font-body text-body-md text-on-surface-variant">{description}</p>
      {children}
    </article>
  );
}

const STUDENT_ROLES: { role: UserRole; label: string; description: string; icon: string; route: string }[] = [
  {
    role: "deaf-student",
    label: "Estudiante Sordo",
    description: "Intérprete LSC + subtítulos en vivo",
    icon: "sign_language",
    route: ROUTES.deafStudent,
  },
  {
    role: "blind-student",
    label: "Estudiante Ciego",
    description: "Narración por voz + captions ampliados",
    icon: "blind",
    route: ROUTES.blindStudent,
  },
];

export function HomeHero() {
  return (
    <header className="mb-12 space-y-4 text-center">
      <h1 className="font-display text-display text-primary md:text-[clamp(2rem,5vw,3rem)]">
        Bienvenido a Inclusive EDU
      </h1>
      <p className="mx-auto max-w-2xl font-body text-body-lg text-on-surface-variant">
        Plataforma educativa accesible con lengua de señas, subtítulos en tiempo real y narración
        adaptada.
      </p>
    </header>
  );
}

function TeacherSetupDialog({
  isLoading,
  onCancel,
  onCreate,
}: {
  isLoading: boolean;
  onCancel: () => void;
  onCreate: () => Promise<void>;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<"idle" | "ready" | "error">("idle");

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const requestMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setPermissionStatus("ready");
    } catch {
      setPermissionStatus("error");
    }
  };

  const handleCreate = async () => {
    await onCreate();
    streamRef.current?.getTracks().forEach((track) => track.stop());
  };

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-on-background/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="teacher-setup-title"
    >
      <div className="w-full max-w-3xl rounded-2xl border-2 border-outline-variant bg-surface-container-lowest p-6 shadow-2xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 id="teacher-setup-title" className="font-headline text-headline-md text-primary">
              Preparar pizarra
            </h2>
            <p className="mt-1 font-body text-body-md text-on-surface-variant">
              Activa micrófono y cámara. Alinea la pizarra dentro del marco antes de generar el código.
            </p>
          </div>
          <button
            type="button"
            aria-label="Cerrar preparación"
            onClick={onCancel}
            className="rounded-full p-2 text-on-surface-variant hover:bg-surface-variant"
          >
            <Icon name="close" />
          </button>
        </div>

        <div className="relative mb-5 aspect-video overflow-hidden rounded-xl border-2 border-outline bg-inverse-surface">
          <video ref={videoRef} autoPlay muted playsInline className="h-full w-full object-cover" />
          {permissionStatus !== "ready" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-inverse-on-surface">
              <Icon name={permissionStatus === "error" ? "videocam_off" : "photo_camera"} size={48} />
              <p className="max-w-md text-center font-body text-body-md">
                {permissionStatus === "error"
                  ? "No se pudo acceder a la cámara o micrófono. Revisa permisos del navegador."
                  : "La vista previa aparecerá aquí cuando aceptes los permisos."}
              </p>
            </div>
          )}
          <div className="pointer-events-none absolute inset-[12%] rounded-lg border-4 border-secondary shadow-[0_0_0_999px_rgba(0,0,0,0.25)]" />
          <div className="absolute left-4 top-4 rounded-lg bg-surface/90 px-3 py-2 font-body text-label-sm text-primary shadow-sm">
            Enfoca la pizarra dentro del marco
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={onCancel} disabled={isLoading}>
            Cancelar
          </Button>
          {permissionStatus !== "ready" ? (
            <Button onClick={() => void requestMedia()} disabled={isLoading}>
              <Icon name="perm_camera_mic" />
              Activar cámara y micrófono
            </Button>
          ) : (
            <Button onClick={() => void handleCreate()} disabled={isLoading}>
              <Icon name="key" />
              {isLoading ? "Creando…" : "Crear sesión"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export function RoleSelection() {
  const navigate = useNavigate();
  const { createSession, joinSession, isLoading } = useClassroom();
  const [classCode, setClassCode] = useState("");
  const [showRolePicker, setShowRolePicker] = useState(false);
  const [showTeacherSetup, setShowTeacherSetup] = useState(false);
  const [error, setError] = useState("");

  const handleTeacherEnter = async () => {
    await createSession();
    setShowTeacherSetup(false);
    navigate(ROUTES.teacher);
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = formatClassCode(classCode);
    if (code.length < 4) {
      setError("El código debe tener al menos 4 caracteres");
      return;
    }
    setError("");
    setShowRolePicker(true);
  };

  const handleRoleSelect = async (role: UserRole, route: string) => {
    const code = formatClassCode(classCode);
    const ok = await joinSession(code, role);
    if (ok) navigate(route);
  };

  return (
    <>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-12">
        <RoleCard
          title="Impartir Clase"
          description="Para docentes. Crea un aula, comparte código y gestiona accesibilidad en vivo."
          icon="school"
          accentColor="primary"
        >
          <Button
            aria-label="Continuar como docente"
            className="max-w-[220px]"
            disabled={isLoading}
            onClick={() => setShowTeacherSetup(true)}
          >
            {isLoading ? "Conectando…" : "Entrar"}
          </Button>
        </RoleCard>

        <RoleCard
          title="Unirse a Clase"
          description="Para estudiantes. Ingresa el código y elige tu experiencia accesible."
          icon="group"
          accentColor="secondary"
        >
          <form
            className="mt-auto flex w-full flex-col items-center gap-4"
            onSubmit={handleJoinSubmit}
          >
            <div className="w-full max-w-[300px] text-left">
              <label
                htmlFor="classCode"
                className="mb-2 block font-body text-label-sm text-on-surface-variant"
              >
                Código de Clase
              </label>
              <input
                id="classCode"
                type="text"
                value={classCode}
                onChange={(e) => setClassCode(e.target.value.toUpperCase())}
                aria-required="true"
                aria-invalid={!!error}
                aria-describedby={error ? "classCode-error" : undefined}
                placeholder="Ej. ABC123"
                className="w-full rounded-xl border-2 border-outline-variant p-4 text-center font-body text-body-lg uppercase tracking-widest transition-all placeholder:normal-case placeholder:tracking-normal placeholder:text-outline-variant focus:border-secondary focus:ring-2 focus:ring-secondary/20"
              />
              {error && (
                <p id="classCode-error" className="mt-2 font-body text-label-sm text-error">
                  {error}
                </p>
              )}
            </div>
            <Button
              type="submit"
              variant="secondary"
              aria-label="Continuar para elegir tipo de accesibilidad"
              className="max-w-[220px]"
              disabled={isLoading}
            >
              Continuar
            </Button>
          </form>
        </RoleCard>
      </div>

      {showRolePicker && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-on-background/50 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="role-picker-title"
        >
          <div className="w-full max-w-lg rounded-2xl border-2 border-outline-variant bg-surface-container-lowest p-6 shadow-2xl">
            <h2 id="role-picker-title" className="mb-2 font-headline text-headline-md text-primary">
              ¿Cómo deseas acceder?
            </h2>
            <p className="mb-6 font-body text-body-md text-on-surface-variant">
              Selecciona la experiencia adaptada a tus necesidades de accesibilidad.
            </p>

            <div className="grid gap-3">
              {STUDENT_ROLES.map((option) => (
                <button
                  key={option.role}
                  type="button"
                  disabled={isLoading}
                  onClick={() => void handleRoleSelect(option.role, option.route)}
                  className="flex items-center gap-4 rounded-xl border-2 border-outline-variant p-4 text-left transition-all hover:border-secondary hover:bg-secondary/5 focus-visible:ring-3 focus-visible:ring-secondary"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary/10 text-secondary">
                    <Icon name={option.icon} size={28} />
                  </div>
                  <div>
                    <p className="font-headline text-label-lg text-on-surface">{option.label}</p>
                    <p className="font-body text-label-sm text-on-surface-variant">
                      {option.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setShowRolePicker(false)}
              className="mt-4 w-full rounded-lg py-2 font-body text-label-lg text-on-surface-variant hover:text-primary"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {showTeacherSetup && (
        <TeacherSetupDialog
          isLoading={isLoading}
          onCancel={() => setShowTeacherSetup(false)}
          onCreate={handleTeacherEnter}
        />
      )}
    </>
  );
}
