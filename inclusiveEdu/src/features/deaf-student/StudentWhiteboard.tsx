import { useClassroom } from "@/hooks/useClassroom";
import { Icon } from "@/components/ui/Icon";

export function StudentWhiteboard() {
  const { latestScreenFrame } = useClassroom();

  if (!latestScreenFrame) {
    return (
      <section
        aria-label="Pantalla del docente"
        className="flex flex-1 flex-col items-center justify-center gap-6 rounded-2xl border-2 border-dashed border-outline-variant bg-surface-container-lowest p-8 md:flex-1"
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
      className="relative flex w-full flex-col overflow-hidden rounded-2xl border-2 border-outline-variant bg-black shadow-sm md:flex-1"
    >
      <div className="flex min-h-0 flex-1 items-center justify-center bg-black p-1">
        <img
          src={latestScreenFrame.data}
          alt="Pantalla compartida por el docente"
          className="h-full w-full rounded-xl object-contain"
          style={{ maxHeight: "calc(100vh - 320px)" }}
        />
      </div>
    </section>
  );
}