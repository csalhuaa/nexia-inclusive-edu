import { AppLayout } from "@/components/layout/AppLayout";
import { SessionBar } from "@/components/classroom/SessionBar";
import { PageLoader } from "@/components/classroom/SessionWidgets";
import { Footer } from "@/components/layout/Footer";
import { TopNavBar } from "@/components/layout/TopNavBar";
import { AudioStatusBar } from "@/features/blind-student/AudioStatusBar";
import { ClassActionButtons } from "@/features/blind-student/ClassActionButtons";
import { LiveCaptionPanel } from "@/features/blind-student/LiveCaptionPanel";
import { useSessionGuard } from "@/hooks/useSessionGuard";

export function BlindStudentPage() {
  const { isReady, isLoading } = useSessionGuard({ role: "blind-student", autoCreate: false });

  return (
    <AppLayout>
      <TopNavBar variant="classroom" />
      <SessionBar />

      {!isReady || isLoading ? (
        <PageLoader label="Conectando a la clase…" />
      ) : (
        <main
          id="main-content"
          role="main"
          aria-label="Contenido Principal: Clase en curso"
          className="flex flex-grow flex-col items-center justify-center gap-8 p-gutter md:p-container-padding"
        >
          <AudioStatusBar />
          <LiveCaptionPanel />
          <ClassActionButtons />
        </main>
      )}

      <Footer />
    </AppLayout>
  );
}
