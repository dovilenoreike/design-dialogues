import { useState, useMemo } from "react";
import TierSelector from "./TierSelector";
import { ArrowRight, Download, Share2, X } from "lucide-react";

type ProjectScope = 'space-planning' | 'interior-finishes' | 'full-interior';

interface ResultDashboardProps {
  isVisible: boolean;
  formData: {
    area: number;
    isRenovation: boolean;
    projectScope: ProjectScope;
  } | null;
  uploadedImage: string | null;
  selectedMaterial: string | null;
  selectedStyle: string | null;
  onClose?: () => void;
}

const scopeMultipliers: Record<ProjectScope, number> = {
  'space-planning': 0.3,
  'interior-finishes': 0.6,
  'full-interior': 1.0,
};

const scopeLabels: Record<ProjectScope, string> = {
  'space-planning': 'Space Planning',
  'interior-finishes': 'Interior Finishes',
  'full-interior': 'Full Interior',
};

const baseRates = {
  Budget: 350,
  Standard: 550,
  Premium: 900,
};


const materialLists = {
  Budget: [
    "Laminate Flooring",
    "Melamine Fronts",
    "Standard Spots",
    "Vinyl Wallcovering",
  ],
  Standard: [
    "Vinyl Click Flooring",
    "Matte Painted MDF",
    "Magnetic Track Lighting",
    "Textured Wall Panels",
  ],
  Premium: [
    "Engineered Oak Flooring",
    "Natural Wood Veneer",
    "DALI Lighting System",
    "Artisan Plaster Walls",
  ],
};

const ResultDashboard = ({ 
  isVisible, 
  formData, 
  uploadedImage,
  selectedMaterial,
  selectedStyle,
  onClose
}: ResultDashboardProps) => {
  const [selectedTier, setSelectedTier] = useState<"Budget" | "Standard" | "Premium">("Standard");

  const calculation = useMemo(() => {
    if (!formData) return { total: 0, breakdown: [] };

    const baseRate = baseRates[selectedTier];
    const scopeMultiplier = scopeMultipliers[formData.projectScope];
    const baseCost = Math.round(formData.area * baseRate * scopeMultiplier);
    const renovationCost = formData.isRenovation ? formData.area * 150 : 0;
    const total = baseCost + renovationCost;

    const breakdown = [
      { label: `${scopeLabels[formData.projectScope]}`, value: baseCost },
      ...(formData.isRenovation ? [{ label: "Renovation Prep", value: renovationCost }] : []),
    ];

    return { total, breakdown };
  }, [formData, selectedTier]);

  if (!isVisible || !formData) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background fade-in overflow-auto">
      <div className="min-h-screen pb-safe">
        {/* Header */}
        <div className="glass-panel sticky top-0 z-10">
          <div className="container mx-auto px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
            <h1 className="text-lg md:text-xl font-serif">Design Dialogues</h1>
            <div className="flex items-center gap-1 md:gap-3">
              <button className="p-2 rounded-full hover:bg-secondary transition-colors">
                <Share2 size={16} className="md:w-[18px] md:h-[18px]" />
              </button>
              <button className="p-2 rounded-full hover:bg-secondary transition-colors">
                <Download size={16} className="md:w-[18px] md:h-[18px]" />
              </button>
              {onClose && (
                <button 
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-secondary transition-colors ml-1"
                >
                  <X size={16} className="md:w-[18px] md:h-[18px]" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 md:px-6 py-6 md:py-12">
          <div className="grid lg:grid-cols-2 gap-6 md:gap-12">
            {/* Left - Image */}
            <div className="slide-up">
              <div className="aspect-[4/3] rounded-xl md:rounded-2xl overflow-hidden bg-secondary">
                {uploadedImage ? (
                  <img 
                    src={uploadedImage} 
                    alt="Your space" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <p className="text-sm text-muted-foreground">AI Rendered Design</p>
                  </div>
                )}
              </div>
              <div className="mt-3 md:mt-4 flex gap-2 flex-wrap">
                {selectedMaterial && (
                  <span className="px-2.5 md:px-3 py-1 md:py-1.5 bg-secondary rounded-full text-[10px] md:text-xs font-medium">
                    {selectedMaterial}
                  </span>
                )}
                {selectedStyle && (
                  <span className="px-2.5 md:px-3 py-1 md:py-1.5 bg-secondary rounded-full text-[10px] md:text-xs font-medium">
                    {selectedStyle}
                  </span>
                )}
              </div>
            </div>

            {/* Right - Calculator */}
            <div className="slide-up" style={{ animationDelay: "0.1s" }}>
              <div className="lg:sticky lg:top-24">
                <h2 className="text-2xl md:text-3xl font-serif mb-1 md:mb-2">Project Passport</h2>
                <p className="text-sm md:text-base text-muted-foreground mb-5 md:mb-8">
                  Estimated investment for {formData.area}m²
                </p>

                {/* Tier Selector */}
                <TierSelector 
                  selectedTier={selectedTier} 
                  onSelectTier={setSelectedTier} 
                />

                {/* Price */}
                <div className="mt-6 md:mt-8 mb-4 md:mb-6">
                  <p className="text-xs md:text-sm text-muted-foreground mb-1">Estimated Total</p>
                  <p className="text-4xl md:text-5xl font-serif tabular-nums">
                    €{calculation.total.toLocaleString()}
                  </p>
                </div>

                {/* Breakdown */}
                <div className="space-y-2 md:space-y-3 mb-6 md:mb-8">
                  {calculation.breakdown.map((item, index) => (
                    <div key={index} className="flex justify-between text-xs md:text-sm">
                      <span className="text-muted-foreground">{item.label}</span>
                      <span className="font-medium tabular-nums">€{item.value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>

                {/* Material List */}
                <div className="border-t border-border pt-5 md:pt-6 mb-6 md:mb-8">
                  <h4 className="text-xs md:text-sm font-medium mb-3 md:mb-4">Material Recipe</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-1 gap-1.5 md:gap-2">
                    {materialLists[selectedTier].map((material, index) => (
                      <div key={index} className="flex items-center gap-2 text-xs md:text-sm">
                        <div className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-foreground flex-shrink-0" />
                        <span className="text-muted-foreground">{material}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CTA */}
                <button className="w-full py-3.5 md:py-4 bg-foreground text-background rounded-full font-medium text-sm flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all">
                  Schedule Consultation
                  <ArrowRight size={16} className="md:w-[18px] md:h-[18px]" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultDashboard;
