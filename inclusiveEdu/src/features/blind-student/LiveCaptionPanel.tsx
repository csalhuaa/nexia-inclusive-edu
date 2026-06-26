import { useClassroom } from "@/hooks/useClassroom";

export function LiveCaptionPanel() {
  const { session } = useClassroom();
  const caption = session?.currentCaption ?? "Esperando narración del docente…";

  return (
    <section
      aria-labelledby="live-caption-title"
      className="w-full max-w-4xl rounded-2xl border-2 border-primary/20 bg-gradient-to-b from-surface-container-lowest to-primary-fixed/10 p-8 text-center shadow-md md:p-12"
    >
      <h1 id="live-caption-title" className="sr-only">
        Texto narrado actualmente
      </h1>
      <p
        aria-live="assertive"
        className="flex min-h-[140px] items-center justify-center font-display text-[clamp(1.75rem,4vw,3rem)] leading-tight text-primary"
      >
        &ldquo;{caption}&rdquo;
      </p>
    </section>
  );
}
