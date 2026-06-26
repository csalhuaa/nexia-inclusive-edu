import { useClassroom } from "@/hooks/useClassroom";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";

export function AudioStatusBar() {
  const { session, enableTeacherAudio, teacherAudioBlocked } = useClassroom();
  const isLive = session?.status === "live";

  return (
    <div
      aria-live="polite"
      className="flex w-full max-w-4xl items-center justify-between rounded-2xl border-2 border-outline-variant bg-surface-container-low p-5 shadow-sm"
    >
      <div className="flex items-center gap-4">
        <div
          className={cn(
            "flex items-center justify-center rounded-full p-3",
            isLive ? "bg-secondary-container text-on-secondary-container" : "bg-surface-variant text-outline",
          )}
        >
          <Icon name="volume_up" size={32} />
        </div>
        <div>
          <h2 className="font-headline text-headline-md text-on-surface">
            {isLive ? "Transmisión Activa" : "Sin transmisión"}
          </h2>
          <p className="font-body text-body-md text-on-surface-variant">
            {teacherAudioBlocked
              ? "Toca activar para escuchar al docente"
              : isLive
                ? "Audio de la clase en vivo"
                : "Esperando inicio de clase"}
          </p>
        </div>
      </div>

      {isLive && (
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={enableTeacherAudio}
            className="rounded-lg bg-primary px-4 py-2 font-body text-label-lg text-on-primary transition-colors hover:bg-primary/90"
          >
            {teacherAudioBlocked ? "Activar audio" : "Conectar audio"}
          </button>
          <div aria-hidden="true" className="audio-wave">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="wave-bar" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
