import { useToast } from "@/hooks/useToast";
import { cn } from "@/lib/cn";
import { Icon } from "./Icon";

const toastStyles = {
  info: "border-primary/25 bg-white/90 text-on-surface",
  success: "border-secondary/30 bg-secondary-container/90 text-on-secondary-container",
  error: "border-error/35 bg-error-container/95 text-on-error-container",
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
      className="pointer-events-none fixed bottom-6 right-6 z-[100] flex w-full max-w-sm flex-col gap-3 px-4 sm:px-0"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className={cn(
            "pointer-events-auto flex items-start gap-3 rounded-2xl border p-4 shadow-[0_18px_46px_rgba(18,32,51,0.16)] backdrop-blur-xl",
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
