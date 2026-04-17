import { ReactNode, useState } from "react";
import Header from "@/components/Header";
import BottomTabBar from "./BottomTabBar";
import EarlyAccessBanner, { EARLY_ACCESS_BANNER_KEY } from "@/components/EarlyAccessBanner";
import FloatingFeedbackButton from "@/components/FloatingFeedbackButton";
import FeedbackDialog from "@/components/FeedbackDialog";

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [showFloating, setShowFloating] = useState(() => !!localStorage.getItem(EARLY_ACCESS_BANNER_KEY));

  return (
    <div className="h-dvh flex flex-col overflow-hidden bg-background">
      {/* Zone A: Header */}
      <Header />

      {/* Zones B + C: Main content area */}
      <main className="flex-1 flex flex-col min-h-0">
        <EarlyAccessBanner onDismiss={() => setShowFloating(true)} />
        {children}
      </main>

      {/* Zone C Layer 3: Bottom Tab Bar */}
      <BottomTabBar />

      {showFloating && (
        <FloatingFeedbackButton onClick={() => setFeedbackOpen(true)} />
      )}
      <FeedbackDialog open={feedbackOpen} onOpenChange={setFeedbackOpen} />
    </div>
  );
}
