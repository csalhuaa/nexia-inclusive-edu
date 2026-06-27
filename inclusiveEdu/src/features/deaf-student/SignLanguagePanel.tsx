import { Avatar2DPanel } from "@/features/deaf/components/Avatar2DPanel";
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
  const isSpeaking = isPlaying || Boolean(currentGloss);

  return (
    <section
      aria-label="Avatar de Lengua de Señas"
      className="absolute bottom-4 right-4 z-30 flex h-[min(56vh,520px)] w-[min(48vw,380px)] min-w-[230px] flex-col overflow-hidden rounded-2xl border-2 border-secondary/80 bg-[#0f172a] shadow-2xl"
    >
      <div className="relative min-h-0 flex-1">
        <Avatar2DPanel
          currentGloss={currentGloss}
          isPlaying={isPlaying}
          isSpeaking={isSpeaking}
          onDemo={() => setSignGloss(DEMO_PAYLOAD)}
        />
      </div>
      <GlossPanel
        payload={latestSignGloss}
        currentGloss={currentGloss}
        onDemo={() => setSignGloss(DEMO_PAYLOAD)}
      />
    </section>
  );
}
