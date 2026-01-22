import { User, ChevronRight } from "lucide-react";
import { getDesignerWithFallback } from "@/data/designers";

interface DesignerCompactCardProps {
  designerName: string;
  designerTitle: string;
  onOpenProfile: () => void;
}

export default function DesignerCompactCard({
  designerName,
  designerTitle,
  onOpenProfile,
}: DesignerCompactCardProps) {
  const profile = getDesignerWithFallback(designerName, designerTitle);

  return (
    <button
      onClick={onOpenProfile}
      className="w-full bg-background border border-border rounded-xl p-4 mt-6 text-left transition-colors hover:bg-muted/50 active:scale-[0.99]"
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="w-12 h-12 rounded-full bg-surface-muted flex items-center justify-center flex-shrink-0">
          <User size={20} className="text-muted-foreground" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h4 className="font-medium text-foreground">{profile.name}</h4>
              <p className="text-xs text-muted-foreground">{profile.title}</p>
            </div>
            <ChevronRight size={20} className="text-muted-foreground flex-shrink-0" />
          </div>
          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
            {profile.bio}
          </p>
        </div>
      </div>
    </button>
  );
}
