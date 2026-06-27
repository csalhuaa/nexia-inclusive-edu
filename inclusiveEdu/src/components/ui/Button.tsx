import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "outline" | "danger" | "ghost";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  children: ReactNode;
  fullWidth?: boolean;
};

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-on-primary shadow-[0_12px_28px_rgba(37,72,199,0.22)] hover:bg-primary/90 hover:shadow-[0_16px_34px_rgba(37,72,199,0.28)] focus-visible:ring-primary",
  secondary:
    "bg-secondary text-on-secondary shadow-[0_12px_28px_rgba(0,140,138,0.2)] hover:bg-secondary/90 hover:shadow-[0_16px_34px_rgba(0,140,138,0.26)] focus-visible:ring-secondary",
  outline:
    "border border-primary/35 bg-primary/5 text-primary shadow-sm hover:border-primary/55 hover:bg-primary/10 focus-visible:ring-primary",
  danger:
    "bg-error text-on-error shadow-[0_12px_28px_rgba(180,35,24,0.2)] hover:bg-error/90 focus-visible:ring-error font-bold",
  ghost:
    "border border-outline-variant bg-white/70 text-on-surface shadow-sm hover:bg-surface-variant focus-visible:ring-primary",
};

export function Button({
  variant = "primary",
  fullWidth = false,
  className,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl px-7 py-3.5",
        "text-label-lg font-body transition-all duration-200",
        "min-h-touch-target-min focus-visible:ring-3 focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-55",
        variantStyles[variant],
        fullWidth && "w-full",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
