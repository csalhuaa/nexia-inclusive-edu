import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";

const SIGNING_VIDEO = "/videos/video1.mp4";

type AvatarVideoProps = {
  isSpeaking: boolean;
  className?: string;
  compact?: boolean;
};

export function AvatarVideo({ isSpeaking, className, compact = false }: AvatarVideoProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isSpeaking) {
      void video.play().catch(() => undefined);
    } else {
      video.pause();
    }
  }, [isSpeaking]);

  return (
    <div
      className={cn(
        "relative h-full w-full overflow-hidden rounded-xl bg-[#0f172a] shadow-xl",
        compact && "aspect-video min-h-[120px]",
        className,
      )}
    >
      <video
        ref={videoRef}
        className="h-full w-full object-cover transition-opacity duration-200 ease-out opacity-100"
        style={{ objectPosition: compact ? "center 38%" : "center 42%" }}
        muted
        loop
        playsInline
        preload="auto"
        src={SIGNING_VIDEO}
      />
      <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-white/10" />
    </div>
  );
}
