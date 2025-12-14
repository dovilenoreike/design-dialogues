import { ExternalLink } from "lucide-react";

interface MaterialCardProps {
  swatchColors: string[];
  title: string;
  category: string;
}

const MaterialCard = ({ swatchColors, title, category }: MaterialCardProps) => {
  return (
    <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-border hover:border-foreground/20 transition-colors cursor-pointer group">
      {/* Swatch */}
      <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 grid grid-cols-2 grid-rows-2">
        {swatchColors.map((color, index) => (
          <div key={index} className={`${color}`} />
        ))}
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{title}</p>
        <p className="text-xs text-muted-foreground truncate">{category}</p>
      </div>
      
      {/* Link Icon */}
      <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <ExternalLink size={14} className="text-muted-foreground" />
      </div>
    </div>
  );
};

export default MaterialCard;
