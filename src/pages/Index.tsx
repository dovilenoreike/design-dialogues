import { DesignProvider } from "@/contexts/DesignContext";
import AppShell from "@/components/mobile/AppShell";
import MainContent from "@/components/mobile/MainContent";

const Index = () => {
  return (
    <DesignProvider>
      <AppShell>
        <MainContent />
      </AppShell>
    </DesignProvider>
  );
};

export default Index;
