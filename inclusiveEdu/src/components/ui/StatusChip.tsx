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
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1",
        "bg-secondary-container text-on-secondary-container",
        "text-label-sm font-body",
        className,
      )}
    >
      {icon}
      {label}
    </span>
  );
}
