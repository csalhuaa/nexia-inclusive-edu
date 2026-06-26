import { useToast } from "@/hooks/useToast";
import { cn } from "@/lib/cn";
import { Icon } from "./Icon";

const toastStyles = {
  info: "border-primary/30 bg-surface-container-lowest text-on-surface",
  success: "border-secondary/40 bg-secondary-container/30 text-on-secondary-container",
  error: "border-error/40 bg-error-container text-on-error-container",
} as const;

const toastIcons = {
  info: "info",
  success: "check_circle",
  error: "error",
} as const;

export function ToastContainer() {
  const { toasts, dismissToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed bottom-6 right-6 z-[100] flex w-full max-w-sm flex-col gap-3"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className={cn(
            "pointer-events-auto flex items-start gap-3 rounded-xl border-2 p-4 shadow-lg backdrop-blur-sm",
            toastStyles[toast.type],
          )}
        >
          <Icon name={toastIcons[toast.type]} size={22} className="mt-0.5 shrink-0" />
          <p className="flex-1 font-body text-label-lg">{toast.message}</p>
          <button
            type="button"
            aria-label="Cerrar notificación"
            onClick={() => dismissToast(toast.id)}
            className="shrink-0 rounded-full p-1 opacity-70 hover:opacity-100"
          >
            <Icon name="close" size={18} />
          </button>
        </div>
      ))}
    </div>
  );
}
