import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

interface MaterialMatchRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  generatedImage: string | null;
  freestyleDescription: string;
  selectedTier: "Budget" | "Standard" | "Premium";
}

const MaterialMatchRequestModal = ({
  isOpen,
  onClose,
  generatedImage,
  freestyleDescription,
  selectedTier,
}: MaterialMatchRequestModalProps) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [preferences, setPreferences] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    console.log("Material Match Request:", {
      name,
      email,
      preferences,
      freestyleDescription,
      selectedTier,
      generatedImage: generatedImage ? "included" : "not included",
    });

    await new Promise((resolve) => setTimeout(resolve, 800));

    setIsSubmitting(false);
    onClose();
    
    toast({
      title: "Request Sent",
      description: "Our designers will get back to you with a curated material selection.",
    });

    // Reset form
    setName("");
    setEmail("");
    setPreferences("");
  };

  // Truncate the freestyle description for display
  const truncatedDescription =
    freestyleDescription.length > 80
      ? freestyleDescription.substring(0, 80) + "..."
      : freestyleDescription;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">Request Material Match</DialogTitle>
          <DialogDescription className="text-text-secondary">
            Our designers will find real-world products that match this aesthetic within your selected budget range.
          </DialogDescription>
        </DialogHeader>

        {/* Context Card */}
        <div className="bg-surface-muted rounded-xl p-4 mt-2">
          <div className="flex gap-4">
            {/* Thumbnail */}
            <div className="w-16 h-16 rounded-lg overflow-hidden bg-surface-sunken flex-shrink-0">
              {generatedImage ? (
                <img
                  src={generatedImage}
                  alt="Generated visualization"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-[10px] text-text-muted">No image</span>
                </div>
              )}
            </div>
            {/* Text Stack */}
            <div className="flex-1 min-w-0">
              <p className="text-xs text-text-muted line-clamp-2">"{truncatedDescription}"</p>
              <p className="mt-1.5 text-xs">
                <span className="text-text-muted">Targeting: </span>
                <span className="font-semibold uppercase tracking-wide text-text-primary">
                  {selectedTier}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="preferences">Specific Preferences</Label>
            <Textarea
              id="preferences"
              value={preferences}
              onChange={(e) => setPreferences(e.target.value)}
              placeholder="e.g., I love the wood tone in the image, but I prefer tiles for the kitchen floor..."
              className="resize-none h-24"
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Sending..." : "Send Sourcing Request"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default MaterialMatchRequestModal;
