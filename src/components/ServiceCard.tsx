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
      className={`flex-1 flex flex-col p-4 rounded-xl border transition-all duration-200 touch-manipulation active:scale-[0.98] text-left ${
        isSelected
          ? 'bg-stone-900 border-stone-900'
          : 'bg-white border-stone-200 hover:border-stone-300'
      }`}
    >
      <span className={`text-sm font-semibold ${isSelected ? 'text-white' : 'text-foreground'}`}>
        {title}
      </span>
      <span className={`text-xs mt-1 leading-tight ${isSelected ? 'text-stone-400' : 'text-stone-500'}`}>
        {description}
      </span>
    </button>
  );
};

export default ServiceCard;
