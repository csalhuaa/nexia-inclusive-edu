import { useEffect, useRef } from "react";
import { useClassroom } from "@/hooks/useClassroom";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/Icon";

export function LiveSubtitlesPanel() {
  const { session, setSubtitleSpeed } = useClassroom();
  const scrollRef = useRef<HTMLDivElement>(null);

  const subtitles = session?.subtitles ?? [];
  const currentLine = subtitles.at(-1)?.text ?? "";
  const history = subtitles.slice(-12, -1);
  const speed = session?.subtitleSpeed ?? 1;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [currentLine]);

  const adjustSpeed = (delta: number) => setSubtitleSpeed(speed + delta);

  return (
    <section
      aria-label="Subtítulos en vivo"
      className="flex h-full min-h-0 flex-col overflow-hidden rounded-3xl border border-outline-variant bg-white shadow-[0_18px_48px_rgba(18,32,51,0.1)]"
    >
      <header className="flex items-center justify-between border-b border-outline-variant/70 bg-white px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-secondary-container">
            <Icon name="closed_caption" size={22} className="text-secondary" />
          </div>
          <div>
            <p className="font-headline text-label-lg text-on-surface">Subtítulos</p>
            <p className="font-body text-label-sm text-on-surface-variant">Transcripción STT</p>
          </div>
          <span className="ml-2 flex items-center gap-1.5 rounded-full bg-error-container px-2.5 py-1 font-body text-label-sm font-semibold text-on-error-container">
            <span className="h-2 w-2 animate-pulse rounded-full bg-error" aria-hidden="true" />
            LIVE
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Reducir velocidad de lectura"
            onClick={() => adjustSpeed(-0.25)}
            disabled={speed <= 0.5}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-on-surface-variant transition-colors hover:bg-surface-variant disabled:opacity-40"
          >
            <Icon name="remove" size={20} />
          </button>
          <span className="min-w-[3rem] text-center font-body text-label-sm text-on-surface-variant">
            {speed.toFixed(1)}x
          </span>
          <button
            type="button"
            aria-label="Aumentar velocidad de lectura"
            onClick={() => adjustSpeed(0.25)}
            disabled={speed >= 2}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-on-surface-variant transition-colors hover:bg-surface-variant disabled:opacity-40"
          >
            <Icon name="add" size={20} />
          </button>
        </div>
      </header>

      <div ref={scrollRef} className="flex flex-1 flex-col justify-end gap-3 overflow-y-auto bg-surface-container-lowest p-4">
        {history.map((entry) => (
          <article
            key={entry.id}
            className="rounded-2xl bg-surface-container px-3 py-2 shadow-sm"
          >
            <p className="font-body text-[11px] font-semibold text-on-surface-variant">
              {new Date(entry.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </p>
            <p className="mt-1 font-body text-label-sm leading-relaxed text-on-surface-variant">
              {entry.text}
            </p>
          </article>
        ))}

        {currentLine ? (
          <article
            aria-live="polite"
            aria-atomic="true"
            className="rounded-3xl border border-primary/20 bg-primary-fixed/80 p-4 shadow-sm"
          >
            <p className="mb-1 font-body text-[11px] font-semibold text-on-primary-fixed-variant">
              Subtítulo actual
            </p>
            <p className={cn("font-headline text-body-lg leading-snug text-on-primary-fixed")}>
            {currentLine.split(" ").map((word, i, arr) => (
              <span
                key={`${entryWordKey(word, i)}`}
                className={cn(
                  "mr-1.5 inline",
                  i >= arr.length - 3 ? "text-primary font-bold" : "",
                )}
              >
                {word}
              </span>
            ))}
            </p>
          </article>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 py-6 text-center">
            <Icon name="hearing_disabled" size={40} className="text-outline" />
            <p className="font-body text-body-md text-on-surface-variant">
              Esperando transcripción del docente…
            </p>
            <p className="font-body text-label-sm text-outline">
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
