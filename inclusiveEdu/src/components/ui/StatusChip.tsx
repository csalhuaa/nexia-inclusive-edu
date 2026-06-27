import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type StatusChipProps = {
  label: string;
  className?: string;
  icon?: ReactNode;
};

export function StatusChip({ label, className, icon }: StatusChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-secondary/20 px-3 py-1.5",
        "bg-secondary-container/80 text-on-secondary-container shadow-sm",
        "text-label-sm font-body font-semibold",
        className,
      )}
    >
      {icon}
      {label}
    </span>
  );
}
