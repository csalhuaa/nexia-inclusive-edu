import { AppLayout } from "@/components/layout/AppLayout";
import { SessionBar } from "@/components/classroom/SessionBar";
import { PageLoader } from "@/components/classroom/SessionWidgets";
import { SessionEndedNotice } from "@/components/classroom/SessionEndedNotice";
import { TopNavBar } from "@/components/layout/TopNavBar";
import { LiveSubtitlesPanel } from "@/features/deaf-student/LiveSubtitlesPanel";
import { SignLanguagePanel } from "@/features/deaf-student/SignLanguagePanel";
import { StudentWhiteboard } from "@/features/deaf-student/StudentWhiteboard";
import { useSessionGuard } from "@/hooks/useSessionGuard";
import { useClassroom } from "@/hooks/useClassroom";
import { Icon } from "@/components/ui/Icon";
import { useGlossPlayer } from "@/features/deaf-student/hooks/useGlossPlayer";

function VisionCaptionBar() {
  const { session } = useClassroom();
  const caption = session?.currentCaption;
  if (!caption) return null;

  return (
    <div className="edu-glass flex items-start gap-3 rounded-2xl px-4 py-3">
      <Icon name="description" size={20} className="mt-0.5 shrink-0 text-secondary" />
      <p className="font-body text-body-md leading-relaxed text-on-surface">
        {caption}
      </p>
    </div>
  );
}

export function DeafStudentPage() {
  const { isReady, isLoading } = useSessionGuard({ role: "deaf-student", autoCreate: false });
  const { session, latestSignGloss, teacherIsSpeaking } = useClassroom();
  const { currentGloss, isPlaying } = useGlossPlayer(latestSignGloss?.gloss ?? []);
  const isInterpreting = teacherIsSpeaking || isPlaying;

  return (
    <AppLayout fullHeight overflowHidden>
      <TopNavBar variant="classroom" />
      <SessionBar />

      {!isReady || isLoading ? (
        <PageLoader label="Conectando a la clase…" />
      ) : session?.status === "ended" ? (
        <SessionEndedNotice message="La clase terminó. Puedes volver al inicio para unirte a otra sesión." />
      ) : (
        <div className="grid flex-1 grid-rows-[minmax(0,1fr)_auto] gap-3 overflow-hidden bg-transparent p-3 md:p-gutter">
          <div className="grid min-h-0 gap-3 md:grid-cols-2 md:grid-rows-[minmax(0,1fr)_minmax(260px,36vh)] xl:grid-cols-[22%_58%_20%] xl:grid-rows-1">
            <div className="min-h-[300px] md:order-2 xl:order-1 xl:min-h-0">
              <SignLanguagePanel />
            </div>
            <div className="min-h-[340px] md:order-1 md:col-span-2 xl:order-2 xl:col-span-1 xl:min-h-0">
              <StudentWhiteboard />
            </div>
            <div className="min-h-[280px] md:order-3 xl:order-3 xl:min-h-0">
              <LiveSubtitlesPanel />
            </div>
          </div>

          <div className="rounded-3xl border border-outline-variant bg-white px-4 py-3 shadow-[0_12px_32px_rgba(18,32,51,0.08)]">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-primary-fixed px-3 py-1.5 font-body text-label-sm font-semibold text-on-primary-fixed">
                {currentGloss ? `Glosa actual: ${currentGloss}` : "Glosa actual: esperando"}
              </span>
              <span className="rounded-full bg-secondary-container px-3 py-1.5 font-body text-label-sm font-semibold text-on-secondary-container">
                {isInterpreting ? "Interpretando" : "Intérprete en espera"}
              </span>
              <span className="rounded-full bg-surface-container px-3 py-1.5 font-body text-label-sm font-semibold text-on-surface-variant">
                {teacherIsSpeaking ? "Docente hablando" : "Docente en pausa"}
              </span>
              <span className="rounded-full bg-tertiary-container px-3 py-1.5 font-body text-label-sm font-semibold text-on-tertiary-container">
                IA: {latestSignGloss?.mode ?? "simulación"}
              </span>
            </div>
            <VisionCaptionBar />
          </div>
        </div>
      )}
    </AppLayout>
  );
}
