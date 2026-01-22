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

interface StyleSwitchDialogProps {
  open: boolean;
  currentStyle: string;
  onSaveAndSwitch: () => void;
  onSwitch: () => void;
  onCancel: () => void;
}

export function StyleSwitchDialog({
  open,
  currentStyle,
  onSaveAndSwitch,
  onSwitch,
  onCancel,
}: StyleSwitchDialogProps) {
  const { t } = useLanguage();

  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("mobile.switchDialog.saveTitle")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("mobile.switchDialog.styleSwitchWarning").replace("{style}", currentStyle || "custom")}
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
