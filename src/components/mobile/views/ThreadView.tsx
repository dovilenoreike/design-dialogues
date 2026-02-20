import { useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useThreadSections } from "@/hooks/useThreadSections";
import { ThreadHeader } from "../thread/ThreadHeader";
import { ThreadSection } from "../thread/ThreadSection";
import { ConceptSummary } from "../thread/summaries/ConceptSummary";
import { MaterialsSummary } from "../thread/summaries/MaterialsSummary";
import { BudgetSummary } from "../thread/summaries/BudgetSummary";
import { AuditSummary } from "../thread/summaries/AuditSummary";
import { RoadmapSummary } from "../thread/summaries/RoadmapSummary";
import { ConceptPlaceholder } from "../thread/placeholders/ConceptPlaceholder";
import { MaterialsPlaceholder } from "../thread/placeholders/MaterialsPlaceholder";
import { BudgetPlaceholder } from "../thread/placeholders/BudgetPlaceholder";
import { AuditPlaceholder } from "../thread/placeholders/AuditPlaceholder";
import { RoadmapPlaceholder } from "../thread/placeholders/RoadmapPlaceholder";

export default function ThreadView() {
  const { t } = useLanguage();
  const sections = useThreadSections();

  // Determine which section is active (first incomplete one)
  const activeSection = useMemo(() => {
    if (!sections.concept) return "concept";
    if (!sections.materials) return "materials";
    if (!sections.budget) return "budget";
    if (!sections.planAudit) return "planAudit";
    if (!sections.roadmap) return "roadmap";
    return null; // All completed
  }, [sections]);

  return (
    <div className="relative flex-1">
      <div className="absolute inset-0 overflow-y-auto">
        <div className="px-6 pt-4 pb-8">
          <ThreadHeader />

          <div className="mt-10">
            <ThreadSection
              title={t("thread.concept")}
              ctaText={t("thread.conceptCta")}
              placeholder={<ConceptPlaceholder />}
              targetTab="design"
              completed={sections.concept}
              active={activeSection === "concept"}
            >
              <ConceptSummary />
            </ThreadSection>

            <ThreadSection
              title={t("thread.materials")}
              ctaText={t("thread.materialsCta")}
              placeholder={<MaterialsPlaceholder />}
              targetTab="specs"
              completed={sections.materials}
              active={activeSection === "materials"}
            >
              <MaterialsSummary />
            </ThreadSection>

            <ThreadSection
              title={t("thread.budget")}
              ctaText={t("thread.budgetCta")}
              placeholder={<BudgetPlaceholder />}
              targetTab="budget"
              completed={sections.budget}
              active={activeSection === "budget"}
            >
              <BudgetSummary />
            </ThreadSection>

            <ThreadSection
              title={t("thread.planAudit")}
              ctaText={t("thread.planAuditCta")}
              placeholder={<AuditPlaceholder />}
              targetTab="plan"
              completed={sections.planAudit}
              active={activeSection === "planAudit"}
            >
              <AuditSummary />
            </ThreadSection>

            <ThreadSection
              title={t("thread.roadmap")}
              ctaText={t("thread.roadmapCta")}
              placeholder={<RoadmapPlaceholder />}
              targetTab="plan"
              completed={sections.roadmap}
              active={activeSection === "roadmap"}
              isLast
            >
              <RoadmapSummary />
            </ThreadSection>
          </div>
        </div>
      </div>
    </div>
  );
}
