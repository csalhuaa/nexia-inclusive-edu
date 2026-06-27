import { useClassroom } from "@/hooks/useClassroom";
import { Icon } from "@/components/ui/Icon";

export function StudentWhiteboard() {
  const { latestScreenFrame } = useClassroom();

  if (!latestScreenFrame) {
    return (
      <section
        aria-label="Pantalla del docente"
        className="flex h-full min-h-0 flex-col items-center justify-center gap-6 rounded-3xl border border-dashed border-outline-variant bg-white p-8 shadow-[0_18px_48px_rgba(18,32,51,0.08)]"
      >
        <Icon name="present_to_all" size={64} className="text-outline-variant" />
        <div className="text-center">
          <p className="font-headline text-headline-md text-on-surface">
            Esperando presentación del docente
          </p>
          <p className="mt-2 font-body text-body-md text-on-surface-variant">
            La pantalla que el docente comparta aparecerá aquí en tiempo real
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      aria-label="Pantalla del docente"
      className="relative flex h-full min-h-0 w-full flex-col overflow-hidden rounded-3xl border border-outline-variant bg-black shadow-[0_18px_48px_rgba(18,32,51,0.16)]"
    >
      <div className="absolute left-3 top-3 z-10 rounded-full bg-black/70 px-3 py-1.5 font-body text-label-sm font-semibold text-white backdrop-blur-md">
        Pantalla del docente en vivo
      </div>
      <div className="flex min-h-0 flex-1 items-center justify-center bg-black p-1">
        <img
          src={latestScreenFrame.data}
          alt="Pantalla compartida por el docente"
          className="h-full w-full rounded-xl object-contain"
          style={{ maxHeight: "calc(100vh - 260px)" }}
        />
      </div>
    </section>
  );
}
