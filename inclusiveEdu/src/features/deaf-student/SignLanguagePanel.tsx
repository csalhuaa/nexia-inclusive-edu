import { SignAvatarCanvas } from "@/features/deaf-student/components/SignAvatarCanvas";
import { CurrentSignBadge } from "@/features/deaf-student/components/CurrentSignBadge";
import { GlossPanel } from "@/features/deaf-student/components/GlossPanel";
import { useGlossPlayer } from "@/features/deaf-student/hooks/useGlossPlayer";
import { useClassroom } from "@/hooks/useClassroom";
import type { SignGlossPayload } from "@/features/deaf-student/types/signEvents";

const DEMO_PAYLOAD: SignGlossPayload = {
  language: "LSP",
  mode: "simulation",
  original_text: "Hoy vamos a estudiar derivadas",
  gloss: ["TODAY", "STUDY", "DERIVATIVE"],
  pose: { mode: "mock_pose", frames: [] },
};

export function SignLanguagePanel() {
  const { latestSignGloss, setSignGloss } = useClassroom();
  const { currentGloss, isPlaying } = useGlossPlayer(latestSignGloss?.gloss ?? []);

  return (
    <section
      aria-label="Avatar de Lengua de Señas"
      className="flex h-[320px] w-full flex-col overflow-hidden rounded-2xl border-2 border-secondary/80 bg-[#0f172a] shadow-2xl md:h-[min(56vh,520px)] md:w-auto"
    >
      <div className="relative min-h-0 flex-1">
        <CurrentSignBadge currentGloss={currentGloss} isPlaying={isPlaying} />
        <SignAvatarCanvas currentGloss={currentGloss} />
      </div>
      <GlossPanel
        payload={latestSignGloss}
        currentGloss={currentGloss}
        onDemo={() => setSignGloss(DEMO_PAYLOAD)}
      />
    </section>
  );
}
