import { useEffect, useRef } from "react";
import { useClassroom } from "@/hooks/useClassroom";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/Icon";

export function LiveSubtitlesPanel() {
  const { session, setSubtitleSpeed } = useClassroom();
  const scrollRef = useRef<HTMLDivElement>(null);

  const subtitles = session?.subtitles ?? [];
  const currentLine = subtitles.at(-1)?.text ?? "";
  const history = subtitles.slice(-6, -1);
  const speed = session?.subtitleSpeed ?? 1;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [currentLine]);

  const adjustSpeed = (delta: number) => setSubtitleSpeed(speed + delta);

  return (
    <section
      aria-label="Subtítulos en vivo"
      className="flex min-h-[220px] shrink-0 flex-col overflow-hidden rounded-2xl border-2 border-outline-variant bg-[#0a0a12] shadow-xl md:min-h-[260px]"
    >
      <header className="flex items-center justify-between border-b border-white/10 bg-[#12121c] px-5 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/20">
            <Icon name="closed_caption" size={22} className="text-secondary-fixed" />
          </div>
          <div>
            <p className="font-headline text-label-lg text-white">Subtítulos en Vivo</p>
            <p className="font-body text-label-sm text-white/60">Transcripción automática (STT)</p>
          </div>
          <span className="ml-2 flex items-center gap-1.5 rounded-full bg-error/20 px-2.5 py-1 font-body text-label-sm text-red-300">
            <span className="h-2 w-2 animate-pulse rounded-full bg-red-400" aria-hidden="true" />
            LIVE
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Reducir velocidad de lectura"
            onClick={() => adjustSpeed(-0.25)}
            disabled={speed <= 0.5}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-white/80 transition-colors hover:bg-white/10 disabled:opacity-40"
          >
            <Icon name="remove" size={20} />
          </button>
          <span className="min-w-[4rem] text-center font-body text-label-sm text-white/90">
            {speed.toFixed(1)}x
          </span>
          <button
            type="button"
            aria-label="Aumentar velocidad de lectura"
            onClick={() => adjustSpeed(0.25)}
            disabled={speed >= 2}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-white/80 transition-colors hover:bg-white/10 disabled:opacity-40"
          >
            <Icon name="add" size={20} />
          </button>
        </div>
      </header>

      <div ref={scrollRef} className="flex flex-1 flex-col justify-end gap-3 overflow-y-auto p-5 md:p-6">
        {history.map((entry) => (
          <p
            key={entry.id}
            className="font-body text-body-md leading-relaxed text-white/35 transition-opacity"
          >
            {entry.text}
          </p>
        ))}

        {currentLine ? (
          <p
            aria-live="polite"
            aria-atomic="true"
            className={cn(
              "subtitle-current font-headline text-headline-lg-mobile leading-snug text-white md:text-headline-lg",
            )}
          >
            {currentLine.split(" ").map((word, i, arr) => (
              <span
                key={`${entryWordKey(word, i)}`}
                className={cn(
                  "mr-1.5 inline",
                  i >= arr.length - 3 ? "text-secondary-fixed font-bold" : "",
                )}
              >
                {word}
              </span>
            ))}
          </p>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 py-6 text-center">
            <Icon name="hearing_disabled" size={40} className="text-white/30" />
            <p className="font-body text-body-md text-white/50">
              Esperando transcripción del docente…
            </p>
            <p className="font-body text-label-sm text-white/30">
              Los subtítulos aparecerán aquí en tiempo real
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function entryWordKey(word: string, index: number) {
  return `${index}-${word}`;
}
