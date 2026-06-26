import { ClassroomProvider } from "@/context/ClassroomProvider";
import { ToastProvider } from "@/context/ToastProvider";
import { useToast } from "@/hooks/useToast";
import { ToastContainer } from "@/components/ui/ToastContainer";

function AppProvidersInner({ children }: { children: React.ReactNode }) {
  const { showToast } = useToast();
  return (
    <ClassroomProvider onToast={showToast}>
      {children}
      <ToastContainer />
    </ClassroomProvider>
  );
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <AppProvidersInner>{children}</AppProvidersInner>
    </ToastProvider>
  );
}
