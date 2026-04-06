import dynamic from "next/dynamic";
import { ProtectedLayout } from "@/components/ProtectedLayout";

// Lazily load the view to prevent CSS chunks from being preloaded
// if the user is unauthenticated (e.g., session expired).
const OnboardingView = dynamic(() => import("@/views/OnboardingView"), {
  ssr: false,
  loading: () => <div className="h-screen animate-pulse bg-muted/10 rounded-lg" />
});

export default function SetUsernameRoute() {
  return (
    <ProtectedLayout>
      <OnboardingView />
    </ProtectedLayout>
  );
}
