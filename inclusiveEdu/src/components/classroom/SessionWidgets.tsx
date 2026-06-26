import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/Icon";

type MediaToggleProps = {
  icon: string;
  offIcon?: string;
  label: string;
  active: boolean;
  onClick: () => void;
  hideLabel?: boolean;
};

export function MediaToggle({
  icon,
  offIcon,
  label,
  active,
  onClick,
  hideLabel,
}: MediaToggleProps) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "flex min-h-touch-target-min items-center justify-center gap-2 rounded-lg border px-4 py-2 font-body text-label-lg transition-colors focus-visible:ring-3 focus-visible:ring-primary focus-visible:ring-offset-2",
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-outline-variant bg-surface text-on-surface-variant hover:bg-surface-variant",
      )}
    >
      <Icon name={active ? icon : (offIcon ?? icon)} />
      {!hideLabel && <span className="hidden sm:inline">{label}</span>}
    </button>
  );
}

export function PageLoader({ label = "Conectando a la clase…" }: { label?: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-gutter">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
      <p className="font-body text-body-md text-on-surface-variant">{label}</p>
    </div>
  );
}
