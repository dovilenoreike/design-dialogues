import { useCallback, useRef } from "react";
import { useDesign, ControlMode } from "@/contexts/DesignContext";
import { useLanguage } from "@/contexts/LanguageContext";
import Stage from "../Stage";
import ControlCenter from "../ControlCenter";
import { MaterialsSummary } from "../thread/summaries/MaterialsSummary";
import RoomTripletGrid from "../home/RoomTripletGrid";
import HomeBudgetSection from "../home/HomeBudgetSection";
import HomeAuditSection from "../home/HomeAuditSection";
import HomeRoadmapSection from "../home/HomeRoadmapSection";
import { RoomSwitchDialog } from "../dialogs/RoomSwitchDialog";
import { StyleSwitchDialog } from "../dialogs/StyleSwitchDialog";
import { UploadDialog } from "../dialogs/UploadDialog";

export default function DesignView() {
  const {
    design,
    generation,
    activeMode,
    setActiveMode,
    handleSelectCategory,
    confirmRoomSwitch,
    cancelRoomSwitch,
    confirmStyleSwitch,
    cancelStyleSwitch,
    confirmImageUpload,
    cancelImageUpload,
  } = useDesign();
  const { t } = useLanguage();

  const scrollRef = useRef<HTMLDivElement>(null);

  const handleOpenSelector = useCallback((mode: ControlMode) => {
    setActiveMode(mode);
  }, [setActiveMode]);

  const handleRoomSelect = useCallback((roomDisplayName: string) => {
    handleSelectCategory(roomDisplayName);
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [handleSelectCategory]);

  const roomKey = design.selectedCategory || "Kitchen";
  const hasUserImage = !!(design.uploadedImages[roomKey] || generation.generatedImages[roomKey]);

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
      {/* Hero visualisation */}
      <div className="relative" style={{ height: 'calc(100svh - 228px)' }}>
        <Stage onOpenSelector={handleOpenSelector} />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 z-10">
          <div className="flex items-center gap-0.5 px-1 py-1 rounded-full bg-neutral-900 shadow-lg">
            {(["rooms", "styles", "palettes"] as ControlMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setActiveMode(mode)}
                className={`px-3.5 py-1.5 rounded-full text-[10px] tracking-[0.2em] uppercase font-medium transition-all active:scale-95 ${
                  activeMode === mode ? "bg-white/15 text-white" : "text-white/50"
                }`}
              >
                {t(`modes.${mode}`)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Inline control center with carousels */}
      <ControlCenter />

      {/* Materials summary */}
      <div className="px-4 py-5">
        <MaterialsSummary />
      </div>

      {/* Other rooms grid */}
      <RoomTripletGrid onRoomSelect={handleRoomSelect} />

      {/* Divider */}
      <div className="mx-4 border-t border-border" />

      {/* Budget estimate */}
      <HomeBudgetSection />

      {/* Divider */}
      <div className="mx-4 border-t border-border" />

      {/* Layout audit */}
      <HomeAuditSection />

      {/* Divider */}
      <div className="mx-4 border-t border-border" />

      {/* Roadmap */}
      <HomeRoadmapSection />

      {/* Bottom padding for safe area */}
      <div className="h-4" />

      {/* Room switch confirmation dialog */}
      <RoomSwitchDialog
        open={generation.showRoomSwitchDialog}
        currentRoom={design.selectedCategory || ""}
        onSaveAndSwitch={() => confirmRoomSwitch(true)}
        onSwitch={() => confirmRoomSwitch(false)}
        onCancel={cancelRoomSwitch}
      />

      {/* Style switch confirmation dialog */}
      <StyleSwitchDialog
        open={generation.showStyleSwitchDialog}
        currentStyle={design.selectedStyle || ""}
        onSaveAndSwitch={() => confirmStyleSwitch(true)}
        onSwitch={() => confirmStyleSwitch(false)}
        onCancel={cancelStyleSwitch}
      />

      {/* Upload confirmation dialog */}
      <UploadDialog
        open={generation.showUploadDialog}
        onConfirm={confirmImageUpload}
        onCancel={cancelImageUpload}
      />
    </div>
  );
}
