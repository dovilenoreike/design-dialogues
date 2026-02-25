import {
  Drawer,
  DrawerContent,
  DrawerTitle,
} from "@/components/ui/drawer";
import ControlCenter from "../ControlCenter";
import type { ControlMode } from "@/contexts/DesignContext";

interface SelectorBottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialMode?: ControlMode;
}

export default function SelectorBottomSheet({
  open,
  onOpenChange,
}: SelectorBottomSheetProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerTitle className="sr-only">Select</DrawerTitle>
        <div className="h-[160px] pb-4">
          <ControlCenter />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
