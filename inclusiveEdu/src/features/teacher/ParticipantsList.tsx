import { useClassroom } from "@/hooks/useClassroom";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";

const accessibilityIcons: Record<string, string> = {
  deaf: "sign_language",
  blind: "blind",
};

const badgeColors: Record<string, string> = {
  "deaf-student": "bg-secondary-container text-on-secondary-container",
  "blind-student": "bg-tertiary-container text-on-tertiary-container",
  teacher: "bg-primary-container text-on-primary-container",
};

export function ParticipantsList() {
  const { session } = useClassroom();
  if (!session) return null;
  const participants = Array.from(
    new Map(
      session.participants
        .filter((participant) => participant.role !== "teacher" && participant.isOnline)
        .map((participant) => [participant.id, participant]),
    ).values(),
  );

  return (
    <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-outline-variant bg-white/90 p-3 shadow-[0_18px_48px_rgba(18,32,51,0.08)]">
      <div className="mb-unit flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-body text-label-lg text-on-surface">
          <Icon name="groups" />
          Alumnos ({participants.length})
        </h2>
        <button
          type="button"
          aria-label="Ver todos los alumnos"
          className="rounded p-1 text-primary hover:bg-primary/10"
        >
          <Icon name="open_in_new" />
        </button>
      </div>

      <ul className="flex-1 space-y-2 overflow-y-auto pr-1">
        {participants.length === 0 && (
          <li className="rounded-2xl border border-dashed border-outline-variant p-4 text-center font-body text-label-sm text-on-surface-variant">
            Esperando estudiantes conectados
          </li>
        )}
        {participants.map((participant) => (
          <li
            key={participant.id}
            className="flex items-center gap-3 rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-2 transition-colors hover:bg-surface-container-low"
          >
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold",
                badgeColors[participant.role] ?? "bg-surface-variant text-on-surface",
              )}
            >
              {participant.name.charAt(0)}
            </div>
            <span className="flex-1 truncate font-body text-label-sm">{participant.name}</span>
            {participant.accessibility && participant.accessibility !== "none" && (
              <Icon
                name={accessibilityIcons[participant.accessibility] ?? "person"}
                size={16}
                className="text-outline"
              />
            )}
            <span
              className={cn(
                "h-2 w-2 rounded-full",
                participant.isOnline ? "bg-secondary" : "bg-outline-variant",
              )}
              aria-label={participant.isOnline ? "En línea" : "Desconectado"}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
