import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

interface UploadDialogProps {
  open: boolean;
  onConfirm: (clearFirst: boolean) => void;
  onCancel: () => void;
}

export function UploadDialog({ open, onConfirm, onCancel }: UploadDialogProps) {
  const { t } = useLanguage();

  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("mobile.uploadDialog.title")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("mobile.uploadDialog.description")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={onCancel}>
            {t("mobile.uploadDialog.cancel")}
          </Button>
          <Button onClick={() => onConfirm(true)}>
            {t("mobile.uploadDialog.clearAndUpload")}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
