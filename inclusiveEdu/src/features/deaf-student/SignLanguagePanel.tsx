import { AvatarVideo } from "@/features/deaf-student/components/AvatarVideo";
import { useGlossPlayer } from "@/features/deaf-student/hooks/useGlossPlayer";
import { useClassroom } from "@/hooks/useClassroom";
import { Icon } from "@/components/ui/Icon";
import type { SignGlossPayload } from "@/features/deaf-student/types/signEvents";

const DEMO_PAYLOAD: SignGlossPayload = {
  language: "LSP",
  mode: "simulation",
  original_text: "Hoy vamos a estudiar derivadas",
  gloss: ["TODAY", "STUDY", "DERIVATIVE"],
  pose: { mode: "mock_pose", frames: [] },
};

export function SignLanguagePanel() {
  const { latestSignGloss, setSignGloss, teacherIsSpeaking } = useClassroom();
  const { currentGloss, isPlaying } = useGlossPlayer(latestSignGloss?.gloss ?? []);
  const isSpeaking = teacherIsSpeaking || isPlaying;

  return (
    <section
      aria-label="Avatar de Lengua de Señas"
      className="flex h-full min-h-0 flex-col overflow-hidden rounded-3xl border border-outline-variant bg-white shadow-[0_18px_48px_rgba(18,32,51,0.1)]"
    >
      <header className="flex items-center justify-between gap-3 border-b border-outline-variant/70 px-4 py-3">
        <div>
          <p className="font-headline text-label-lg text-on-surface">Intérprete IA</p>
          <p className="font-body text-label-sm text-on-surface-variant">
            {isSpeaking ? "Interpretando" : "En espera"}
          </p>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-body text-[11px] font-semibold ${
            isSpeaking
              ? "bg-secondary-container text-on-secondary-container"
              : "bg-surface-variant text-on-surface-variant"
          }`}
        >
          <span className={`h-2 w-2 rounded-full ${isSpeaking ? "animate-pulse bg-secondary" : "bg-outline"}`} />
          IA
        </span>
      </header>

      <div className="min-h-0 flex-1 bg-[#0f172a] p-2">
        <AvatarVideo isSpeaking={isSpeaking} className="rounded-2xl shadow-none" />
      </div>

      <div className="border-t border-outline-variant/70 p-3">
        <button
          type="button"
          onClick={() => setSignGloss(DEMO_PAYLOAD)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-primary/20 bg-primary-fixed/70 px-3 py-2 font-body text-label-sm font-semibold text-on-primary-fixed transition-colors hover:bg-primary-fixed"
        >
          <Icon name="play_arrow" size={18} />
          Probar demo
        </button>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-surface-container px-3 py-1 font-body text-[11px] font-semibold text-on-surface-variant">
            {currentGloss ? `Glosa: ${currentGloss}` : "Sin glosa activa"}
          </span>
          <span className="rounded-full bg-secondary-container px-3 py-1 font-body text-[11px] font-semibold text-on-secondary-container">
            {isSpeaking ? "Docente hablando" : "Docente en pausa"}
          </span>
        </div>
      </div>
    </section>
  );
}
