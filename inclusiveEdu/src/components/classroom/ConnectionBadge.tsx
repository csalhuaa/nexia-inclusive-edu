import { useClassroom } from "@/hooks/useClassroom";
import { cn } from "@/lib/cn";

const modeLabels = {
  demo: { label: "Demo", color: "bg-tertiary-container text-on-tertiary-container" },
  api: { label: "En vivo", color: "bg-secondary text-on-secondary" },
  websocket: { label: "En vivo", color: "bg-secondary text-on-secondary" },
  offline: { label: "Sin conexión", color: "bg-error-container text-on-error-container" },
} as const;

export function ConnectionBadge() {
  const { session, apiAvailable } = useClassroom();

  const mode = session?.connectionMode ?? (apiAvailable === false ? "offline" : "demo");
  const config = modeLabels[mode];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3 py-1 font-body text-label-sm",
        config.color,
      )}
    >
      <span
        className={cn(
          "h-2 w-2 rounded-full",
          mode === "offline" ? "bg-error" : "animate-pulse bg-current",
        )}
        aria-hidden="true"
      />
      {config.label}
    </span>
  );
}
