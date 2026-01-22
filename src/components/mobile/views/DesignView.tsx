import { useDesign } from "@/contexts/DesignContext";
import Stage from "../Stage";
import ControlCenter from "../ControlCenter";
import { RoomSwitchDialog } from "../dialogs/RoomSwitchDialog";
import { StyleSwitchDialog } from "../dialogs/StyleSwitchDialog";

export default function DesignView() {
  const { design, generation, confirmRoomSwitch, cancelRoomSwitch, confirmStyleSwitch, cancelStyleSwitch } = useDesign();

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Zone B: Stage - fills most of the space */}
      <div className="flex-1 relative overflow-hidden">
        <Stage />
      </div>

      {/* Zone C: Filmstrip - thin fixed height control area */}
      <div className="flex-shrink-0 h-[120px] border-t border-border bg-background">
        <ControlCenter />
      </div>

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
    </div>
  );
}
