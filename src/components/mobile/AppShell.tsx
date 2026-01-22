import { ReactNode } from "react";
import Header from "@/components/Header";
import BottomTabBar from "./BottomTabBar";

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  return (
    <div className="h-dvh flex flex-col overflow-hidden bg-background">
      {/* Zone A: Header */}
      <Header />

      {/* Zones B + C: Main content area */}
      <main className="flex-1 flex flex-col min-h-0">
        {children}
      </main>

      {/* Zone C Layer 3: Bottom Tab Bar */}
      <BottomTabBar />
    </div>
  );
}
