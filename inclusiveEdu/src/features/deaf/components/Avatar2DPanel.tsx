import { Icon } from "@/components/ui/Icon";
import { Avatar2D } from "@/features/deaf/components/Avatar2D";

type Avatar2DPanelProps = {
  currentGloss: string | null;
  isPlaying: boolean;
  isSpeaking?: boolean;
  onDemo: () => void;
};

export function Avatar2DPanel({
  currentGloss,
  isPlaying,
  isSpeaking = false,
  onDemo,
}: Avatar2DPanelProps) {
  return (
    <div className="relative h-full min-h-0 overflow-hidden bg-gradient-to-br from-[#0F172A] to-[#312E81]">
      <div className="absolute left-4 top-4 z-10 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 rounded-full bg-black/65 px-3 py-1.5 font-body text-label-sm text-white shadow-lg backdrop-blur-md">
          <Icon name="sign_language" size={18} />
          Interpretando: {currentGloss || "Esperando"}
          {isPlaying && (
            <span className="ml-1 h-2 w-2 animate-pulse rounded-full bg-secondary-fixed" aria-hidden="true" />
          )}
        </div>
        <div className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 font-body text-label-sm text-white/85 backdrop-blur-md">
          <span
            className={`h-2 w-2 rounded-full ${isSpeaking ? "animate-pulse bg-emerald-300" : "bg-white/35"}`}
            aria-hidden="true"
          />
          {isSpeaking ? "Docente hablando" : "En espera"}
        </div>
      </div>

      <button
        type="button"
        onClick={onDemo}
        className="absolute right-4 top-4 z-10 rounded-md border border-white/20 bg-white/10 px-3 py-2 font-body text-label-sm text-white shadow-lg backdrop-blur-md transition-colors hover:bg-white/18"
      >
        Probar demo
      </button>

      <Avatar2D currentGloss={currentGloss} isSpeaking={isSpeaking} />
    </div>
  );
}
