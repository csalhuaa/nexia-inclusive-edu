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
    "bg-primary text-on-primary hover:bg-primary/90 focus-visible:ring-primary",
  secondary:
    "bg-secondary text-on-secondary hover:bg-secondary/90 focus-visible:ring-secondary",
  outline:
    "bg-transparent border-2 border-primary text-primary hover:bg-primary/5 focus-visible:ring-primary",
  danger:
    "bg-error text-on-error hover:bg-on-error-container focus-visible:ring-error font-bold shadow-sm",
  ghost:
    "bg-surface text-on-surface border border-outline-variant hover:bg-surface-variant focus-visible:ring-primary",
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
        "inline-flex items-center justify-center gap-2 rounded-lg px-8 py-4",
        "text-label-lg font-body transition-colors",
        "min-h-touch-target-min focus-visible:ring-3 focus-visible:ring-offset-2",
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
