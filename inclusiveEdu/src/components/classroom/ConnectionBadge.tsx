import { useClassroom } from "@/hooks/useClassroom";
import { cn } from "@/lib/cn";

const modeLabels = {
  demo: { label: "Demo", color: "border-tertiary/25 bg-tertiary-container text-on-tertiary-container" },
  api: { label: "En vivo", color: "border-secondary/25 bg-secondary-container text-on-secondary-container" },
  websocket: { label: "En vivo", color: "border-secondary/25 bg-secondary-container text-on-secondary-container" },
  offline: { label: "Sin conexión", color: "border-error/25 bg-error-container text-on-error-container" },
} as const;

export function ConnectionBadge() {
  const { session, apiAvailable } = useClassroom();

  const mode = session?.connectionMode ?? (apiAvailable === false ? "offline" : "demo");
  const config = modeLabels[mode];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-body text-label-sm font-semibold shadow-sm",
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
