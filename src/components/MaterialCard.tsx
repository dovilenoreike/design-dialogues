import { ChevronRight } from "lucide-react";

interface MaterialCardProps {
  image?: string;
  swatchColors?: string[];
  title: string;
  category: string;
  materialType?: string;
  technicalCode?: string;
  onClick?: () => void;
}

const MaterialCard = ({ image, swatchColors, title, category, materialType, technicalCode, onClick }: MaterialCardProps) => {
  return (
    <div
      className="flex items-center gap-4 py-4 px-4 md:px-5 cursor-pointer group hover:bg-surface-sunken/50 transition-colors"
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === "Enter" && onClick() : undefined}
    >
      {/* Swatch - Image or Color Grid */}
      <div className="w-14 h-14 md:w-16 md:h-16 rounded-lg overflow-hidden flex-shrink-0">
        {image ? (
          <img src={image} alt={title} className="w-full h-full object-cover" />
        ) : swatchColors ? (
          <div className="w-full h-full grid grid-cols-2 grid-rows-2">
            {swatchColors.map((color, index) => (
              <div key={index} className={`${color}`} />
            ))}
          </div>
        ) : (
          <div className="w-full h-full bg-surface-muted" />
        )}
      </div>
      
      {/* Text Stack */}
      <div className="flex-1 min-w-0 space-y-0.5">
        {/* Category Label - Caption style */}
        <p className="text-[10px] uppercase tracking-widest text-text-muted font-medium">
          {category}
        </p>
        {/* Material Name - Heading/Serif font */}
        <p className="text-base font-serif text-text-primary truncate">
          {title}
        </p>
        {/* Material Type + Technical Code Badge */}
        {(materialType || technicalCode) && (
          <div className="flex items-center gap-1.5">
            {materialType && (
              <span className="text-xs text-muted-foreground">{materialType}</span>
            )}
            {technicalCode && (
              <span className="bg-muted rounded-md px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground max-w-[150px] truncate">
                {technicalCode}
              </span>
            )}
          </div>
        )}
      </div>
      
      {/* Chevron Icon */}
      <div className="flex-shrink-0">
        <ChevronRight
          size={16}
          className="text-text-subtle group-hover:text-text-primary transition-colors"
        />
      </div>
    </div>
  );
};

export default MaterialCard;
