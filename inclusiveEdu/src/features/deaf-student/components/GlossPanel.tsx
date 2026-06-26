import type { SignGlossPayload } from "@/features/deaf-student/types/signEvents";

type GlossPanelProps = {
  payload: SignGlossPayload | null;
  currentGloss: string | null;
  onDemo: () => void;
};

export function GlossPanel({ payload, currentGloss, onDemo }: GlossPanelProps) {
  return (
    <div className="border-t border-white/10 bg-black/55 p-3 backdrop-blur-sm">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div>
          <p className="font-body text-[11px] uppercase tracking-wide text-white/50">
            {payload ? `${payload.language} · ${payload.mode}` : "Simulación"}
          </p>
          <p className="line-clamp-2 font-body text-label-sm text-white/90">
            {payload?.original_text || "Esperando glosas del docente..."}
          </p>
        </div>
        <button
          type="button"
          onClick={onDemo}
          className="shrink-0 rounded-md border border-white/20 px-2 py-1 font-body text-[11px] text-white transition-colors hover:bg-white/10"
        >
          Probar demo
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {(payload?.gloss ?? []).map((gloss, index) => (
          <span
            key={`${gloss}-${index}`}
            className={`rounded-full px-2 py-1 font-body text-[11px] font-bold ${
              gloss === currentGloss
                ? "bg-secondary-fixed text-on-secondary-fixed"
                : "bg-white/10 text-white/80"
            }`}
          >
            {gloss}
          </span>
        ))}
      </div>
    </div>
  );
}
