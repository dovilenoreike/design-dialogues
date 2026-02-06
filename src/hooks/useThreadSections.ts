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
    formData,
    layoutAuditResponses,
    userMoveInDate,
    completedTasks,
  } = useDesign();

  return useMemo(() => {
    // CONCEPT: has generated image, uploaded images, OR has selected palette+style (pregenerated)
    const hasUploadedImages = Object.values(design.uploadedImages).some(img => img !== null);
    const hasPregenerated = design.selectedMaterial !== null && design.selectedStyle !== null;
    const concept = !!(generation.generatedImage || hasUploadedImages || hasPregenerated);

    // MATERIALS: has selected material (palette)
    const materials = design.selectedMaterial !== null;

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
  }, [generation.generatedImage, design.uploadedImages, design.selectedMaterial, design.selectedStyle, formData, layoutAuditResponses, userMoveInDate, completedTasks]);
}
