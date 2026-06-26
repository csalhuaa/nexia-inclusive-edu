import { IMAGES } from "@/constants/assets";
import { useClassroom } from "@/hooks/useClassroom";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";

export function InterpreterPanel() {
  const { session } = useClassroom();
  const isActive = session?.interpreterActive ?? false;

  return (
    <aside className="absolute bottom-4 left-4 z-30 w-[min(42vw,220px)] min-w-[150px]">
      <div className="flex flex-col rounded-xl border-2 border-secondary/80 bg-surface-container-lowest p-2 shadow-2xl">
        <h2 className="mb-2 flex items-center gap-2 font-body text-label-sm text-on-surface">
          <Icon name="sign_language" />
          Intérprete IA
        </h2>

        <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-lg border border-outline bg-inverse-surface">
          <img
            src={IMAGES.interpreterAvatar}
            alt="Intérprete de lengua de señas generado por IA sobre fondo oscuro de alto contraste"
            className="absolute inset-0 h-full w-full object-cover opacity-90 mix-blend-luminosity"
          />
          {isActive && (
            <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-lg bg-on-background/70 px-2 py-1 text-sm text-on-primary backdrop-blur-sm">
              <span className="h-2 w-2 animate-pulse rounded-full bg-secondary-fixed" aria-hidden="true" />
              En vivo
            </div>
          )}
        </div>

        <div className="mt-2 rounded-lg border border-outline-variant/50 bg-surface-container p-2 text-sm">
          <p className="font-body text-[11px]">
            Estado:{" "}
            <span className={cn("font-bold", isActive ? "text-secondary" : "text-outline")}>
              {isActive ? "Activo" : "Inactivo"}
            </span>
          </p>
          <p className="mt-1 text-[11px] text-on-surface-variant">
            {isActive ? "Traduciendo audio a Lengua de Señas…" : "Esperando señal de audio"}
          </p>
        </div>
      </div>
    </aside>
  );
}
