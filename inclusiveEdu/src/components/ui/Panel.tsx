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
        "edu-glass flex flex-col overflow-hidden rounded-2xl",
        className,
      )}
    >
      <header className="flex items-center justify-between border-b border-outline-variant/70 bg-white/55 px-5 py-3">
        <h2 className="flex items-center gap-2 font-headline text-headline-md text-on-surface">
          {icon && (
            <span
              className="material-symbols-outlined rounded-xl bg-primary-fixed p-2 text-primary"
              aria-hidden="true"
            >
              {icon}
            </span>
          )}
          {title}
        </h2>
        {headerExtra}
      </header>
      <div className="flex flex-1 flex-col p-3">{children}</div>
    </section>
  );
}
