import { Check } from 'lucide-react';

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
      className={`flex-1 flex flex-col p-3 rounded-xl transition-all duration-200 touch-manipulation active:scale-[0.98] text-left ${
        isSelected
          ? 'bg-surface-muted border-2 border-ds-border-emphasis'
          : 'bg-surface-primary border border-ds-border-default hover:border-ds-border-strong opacity-60 hover:opacity-80'
      }`}
    >
      <div className="flex items-center gap-2">
        <span className="text-lg font-serif text-foreground flex-1">
          {title}
        </span>
        <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
          isSelected ? 'bg-interactive' : 'border border-ds-border-strong'
        }`}>
          {isSelected && <Check className="w-3 h-3 text-background" />}
        </div>
      </div>
      <span className={`text-xs mt-1.5 leading-tight ${isSelected ? 'text-text-secondary' : 'text-text-muted'}`}>
        {description}
      </span>
    </button>
  );
};

export default ServiceCard;
