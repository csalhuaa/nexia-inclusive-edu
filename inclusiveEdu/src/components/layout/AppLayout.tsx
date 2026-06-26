import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type AppLayoutProps = {
  children: ReactNode;
  className?: string;
  fullHeight?: boolean;
  overflowHidden?: boolean;
};

export function AppLayout({
  children,
  className,
  fullHeight = false,
  overflowHidden = false,
}: AppLayoutProps) {
  return (
    <div
      className={cn(
        "flex flex-col bg-background text-on-background",
        fullHeight ? "h-screen" : "min-h-screen",
        overflowHidden && "overflow-hidden",
        className,
      )}
    >
      {children}
    </div>
  );
}
