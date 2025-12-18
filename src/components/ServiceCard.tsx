import { Check, Circle } from 'lucide-react';

interface ServiceCardProps {
  title: string;
  description: string;
  isSelected: boolean;
  onToggle: () => void;
}

const ServiceCard = ({ title, description, isSelected, onToggle }: ServiceCardProps) => {
  return (
    <button
      onClick={onToggle}
      className={`flex-1 flex flex-col p-3 rounded-xl border border-ds-border-default bg-surface-primary transition-all duration-200 touch-manipulation active:scale-[0.98] text-left hover:shadow-sm ${
        isSelected ? 'opacity-100' : 'opacity-50 hover:opacity-70'
      }`}
    >
      <div className="flex items-center gap-2">
        <span className="text-lg font-serif text-foreground flex-1 leading-tight">
          {title}
        </span>
        {isSelected ? (
          <div className="w-5 h-5 rounded-full bg-foreground flex items-center justify-center flex-shrink-0">
            <Check className="w-3 h-3 text-background" />
          </div>
        ) : (
          <Circle className="w-5 h-5 text-text-muted flex-shrink-0" />
        )}
      </div>
      <span className="text-xs mt-2 leading-tight text-text-secondary">
        {description}
      </span>
    </button>
  );
};

export default ServiceCard;
