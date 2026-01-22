import { DesignProvider, useDesign } from "@/contexts/DesignContext";
import AppShell from "@/components/mobile/AppShell";
import DesignView from "@/components/mobile/views/DesignView";
import SpecsView from "@/components/mobile/views/SpecsView";
import BudgetView from "@/components/mobile/views/BudgetView";
import PlanView from "@/components/mobile/views/PlanView";

function MainContent() {
  const { activeTab } = useDesign();

  switch (activeTab) {
    case "design":
      return <DesignView />;
    case "specs":
      return <SpecsView />;
    case "budget":
      return <BudgetView />;
    case "plan":
      return <PlanView />;
    default:
      return <DesignView />;
  }
}

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
