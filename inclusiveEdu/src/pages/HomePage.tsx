import { AppLayout } from "@/components/layout/AppLayout";
import { Footer } from "@/components/layout/Footer";
import { TopNavBar } from "@/components/layout/TopNavBar";
import { HomeHero, RoleSelection } from "@/features/home/RoleSelection";

export function HomePage() {
  return (
    <AppLayout>
      <TopNavBar variant="home" />

      <main className="relative flex flex-grow flex-col items-center justify-center p-margin-mobile md:p-margin-desktop">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary via-surface to-surface opacity-5"
        />
        <div className="z-10 w-full max-w-5xl space-y-12">
          <HomeHero />
          <RoleSelection />
        </div>
      </main>

      <Footer />
    </AppLayout>
  );
}
