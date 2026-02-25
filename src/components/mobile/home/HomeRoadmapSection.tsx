import { ChevronRight } from "lucide-react";
import { useDesign } from "@/contexts/DesignContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { RoadmapSummary } from "../thread/summaries/RoadmapSummary";
import { RoadmapPlaceholder } from "../thread/placeholders/RoadmapPlaceholder";

export default function HomeRoadmapSection() {
  const { userMoveInDate, setActiveTab } = useDesign();
  const { t } = useLanguage();

  return (
    <section className="px-4 py-5">
      <button
        onClick={() => setActiveTab("plan")}
        className="w-full text-left active:scale-[0.98] transition-transform"
      >
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {t("home.roadmap")}
          </h3>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </div>
        {userMoveInDate ? (
          <RoadmapSummary />
        ) : (
          <div>
            <RoadmapPlaceholder />
            <p className="text-xs text-muted-foreground mt-1">
              {t("home.setTimeline")}
            </p>
          </div>
        )}
      </button>
    </section>
  );
}
