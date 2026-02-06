import { useDesign } from "@/contexts/DesignContext";
import ThreadView from "./views/ThreadView";
import DesignView from "./views/DesignView";
import SpecsView from "./views/SpecsView";
import BudgetView from "./views/BudgetView";
import PlanView from "./views/PlanView";

export default function MainContent() {
  const { activeTab } = useDesign();

  const content = (() => {
    switch (activeTab) {
      case "thread":
        return <ThreadView />;
      case "design":
        return <DesignView />;
      case "specs":
        return <SpecsView />;
      case "budget":
        return <BudgetView />;
      case "plan":
        return <PlanView />;
      default:
        return <ThreadView />;
    }
  })();

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex-1 flex flex-col min-h-0 w-full max-w-2xl mx-auto">
        {content}
      </div>
    </div>
  );
}
