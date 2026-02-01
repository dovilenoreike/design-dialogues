import { useDesign } from "@/contexts/DesignContext";
import DesignView from "./views/DesignView";
import SpecsView from "./views/SpecsView";
import BudgetView from "./views/BudgetView";
import PlanView from "./views/PlanView";

export default function MainContent() {
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
