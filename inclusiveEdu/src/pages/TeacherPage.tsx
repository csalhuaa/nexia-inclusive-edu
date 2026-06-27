import { AppLayout } from "@/components/layout/AppLayout";
import { SessionBar } from "@/components/classroom/SessionBar";
import { PageLoader } from "@/components/classroom/SessionWidgets";
import { TopNavBar } from "@/components/layout/TopNavBar";
import { ClassControlsBar } from "@/features/teacher/ClassControlsBar";
import { ParticipantsList } from "@/features/teacher/ParticipantsList";
import { TeacherWhiteboard } from "@/features/teacher/TeacherWhiteboard";
import { useSessionGuard } from "@/hooks/useSessionGuard";

export function TeacherPage() {
  const { isReady, isLoading } = useSessionGuard({ role: "teacher" });

  return (
    <AppLayout fullHeight overflowHidden>
      <TopNavBar variant="classroom" />
      <SessionBar />

      {!isReady || isLoading ? (
        <PageLoader label="Preparando aula del docente…" />
      ) : (
        <>
          <main className="relative flex flex-1 flex-col gap-gutter overflow-hidden bg-transparent p-unit md:flex-row">
            <TeacherWhiteboard />
            <aside className="flex w-full shrink-0 flex-col gap-unit md:w-72">
              <ParticipantsList />
            </aside>
          </main>
          <ClassControlsBar />
        </>
      )}
    </AppLayout>
  );
}
