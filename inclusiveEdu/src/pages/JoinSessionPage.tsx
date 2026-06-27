import { AppLayout } from "@/components/layout/AppLayout";
import { Footer } from "@/components/layout/Footer";
import { TopNavBar } from "@/components/layout/TopNavBar";
import { JoinSessionCard } from "@/features/home/RoleSelection";

export function JoinSessionPage() {
  return (
    <AppLayout>
      <TopNavBar variant="home" />
      <main className="edu-soft-grid flex flex-grow items-center justify-center px-margin-mobile py-16 md:px-margin-desktop">
        <JoinSessionCard />
      </main>
      <Footer />
    </AppLayout>
  );
}
