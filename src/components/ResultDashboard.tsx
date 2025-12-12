import { useState, useMemo } from "react";
import TierSelector from "./TierSelector";
import { ArrowRight, Download, Share2 } from "lucide-react";

interface ResultDashboardProps {
  isVisible: boolean;
  formData: {
    area: number;
    isRenovation: boolean;
    hasKitchen: boolean;
  } | null;
  uploadedImage: string | null;
  selectedMaterial: string | null;
  selectedStyle: string | null;
}

const baseRates = {
  Budget: 350,
  Standard: 550,
  Premium: 900,
};

const kitchenCosts = {
  Budget: 4000,
  Standard: 7000,
  Premium: 12000,
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
  selectedStyle 
}: ResultDashboardProps) => {
  const [selectedTier, setSelectedTier] = useState<"Budget" | "Standard" | "Premium">("Standard");

  const calculation = useMemo(() => {
    if (!formData) return { total: 0, breakdown: [] };

    const baseRate = baseRates[selectedTier];
    const baseCost = formData.area * baseRate;
    const renovationCost = formData.isRenovation ? formData.area * 150 : 0;
    const kitchenCost = formData.hasKitchen ? kitchenCosts[selectedTier] : 0;
    const total = baseCost + renovationCost + kitchenCost;

    const breakdown = [
      { label: "Base Design", value: baseCost },
      ...(formData.isRenovation ? [{ label: "Renovation Prep", value: renovationCost }] : []),
      ...(formData.hasKitchen ? [{ label: "Kitchen Fit-out", value: kitchenCost }] : []),
    ];

    return { total, breakdown };
  }, [formData, selectedTier]);

  if (!isVisible || !formData) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background fade-in overflow-auto">
      <div className="min-h-screen">
        {/* Header */}
        <div className="glass-panel sticky top-0 z-10">
          <div className="container mx-auto px-6 py-4 flex items-center justify-between">
            <h1 className="text-xl font-serif">Design Dialogues</h1>
            <div className="flex items-center gap-3">
              <button className="p-2 rounded-full hover:bg-secondary transition-colors">
                <Share2 size={18} />
              </button>
              <button className="p-2 rounded-full hover:bg-secondary transition-colors">
                <Download size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-6 py-12">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Left - Image */}
            <div className="slide-up">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-secondary">
                {uploadedImage ? (
                  <img 
                    src={uploadedImage} 
                    alt="Your space" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <p className="text-muted-foreground">AI Rendered Design</p>
                  </div>
                )}
              </div>
              <div className="mt-4 flex gap-2">
                <span className="px-3 py-1.5 bg-secondary rounded-full text-xs font-medium">
                  {selectedMaterial}
                </span>
                <span className="px-3 py-1.5 bg-secondary rounded-full text-xs font-medium">
                  {selectedStyle}
                </span>
              </div>
            </div>

            {/* Right - Calculator */}
            <div className="slide-up" style={{ animationDelay: "0.1s" }}>
              <div className="sticky top-24">
                <h2 className="text-3xl font-serif mb-2">Project Passport</h2>
                <p className="text-muted-foreground mb-8">
                  Estimated investment for {formData.area}m²
                </p>

                {/* Tier Selector */}
                <TierSelector 
                  selectedTier={selectedTier} 
                  onSelectTier={setSelectedTier} 
                />

                {/* Price */}
                <div className="mt-8 mb-6">
                  <p className="text-sm text-muted-foreground mb-1">Estimated Total</p>
                  <p className="text-5xl font-serif">
                    €{calculation.total.toLocaleString()}
                  </p>
                </div>

                {/* Breakdown */}
                <div className="space-y-3 mb-8">
                  {calculation.breakdown.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{item.label}</span>
                      <span className="font-medium">€{item.value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>

                {/* Material List */}
                <div className="border-t border-border pt-6 mb-8">
                  <h4 className="text-sm font-medium mb-4">Material Recipe</h4>
                  <div className="space-y-2">
                    {materialLists[selectedTier].map((material, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-foreground" />
                        <span className="text-muted-foreground">{material}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CTA */}
                <button className="w-full py-4 bg-foreground text-background rounded-full font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
                  Schedule Consultation
                  <ArrowRight size={18} />
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
