import { AppLayout } from "@/components/layout/AppLayout";
import { SessionBar } from "@/components/classroom/SessionBar";
import { PageLoader } from "@/components/classroom/SessionWidgets";
import { TopNavBar } from "@/components/layout/TopNavBar";
import { LiveSubtitlesPanel } from "@/features/deaf-student/LiveSubtitlesPanel";
import { SignLanguagePanel } from "@/features/deaf-student/SignLanguagePanel";
import { StudentWhiteboard } from "@/features/deaf-student/StudentWhiteboard";
import { useSessionGuard } from "@/hooks/useSessionGuard";
import { useClassroom } from "@/hooks/useClassroom";
import { Icon } from "@/components/ui/Icon";

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

  return (
    <AppLayout fullHeight overflowHidden>
      <TopNavBar variant="classroom" />
      <SessionBar />

      {!isReady || isLoading ? (
        <PageLoader label="Conectando a la clase…" />
      ) : (
        <div className="flex flex-1 flex-col overflow-hidden bg-transparent">
          <div className="flex flex-1 flex-col gap-3 overflow-hidden p-3 md:flex-row md:p-gutter">
            <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
              <StudentWhiteboard />
              <VisionCaptionBar />
            </div>

            <div className="shrink-0 md:w-80 md:max-h-full">
              <SignLanguagePanel />
            </div>
          </div>

          <LiveSubtitlesPanel />
        </div>
      )}
    </AppLayout>
  );
}
