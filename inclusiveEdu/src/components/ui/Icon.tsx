import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type IconProps = HTMLAttributes<HTMLSpanElement> & {
  name: string;
  filled?: boolean;
  size?: number;
};

export function Icon({ name, filled = false, size, className, ...props }: IconProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "material-symbols-outlined",
        filled && "icon-fill",
        className,
      )}
      style={size ? { fontSize: size } : undefined}
      {...props}
    >
      {name}
    </span>
  );
}
