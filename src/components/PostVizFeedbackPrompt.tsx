import { useState, useEffect, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useDesign } from "@/contexts/DesignContext";
import FeedbackDialog from "./FeedbackDialog";

export default function PostVizFeedbackPrompt() {
  const { t } = useLanguage();
  const { generation, design } = useDesign();
  const { isGenerating, generatedImages } = generation;
  const { selectedCategory } = design;

  const [shown, setShown] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const prevIsGenerating = useRef(false);

  const generatedImage = generatedImages[selectedCategory || "Kitchen"];

  // Show fresh after every completed generation (isGenerating true → false with a result)
  useEffect(() => {
    if (prevIsGenerating.current && !isGenerating && generatedImage) {
      setShown(true);
      setDismissed(false);
    }
    prevIsGenerating.current = isGenerating;
  }, [isGenerating, generatedImage]);

  const handlePositive = () => setDismissed(true);

  const handleNegativeOrShare = () => {
    setDismissed(true);
    setFeedbackOpen(true);
  };

  if ((!shown || dismissed) && !feedbackOpen) return null;

  return (
    <>
      <div className="flex items-center gap-2 px-1 pt-2 pb-1">
        <span className="flex-1 text-xs text-muted-foreground leading-snug">
          {t("earlyAccess.postVizQuestion")}
        </span>
        <button
          onClick={handlePositive}
          className="text-sm px-2 py-1 rounded-full hover:bg-muted transition-colors leading-none"
          aria-label="Yes"
        >
          👍
        </button>
        <button
          onClick={handleNegativeOrShare}
          className="text-sm px-2 py-1 rounded-full hover:bg-muted transition-colors leading-none"
          aria-label="No"
        >
          👎
        </button>
        <button
          onClick={handleNegativeOrShare}
          className="text-xs text-muted-foreground hover:text-foreground px-2.5 py-1 border border-border rounded-full transition-colors whitespace-nowrap"
        >
          {t("earlyAccess.postVizShare")}
        </button>
      </div>
      <FeedbackDialog open={feedbackOpen} onOpenChange={setFeedbackOpen} />
    </>
  );
}
