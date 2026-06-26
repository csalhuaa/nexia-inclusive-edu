import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type PanelProps = {
  title: string;
  icon?: string;
  children: ReactNode;
  className?: string;
  headerExtra?: ReactNode;
};

export function Panel({ title, icon, children, className, headerExtra }: PanelProps) {
  return (
    <section
      className={cn(
        "flex flex-col rounded-lg border-2 border-outline-variant bg-surface-container-lowest shadow-sm",
        className,
      )}
    >
      <header className="flex items-center justify-between border-b border-outline-variant bg-surface-container-low px-4 py-2">
        <h2 className="flex items-center gap-2 font-headline text-headline-md text-on-surface">
          {icon && <span className="material-symbols-outlined" aria-hidden="true">{icon}</span>}
          {title}
        </h2>
        {headerExtra}
      </header>
      <div className="flex flex-1 flex-col p-unit">{children}</div>
    </section>
  );
}
