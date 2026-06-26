import { useClassroom } from "@/hooks/useClassroom";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";

export function ClassActionButtons() {
  const {
    speakCaption,
    downloadSummary,
    isRecordingQuestion,
    toggleQuestionRecording,
    session,
  } = useClassroom();

  const actions = [
    {
      id: "replay",
      label: "Repetir último audio",
      icon: "replay",
      ariaLabel: "Repetir último audio",
      variant: "default" as const,
      onClick: speakCaption,
    },
    {
      id: "ask",
      label: isRecordingQuestion ? "Grabando…" : "Hacer pregunta al docente",
      icon: isRecordingQuestion ? "stop_circle" : "mic",
      ariaLabel: "Hacer pregunta al docente por voz",
      variant: "primary" as const,
      onClick: toggleQuestionRecording,
      active: isRecordingQuestion,
    },
    {
      id: "download",
      label: "Descargar resumen",
      icon: "download",
      ariaLabel: "Descargar resumen de clase",
      variant: "default" as const,
      onClick: downloadSummary,
      disabled: !session,
    },
  ];

  return (
    <section
      aria-label="Acciones de la clase"
      className="grid w-full max-w-4xl grid-cols-1 gap-6 md:grid-cols-3"
    >
      {actions.map((action) => {
        const isPrimary = action.variant === "primary";

        return (
          <button
            key={action.id}
            type="button"
            aria-label={action.ariaLabel}
            disabled={action.disabled}
            onClick={action.onClick}
            className={cn(
              "flex min-h-[200px] flex-col items-center justify-center gap-4 rounded-2xl border-2 p-8 transition-all",
              isPrimary
                ? "group border-primary bg-primary shadow-md hover:bg-primary-container hover:shadow-lg"
                : "border-outline bg-surface shadow-sm hover:border-primary hover:shadow-md",
              action.active && "ring-4 ring-secondary/40",
              action.disabled && "cursor-not-allowed opacity-50",
            )}
          >
            <div
              className={cn(
                "rounded-full p-4",
                isPrimary
                  ? "bg-on-primary text-primary transition-transform group-hover:scale-110"
                  : "bg-surface-variant text-on-surface-variant",
              )}
            >
              <Icon name={action.icon} size={48} />
            </div>
            <span
              className={cn(
                "text-center font-headline text-headline-md",
                isPrimary ? "text-on-primary" : "text-on-surface",
              )}
            >
              {action.label}
            </span>
          </button>
        );
      })}
    </section>
  );
}
