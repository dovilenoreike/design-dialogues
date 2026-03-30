import { useDesign } from "@/contexts/DesignContext";
import DesignView from "./views/DesignView";
import SpecsView from "./views/SpecsView";
import BudgetView from "./views/BudgetView";
import PlanView from "./views/PlanView";
import MoodboardView from "./views/MoodboardView";

export default function MainContent() {
  const { activeTab } = useDesign();

  const content = (() => {
    switch (activeTab) {
      case "moodboard":
        return <MoodboardView />;
      case "design":
        return <DesignView />;
      case "specs":
        return <SpecsView />;
      case "budget":
        return <BudgetView />;
      case "plan":
        return <PlanView />;
      default:
        return <MoodboardView />;
    }
  })();

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex-1 flex flex-col min-h-0 w-full">
        {content}
      </div>
    </div>
  );
}
