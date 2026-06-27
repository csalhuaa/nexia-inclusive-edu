import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

const SIGNING_VIDEO = "/videos/video1.mp4";
const IDLE_VIDEO = "/videos/video2.mp4";

type AvatarVideoProps = {
  isSpeaking: boolean;
  className?: string;
  compact?: boolean;
};

export function AvatarVideo({ isSpeaking, className, compact = false }: AvatarVideoProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isFading, setIsFading] = useState(false);
  const src = isSpeaking ? SIGNING_VIDEO : IDLE_VIDEO;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setIsFading(true);
    const fadeTimer = window.setTimeout(() => setIsFading(false), 180);

    video.pause();
    video.src = src;
    video.load();
    video.currentTime = 0;
    void video.play().catch(() => undefined);

    return () => window.clearTimeout(fadeTimer);
  }, [src]);

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
        className={cn(
          "h-full w-full object-cover transition-opacity duration-200 ease-out",
          isFading ? "opacity-75" : "opacity-100",
        )}
        style={{ objectPosition: compact ? "center 32%" : "center 35%" }}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        src={src}
      />
      <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-white/10" />
    </div>
  );
}
