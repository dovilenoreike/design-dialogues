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
      className={`flex-1 flex flex-col p-3 rounded-xl border transition-all duration-200 touch-manipulation active:scale-[0.98] text-left relative ${
        isSelected
          ? 'bg-stone-50 border-stone-300 border-l-2 border-l-stone-800'
          : 'bg-white border-stone-200 hover:border-stone-300'
      }`}
    >
      <div className={`absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center ${
        isSelected ? 'bg-stone-800' : 'border border-stone-300'
      }`}>
        {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
      </div>
      <span className="text-sm font-semibold text-foreground pr-5">
        {title}
      </span>
      <span className={`text-xs mt-1 leading-tight ${isSelected ? 'text-stone-600' : 'text-stone-400'}`}>
        {description}
      </span>
    </button>
  );
};

export default ServiceCard;
