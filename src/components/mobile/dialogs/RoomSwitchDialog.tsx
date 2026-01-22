import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface RoomSwitchDialogProps {
  open: boolean;
  currentRoom: string;
  onSaveAndSwitch: () => void;
  onSwitch: () => void;
  onCancel: () => void;
}

export function RoomSwitchDialog({
  open,
  currentRoom,
  onSaveAndSwitch,
  onSwitch,
  onCancel,
}: RoomSwitchDialogProps) {
  const { t } = useLanguage();

  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("mobile.switchDialog.saveTitle")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("mobile.switchDialog.roomSwitchWarning").replace("{room}", currentRoom)}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={onCancel}>
            {t("mobile.switchDialog.cancel")}
          </Button>
          <Button variant="ghost" onClick={onSwitch}>
            {t("mobile.switchDialog.switch")}
          </Button>
          <Button onClick={onSaveAndSwitch}>
            <Download className="w-4 h-4 mr-2" />
            {t("mobile.switchDialog.saveAndSwitch")}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
