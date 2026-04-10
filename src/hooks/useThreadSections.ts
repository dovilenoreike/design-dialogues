import { useMemo } from "react";
import { useDesign } from "@/contexts/DesignContext";

export interface ThreadSectionState {
  concept: boolean;
  materials: boolean;
  budget: boolean;
  planAudit: boolean;
  roadmap: boolean;
}

export function useThreadSections(): ThreadSectionState {
  const {
    generation,
    design,
    materialOverrides,
    formData,
    layoutAuditResponses,
    userMoveInDate,
    completedTasks,
  } = useDesign();

  return useMemo(() => {
    // CONCEPT: has generated images or uploaded images
    const hasUploadedImages = Object.values(design.uploadedImages).some(img => img !== null);
    const hasGeneratedImages = Object.values(generation.generatedImages).some(img => img !== null);
    const concept = !!(hasGeneratedImages || hasUploadedImages);

    // MATERIALS: has any material overrides applied
    const materials = Object.keys(materialOverrides ?? {}).length > 0;

    // BUDGET: has form data
    const budget = formData !== null;

    // PLAN AUDIT: has any audit responses
    const planAudit = Object.keys(layoutAuditResponses).length > 0;

    // ROADMAP: has move-in date OR any completed tasks
    const roadmap = userMoveInDate !== null || completedTasks.size > 0;

    return {
      concept,
      materials,
      budget,
      planAudit,
      roadmap,
    };
  }, [generation.generatedImages, design.uploadedImages, materialOverrides, formData, layoutAuditResponses, userMoveInDate, completedTasks]);
}
