import { useState, useMemo } from "react";
import TierSelector from "./TierSelector";
import DesignerInsight from "./DesignerInsight";
import MaterialCard from "./MaterialCard";
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

const baseRates = {
  Budget: 350,
  Standard: 550,
  Premium: 900,
};

const materialData = {
  Budget: [
    { swatchColors: ["bg-amber-100", "bg-amber-200", "bg-amber-50", "bg-amber-300"], title: "Laminate Flooring", category: "Oak Effect • 8mm" },
    { swatchColors: ["bg-stone-100", "bg-stone-200", "bg-stone-50", "bg-stone-300"], title: "Melamine Fronts", category: "White Gloss" },
    { swatchColors: ["bg-zinc-200", "bg-zinc-300", "bg-zinc-100", "bg-zinc-400"], title: "Standard Spots", category: "LED Downlights" },
    { swatchColors: ["bg-gray-100", "bg-gray-200", "bg-gray-50", "bg-gray-300"], title: "Vinyl Wallcovering", category: "Textured White" },
  ],
  Standard: [
    { swatchColors: ["bg-amber-200", "bg-amber-300", "bg-amber-100", "bg-amber-400"], title: "Vinyl Click Flooring", category: "Oak Texture • Waterproof" },
    { swatchColors: ["bg-stone-200", "bg-stone-300", "bg-stone-100", "bg-stone-400"], title: "Painted MDF", category: "Matte Finish" },
    { swatchColors: ["bg-zinc-300", "bg-zinc-400", "bg-zinc-200", "bg-zinc-500"], title: "Track System", category: "Magnetic • Dimmable" },
    { swatchColors: ["bg-neutral-200", "bg-neutral-300", "bg-neutral-100", "bg-neutral-400"], title: "Textured Panels", category: "3D Wall Tiles" },
  ],
  Premium: [
    { swatchColors: ["bg-amber-300", "bg-amber-400", "bg-amber-200", "bg-amber-500"], title: "Engineered Oak", category: "Herringbone • 15mm" },
    { swatchColors: ["bg-amber-100", "bg-amber-200", "bg-stone-100", "bg-stone-200"], title: "Natural Veneer", category: "Walnut Finish" },
    { swatchColors: ["bg-slate-300", "bg-slate-400", "bg-slate-200", "bg-slate-500"], title: "DALI System", category: "Smart Lighting" },
    { swatchColors: ["bg-stone-300", "bg-stone-400", "bg-stone-200", "bg-stone-500"], title: "Artisan Plaster", category: "Venetian Finish" },
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
    if (!formData) return { total: 0, pillars: [], renovationCost: 0 };

    const baseRate = baseRates[selectedTier];
    const scopeMultiplier = scopeMultipliers[formData.projectScope];
    const baseCost = Math.round(formData.area * baseRate * scopeMultiplier);
    const renovationCost = formData.isRenovation ? Math.round(formData.area * 150) : 0;
    const total = baseCost + renovationCost;

    // Split baseCost into 3 pillars
    const pillars = [
      { label: "Construction & Finish", value: Math.round(baseCost * 0.40), percent: "40%" },
      { label: "Kitchen & Joinery", value: Math.round(baseCost * 0.35), percent: "35%" },
      { label: "Technics & Lighting", value: Math.round(baseCost * 0.25), percent: "25%" },
    ];

    return { total, pillars, renovationCost };
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

            {/* Right - Project Passport */}
            <div className="slide-up" style={{ animationDelay: "0.1s" }}>
              <div className="lg:sticky lg:top-24">
                <h2 className="text-2xl md:text-3xl font-serif mb-1 md:mb-2">Project Passport</h2>
                <p className="text-sm md:text-base text-muted-foreground mb-5 md:mb-8">
                  Estimated investment for {formData.area}m²
                </p>

                {/* Unified Card Container */}
                <div className="border border-stone-200 rounded-2xl overflow-hidden">
                  {/* Top Half - Financials (White) */}
                  <div className="bg-white p-5 md:p-6">
                    {/* Tier Selector */}
                    <TierSelector 
                      selectedTier={selectedTier} 
                      onSelectTier={setSelectedTier} 
                    />

                    {/* Total Price */}
                    <div className="mt-6 mb-6">
                      <p className="text-xs text-muted-foreground mb-1">Estimated Total</p>
                      <p className="text-4xl md:text-5xl font-serif tabular-nums">
                        €{calculation.total.toLocaleString()}
                      </p>
                    </div>

                    {/* 3 Pillars Breakdown */}
                    <div className="space-y-3">
                      {calculation.pillars.map((pillar, index) => (
                        <div key={index} className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">{pillar.label}</span>
                          <span className="font-medium tabular-nums">€{pillar.value.toLocaleString()}</span>
                        </div>
                      ))}
                      {calculation.renovationCost > 0 && (
                        <div className="flex justify-between items-center text-sm pt-2 border-t border-dashed border-stone-200">
                          <span className="text-muted-foreground">Renovation Prep</span>
                          <span className="font-medium tabular-nums">€{calculation.renovationCost.toLocaleString()}</span>
                        </div>
                      )}
                    </div>

                    {/* Designer Insight */}
                    <div className="mt-6">
                      <DesignerInsight tier={selectedTier} />
                    </div>
                  </div>

                  {/* Dashed Divider */}
                  <div className="border-t border-dashed border-stone-300" />

                  {/* Bottom Half - Material Manifest (Stone) */}
                  <div className="bg-stone-50 p-5 md:p-6">
                    {/* Header */}
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-foreground">Material Palette</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">Curated by Sigita Kulikajeva</p>
                    </div>

                    {/* Material Cards Grid */}
                    <div className="space-y-2">
                      {materialData[selectedTier].map((material, index) => (
                        <MaterialCard
                          key={index}
                          swatchColors={material.swatchColors}
                          title={material.title}
                          category={material.category}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* CTA Button */}
                <button className="w-full mt-6 py-3.5 md:py-4 bg-foreground text-background rounded-full font-medium text-sm flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all">
                  Download Project Passport (PDF)
                  <Download size={16} className="md:w-[18px] md:h-[18px]" />
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
