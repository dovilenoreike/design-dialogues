/**
 * SpacePlanningWarningModal - Warning dialog when user tries to uncheck
 * Space Planning while Interior Finishes is selected
 */

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface SpacePlanningWarningModalProps {
  isOpen: boolean;
  onKeepSpacePlanning: () => void;
  onAcceptRisks: () => void;
}

const SpacePlanningWarningModal = ({
  isOpen,
  onKeepSpacePlanning,
  onAcceptRisks,
}: SpacePlanningWarningModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onKeepSpacePlanning()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">
            Keep the Plan Optimized?
          </DialogTitle>
        </DialogHeader>

        <DialogDescription asChild>
          <div className="text-text-secondary text-sm space-y-4">
            <p>
              You have selected Interior Finishes, but removed Space Planning.
            </p>
            <p>
              <strong className="text-foreground">The Risk:</strong> Most developer "Gray Box" electrical plans are generic.
              Skipping this step means we assume your current sockets match your new furniture layout perfectly.
            </p>
            <div>
              <p className="mb-2">
                <strong className="text-foreground">Common issues we fix:</strong>
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Sockets hidden behind the new sofa.</li>
                <li>Light switches on the wrong side of the door.</li>
                <li>No power for robot vacuums or islands.</li>
              </ul>
            </div>
          </div>
        </DialogDescription>

        <div className="flex flex-col gap-2 mt-4">
          <button
            onClick={onKeepSpacePlanning}
            className="w-full py-3 bg-foreground text-background rounded-full font-medium text-sm hover:opacity-90 active:scale-[0.98] transition-all"
          >
            Keep Space Planning
          </button>
          <button
            onClick={onAcceptRisks}
            className="w-full py-3 text-text-secondary hover:text-foreground transition-colors text-sm"
          >
            I accept the risks
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SpacePlanningWarningModal;
