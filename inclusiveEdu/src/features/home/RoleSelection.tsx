import { useEffect, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { useClassroom } from "@/hooks/useClassroom";
import { formatClassCode } from "@/lib/demo/classroomDemo";
import { ROUTES } from "@/constants/routes";
import type { UserRole } from "@/types/classroom";
import { cn } from "@/lib/cn";

function ActionCard({
  title,
  description,
  icon,
  accentColor,
  children,
}: {
  title: string;
  description: string;
  icon: string;
  accentColor: "primary" | "secondary";
  children: ReactNode;
}) {
  const iconBg = accentColor === "primary" ? "bg-primary/10" : "bg-secondary/10";
  const iconColor = accentColor === "primary" ? "text-primary" : "text-secondary";

  return (
    <article className="focus-ring edu-glass mx-auto flex w-full max-w-xl flex-col items-center rounded-3xl p-8 text-center transition-all duration-300">
      <div className={cn("mb-6 rounded-3xl p-5 shadow-inner", iconBg)}>
        <Icon name={icon} filled size={54} className={iconColor} />
      </div>
      <h1 className="mb-4 font-headline text-headline-lg text-on-surface">{title}</h1>
      <p className="mb-8 max-w-md font-body text-body-md text-on-surface-variant">
        {description}
      </p>
      {children}
    </article>
  );
}

const STUDENT_ROLES: {
  role: UserRole;
  label: string;
  description: string;
  icon: string;
  route: string;
}[] = [
  {
    role: "deaf-student",
    label: "Estudiante sordo",
    description: "Subtítulos en vivo y avatar 2D con gestos simulados.",
    icon: "sign_language",
    route: ROUTES.deafStudent,
  },
  {
    role: "blind-student",
    label: "Estudiante ciego",
    description: "Audio real del docente y narración inteligente del contenido visual.",
    icon: "blind",
    route: ROUTES.blindStudent,
  },
];

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
      <div className="edu-glass w-full max-w-3xl rounded-3xl p-6 shadow-2xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 id="teacher-setup-title" className="font-headline text-headline-md text-on-surface">
              Preparar clase
            </h2>
            <p className="mt-1 font-body text-body-md text-on-surface-variant">
              Activa micrófono y cámara. Alinea la pizarra dentro del marco antes de generar el código.
            </p>
          </div>
          <button
            type="button"
            aria-label="Cerrar preparación"
            onClick={onCancel}
            className="rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-variant"
          >
            <Icon name="close" />
          </button>
        </div>

        <div className="relative mb-5 aspect-video overflow-hidden rounded-2xl border border-outline-variant bg-inverse-surface shadow-inner">
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
          <div className="pointer-events-none absolute inset-[12%] rounded-2xl border-4 border-secondary shadow-[0_0_0_999px_rgba(0,0,0,0.25)]" />
          <div className="absolute left-4 top-4 rounded-xl bg-white/90 px-3 py-2 font-body text-label-sm font-semibold text-primary shadow-sm backdrop-blur-md">
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
              {isLoading ? "Creando..." : "Crear sesión"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export function CreateSessionCard() {
  const navigate = useNavigate();
  const { createSession, isLoading } = useClassroom();
  const [showTeacherSetup, setShowTeacherSetup] = useState(false);

  const handleTeacherEnter = async () => {
    await createSession();
    setShowTeacherSetup(false);
    navigate(ROUTES.teacher);
  };

  return (
    <>
      <ActionCard
        title="Crear sesión"
        description="Crea una sala tipo Meet con código único para compartir audio, cámara, pantalla y apoyos accesibles."
        icon="school"
        accentColor="primary"
      >
        <Button
          aria-label="Crear sesión como docente"
          disabled={isLoading}
          onClick={() => setShowTeacherSetup(true)}
        >
          <Icon name="add_circle" />
          {isLoading ? "Creando..." : "Crear sesión"}
        </Button>
      </ActionCard>

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

export function JoinSessionCard() {
  const navigate = useNavigate();
  const { joinSession, isLoading } = useClassroom();
  const [classCode, setClassCode] = useState("");
  const [showRolePicker, setShowRolePicker] = useState(false);
  const [error, setError] = useState("");

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
      <ActionCard
        title="Unirse a sesión"
        description="Ingresa el código de clase y elige la experiencia accesible que necesitas para seguir la sesión."
        icon="group"
        accentColor="secondary"
      >
        <form className="flex w-full max-w-sm flex-col items-center gap-4" onSubmit={handleJoinSubmit}>
          <div className="w-full text-left">
            <label
              htmlFor="classCode"
              className="mb-2 block font-body text-label-sm text-on-surface-variant"
            >
              Código de sesión
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
              className="w-full rounded-2xl border border-outline-variant bg-white/85 p-4 text-center font-body text-body-lg uppercase tracking-widest shadow-inner transition-all placeholder:normal-case placeholder:tracking-normal placeholder:text-outline-variant focus:border-secondary focus:ring-4 focus:ring-secondary/15"
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
            aria-label="Unirse a sesión"
            disabled={isLoading}
          >
            <Icon name="login" />
            Unirse a sesión
          </Button>
        </form>
      </ActionCard>

      {showRolePicker && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-on-background/45 p-4 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-labelledby="role-picker-title"
        >
          <div className="edu-glass w-full max-w-lg rounded-3xl p-6 shadow-2xl">
            <h2 id="role-picker-title" className="mb-2 font-headline text-headline-md text-on-surface">
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
                  className="flex items-center gap-4 rounded-2xl border border-outline-variant bg-white/65 p-4 text-left shadow-sm transition-all hover:border-secondary/60 hover:bg-secondary-container/35 focus-visible:ring-3 focus-visible:ring-secondary"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary-container text-secondary">
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
    </>
  );
}
