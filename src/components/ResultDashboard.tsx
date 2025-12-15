import { useState, useMemo } from "react";
import TierSelector from "./TierSelector";
import DesignerInsight from "./DesignerInsight";
import MaterialCard from "./MaterialCard";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { TooltipProvider } from "@/components/ui/tooltip";
import { HybridTooltip } from "@/components/ui/hybrid-tooltip";
import { ChevronDown, Download, Share2, X, Info, RefreshCw, Palette, RotateCcw } from "lucide-react";
import {
  FormData,
  ProjectScope,
  scopeMultipliers,
  scopeOptions,
  baseRates,
  designRates,
  kitchenRates,
  appliancePackages,
  wardrobeRates,
  renovationRate,
  furniturePercentage,
  priceVariance,
  roundToHundred,
} from "@/types/calculator";

interface ResultDashboardProps {
  isVisible: boolean;
  formData: FormData | null;
  uploadedImage: string | null;
  selectedMaterial: string | null;
  selectedStyle: string | null;
  onClose?: () => void;
  onFormDataChange?: (formData: FormData) => void;
  onRegenerateVisualization?: () => void;
  onChangeStyle?: () => void;
  onStartFresh?: () => void;
}

// Material data mapped to each palette
const paletteMaterials: Record<string, { swatchColors: string[]; title: string; category: string }[]> = {
  "Milan Grey": [
    { swatchColors: ["bg-slate-300", "bg-slate-400", "bg-slate-200", "bg-slate-500"], title: "Polished Concrete", category: "Micro-cement Finish" },
    { swatchColors: ["bg-zinc-400", "bg-zinc-500", "bg-zinc-300", "bg-zinc-600"], title: "Brushed Steel", category: "Cabinet Handles" },
    { swatchColors: ["bg-gray-200", "bg-gray-300", "bg-gray-100", "bg-gray-400"], title: "Limestone Tile", category: "Honed 600x600" },
    { swatchColors: ["bg-slate-200", "bg-slate-300", "bg-slate-100", "bg-slate-400"], title: "Smoked Glass", category: "Partition Panels" },
  ],
  "Natural Walnut": [
    { swatchColors: ["bg-amber-600", "bg-amber-700", "bg-amber-500", "bg-amber-800"], title: "Engineered Walnut", category: "Herringbone • 15mm" },
    { swatchColors: ["bg-yellow-700", "bg-yellow-800", "bg-yellow-600", "bg-amber-700"], title: "Walnut Veneer", category: "Joinery Fronts" },
    { swatchColors: ["bg-amber-200", "bg-amber-300", "bg-amber-100", "bg-amber-400"], title: "Brass Fixtures", category: "Burnished Finish" },
    { swatchColors: ["bg-stone-200", "bg-stone-300", "bg-stone-100", "bg-stone-400"], title: "Linen Fabric", category: "Acoustic Panels" },
  ],
  "Onyx & Brass": [
    { swatchColors: ["bg-zinc-900", "bg-zinc-800", "bg-zinc-950", "bg-zinc-700"], title: "Black Marble", category: "Nero Marquina • Polished" },
    { swatchColors: ["bg-yellow-600", "bg-yellow-500", "bg-amber-500", "bg-yellow-700"], title: "Brushed Brass", category: "Hardware & Fixtures" },
    { swatchColors: ["bg-zinc-800", "bg-zinc-700", "bg-zinc-900", "bg-zinc-600"], title: "Smoked Oak", category: "Flooring • Matte" },
    { swatchColors: ["bg-zinc-700", "bg-zinc-600", "bg-zinc-800", "bg-zinc-500"], title: "Black Steel", category: "Frame Details" },
  ],
  "Calacatta White": [
    { swatchColors: ["bg-stone-100", "bg-stone-200", "bg-stone-50", "bg-gray-100"], title: "Calacatta Quartz", category: "Worktops • 30mm" },
    { swatchColors: ["bg-white", "bg-gray-50", "bg-stone-50", "bg-gray-100"], title: "White Oak", category: "Flooring • Wide Plank" },
    { swatchColors: ["bg-stone-200", "bg-stone-300", "bg-stone-100", "bg-stone-400"], title: "Matte Lacquer", category: "Cabinet Finish" },
    { swatchColors: ["bg-gray-100", "bg-gray-200", "bg-gray-50", "bg-stone-100"], title: "Textured Plaster", category: "Wall Finish" },
  ],
};

// Fallback materials if no palette selected
const defaultMaterials = [
  { swatchColors: ["bg-stone-200", "bg-stone-300", "bg-stone-100", "bg-stone-400"], title: "Engineered Wood", category: "Oak Finish" },
  { swatchColors: ["bg-gray-200", "bg-gray-300", "bg-gray-100", "bg-gray-400"], title: "Painted MDF", category: "Matte White" },
  { swatchColors: ["bg-zinc-300", "bg-zinc-400", "bg-zinc-200", "bg-zinc-500"], title: "LED System", category: "Dimmable Track" },
  { swatchColors: ["bg-neutral-200", "bg-neutral-300", "bg-neutral-100", "bg-neutral-400"], title: "Wall Panels", category: "Textured Finish" },
];

const ResultDashboard = ({ 
  isVisible, 
  formData, 
  uploadedImage,
  selectedMaterial,
  selectedStyle,
  onClose,
  onFormDataChange,
  onRegenerateVisualization,
  onChangeStyle,
  onStartFresh
}: ResultDashboardProps) => {
  const [selectedTier, setSelectedTier] = useState<"Budget" | "Standard" | "Premium">("Standard");
  const [isRefineOpen, setIsRefineOpen] = useState(false);

  // Local state for refine inputs
  const [localArea, setLocalArea] = useState(formData?.area ?? 50);
  const [localIsRenovation, setLocalIsRenovation] = useState(formData?.isRenovation ?? false);
  const [localProjectScope, setLocalProjectScope] = useState<ProjectScope>(formData?.projectScope ?? 'full-interior');
  const [localKitchenLength, setLocalKitchenLength] = useState(formData?.kitchenLength ?? 4);
  const [localWardrobeLength, setLocalWardrobeLength] = useState(formData?.wardrobeLength ?? 3);

  // Sync local state when formData changes
  useState(() => {
    if (formData) {
      setLocalArea(formData.area);
      setLocalIsRenovation(formData.isRenovation);
      setLocalProjectScope(formData.projectScope);
      setLocalKitchenLength(formData.kitchenLength);
      setLocalWardrobeLength(formData.wardrobeLength);
    }
  });

  const handleUpdateFormData = (updates: Partial<FormData>) => {
    const newFormData: FormData = {
      area: updates.area ?? localArea,
      isRenovation: updates.isRenovation ?? localIsRenovation,
      projectScope: updates.projectScope ?? localProjectScope,
      kitchenLength: updates.kitchenLength ?? localKitchenLength,
      wardrobeLength: updates.wardrobeLength ?? localWardrobeLength,
    };
    
    if (updates.area !== undefined) setLocalArea(updates.area);
    if (updates.isRenovation !== undefined) setLocalIsRenovation(updates.isRenovation);
    if (updates.projectScope !== undefined) setLocalProjectScope(updates.projectScope);
    if (updates.kitchenLength !== undefined) setLocalKitchenLength(updates.kitchenLength);
    if (updates.wardrobeLength !== undefined) setLocalWardrobeLength(updates.wardrobeLength);
    
    onFormDataChange?.(newFormData);
  };

  const calculation = useMemo(() => {
    const tier = selectedTier;
    const scopeMultiplier = scopeMultipliers[localProjectScope];
    
    // 1. Interior Design Project (based on area, tier, and scope)
    const interiorDesign = roundToHundred(localArea * designRates[tier] * scopeMultiplier);
    
    // 2. Construction & Finish Work (based on area and tier)
    const constructionFinish = roundToHundred(localArea * baseRates[tier] * 0.35 * scopeMultiplier);
    
    // 3. Built-in Products & Finish Materials (based on area and tier)
    const builtInProducts = roundToHundred(localArea * baseRates[tier] * 0.25 * scopeMultiplier);
    
    // 4. Kitchen & Joinery (based on linear meters)
    const kitchenJoinery = roundToHundred(localKitchenLength * kitchenRates[tier] * scopeMultiplier);
    
    // 5. Home Appliances (tier-based fixed package, scaled by scope)
    const appliances = roundToHundred(appliancePackages[tier] * scopeMultiplier);
    
    // 6. Built-in Wardrobes (based on linear meters)
    const wardrobes = roundToHundred(localWardrobeLength * wardrobeRates[tier] * scopeMultiplier);
    
    // 7. Renovation Prep (if applicable)
    const renovationCost = localIsRenovation ? roundToHundred(localArea * renovationRate) : 0;
    
    // Subtotal before furniture
    const subtotal = interiorDesign + constructionFinish + builtInProducts + kitchenJoinery + appliances + wardrobes + renovationCost;
    
    // 8. Furniture (~20% of subtotal)
    const furniture = roundToHundred(subtotal * furniturePercentage);
    
    // Total
    const total = subtotal + furniture;
    
    // Calculate ±15% range for total (also rounded)
    const lowEstimate = roundToHundred(total * (1 - priceVariance));
    const highEstimate = roundToHundred(total * (1 + priceVariance));

    // Line items (rounded estimates) with tooltip descriptions
    const lineItems = [
      { label: "Interior Design Project", value: interiorDesign, tooltip: "Design concept, floor plans, 3D visualizations, material selection, and project coordination" },
      { label: "Construction & Finish", value: constructionFinish, tooltip: "Demolition, walls, flooring installation, painting, plastering, and general construction work" },
      { label: "Built-in Products & Materials", value: builtInProducts, tooltip: "Flooring materials, tiles, paint, fixtures, switches, sockets, and finish materials" },
      { label: "Kitchen & Joinery", value: kitchenJoinery, tooltip: "Custom kitchen cabinets, worktops, sinks, taps, and bespoke joinery elements" },
      { label: "Home Appliances", value: appliances, tooltip: "Oven, hob, extractor, fridge, dishwasher, washing machine, and other appliances" },
      { label: "Built-in Wardrobes", value: wardrobes, tooltip: "Custom wardrobe systems with internal fittings, doors, and installation" },
      { label: "Furniture (est.)", value: furniture, tooltip: "Sofas, beds, dining tables, chairs, and other movable furniture pieces" },
    ];

    return { total, lowEstimate, highEstimate, lineItems, renovationCost };
  }, [localArea, localIsRenovation, localProjectScope, localKitchenLength, localWardrobeLength, selectedTier]);

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

              {/* Exploration Actions */}
              <div className="mt-5 md:mt-6 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={onRegenerateVisualization}
                  className="flex items-center justify-center gap-2 px-5 py-3 bg-foreground text-background rounded-full font-medium text-sm hover:opacity-90 active:scale-[0.98] transition-all touch-manipulation"
                >
                  <RefreshCw size={16} />
                  Try Another Version
                </button>
                <button
                  onClick={onChangeStyle}
                  className="flex items-center justify-center gap-2 px-5 py-3 border border-foreground rounded-full font-medium text-sm hover:bg-secondary transition-all touch-manipulation"
                >
                  <Palette size={16} />
                  Change Style
                </button>
              </div>
              <button
                onClick={onStartFresh}
                className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors touch-manipulation"
              >
                <RotateCcw size={12} />
                Start Fresh
              </button>
            </div>

            {/* Right - Project Passport */}
            <div className="slide-up" style={{ animationDelay: "0.1s" }}>
              <div className="lg:sticky lg:top-24">
                <h2 className="text-2xl md:text-3xl font-serif mb-1 md:mb-2">Project Passport</h2>
                <p className="text-sm md:text-base text-muted-foreground mb-5 md:mb-8">
                  Estimated investment for {localArea}m²
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

                    {/* Total Price Range */}
                    <div className="mt-6">
                      <p className="text-xs text-muted-foreground mb-1">Estimated Total</p>
                      <p className="text-3xl md:text-4xl font-serif tabular-nums">
                        €{calculation.lowEstimate.toLocaleString()} – €{calculation.highEstimate.toLocaleString()}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        Based on typical project costs (±15%)
                      </p>
                    </div>

                    {/* Customize & Details Collapsible */}
                    <div className="mt-6 border-t border-border pt-4">
                      <button
                        onClick={() => setIsRefineOpen(!isRefineOpen)}
                        className="flex items-center justify-between w-full text-sm font-medium text-foreground hover:text-foreground/80 transition-colors touch-manipulation"
                      >
                        <span>Customize & Details</span>
                        <ChevronDown 
                          size={16} 
                          className={`transition-transform duration-200 ${isRefineOpen ? 'rotate-180' : ''}`} 
                        />
                      </button>
                      
                      {isRefineOpen && (
                        <div className="mt-4 space-y-5 animate-fade-in">
                          {/* Line Items Breakdown */}
                          <TooltipProvider delayDuration={0}>
                            <div className="space-y-2.5">
                              {calculation.lineItems.map((item, index) => (
                                <div key={index} className="flex justify-between items-center text-sm">
                                  <HybridTooltip content={<p>{item.tooltip}</p>} className="max-w-[240px] text-xs">
                                    <span className="text-muted-foreground flex items-center gap-1.5 cursor-help">
                                      {item.label}
                                      <Info size={12} className="text-muted-foreground/50" />
                                    </span>
                                  </HybridTooltip>
                                  <span className="text-muted-foreground tabular-nums">≈ €{item.value.toLocaleString()}</span>
                                </div>
                              ))}
                              {calculation.renovationCost > 0 && (
                                <div className="flex justify-between items-center text-sm pt-2 border-t border-dashed border-stone-200">
                                  <HybridTooltip 
                                    content={<p>Stripping existing finishes, waste removal, and preparing surfaces for new work</p>}
                                    className="max-w-[240px] text-xs"
                                  >
                                    <span className="text-muted-foreground flex items-center gap-1.5 cursor-help">
                                      Renovation Prep
                                      <Info size={12} className="text-muted-foreground/50" />
                                    </span>
                                  </HybridTooltip>
                                  <span className="text-muted-foreground tabular-nums">≈ €{calculation.renovationCost.toLocaleString()}</span>
                                </div>
                              )}
                              <p className="text-[10px] text-muted-foreground mt-3 italic">
                                All figures are preliminary estimates based on typical project costs
                              </p>
                            </div>
                          </TooltipProvider>

                          {/* Divider between items and sliders */}
                          <div className="border-t border-dashed border-stone-200" />

                          {/* Area slider */}
                          <div>
                            <div className="flex justify-between items-center mb-3">
                              <label className="text-xs text-muted-foreground">Total Area</label>
                              <span className="text-xs text-muted-foreground tabular-nums">{localArea} m²</span>
                            </div>
                            <Slider
                              value={[localArea]}
                              onValueChange={(value) => handleUpdateFormData({ area: value[0] })}
                              min={20}
                              max={200}
                              step={5}
                              className="w-full"
                            />
                          </div>

                          {/* Kitchen Length slider */}
                          <div>
                            <div className="flex justify-between items-center mb-3">
                              <label className="text-xs text-muted-foreground">Kitchen Length</label>
                              <span className="text-xs text-muted-foreground tabular-nums">{localKitchenLength} lm</span>
                            </div>
                            <Slider
                              value={[localKitchenLength]}
                              onValueChange={(value) => handleUpdateFormData({ kitchenLength: value[0] })}
                              min={2}
                              max={8}
                              step={0.5}
                              className="w-full"
                            />
                          </div>

                          {/* Wardrobe Length slider */}
                          <div>
                            <div className="flex justify-between items-center mb-3">
                              <label className="text-xs text-muted-foreground">Built-in Wardrobes</label>
                              <span className="text-xs text-muted-foreground tabular-nums">{localWardrobeLength} lm</span>
                            </div>
                            <Slider
                              value={[localWardrobeLength]}
                              onValueChange={(value) => handleUpdateFormData({ wardrobeLength: value[0] })}
                              min={0}
                              max={12}
                              step={0.5}
                              className="w-full"
                            />
                          </div>

                          {/* Renovation toggle */}
                          <div className="flex items-center justify-between py-3 border-t border-border">
                            <div>
                              <label className="text-xs font-medium">Renovation State</label>
                              <p className="text-[10px] text-muted-foreground">
                                {localIsRenovation ? "Old / Renovation" : "New Build"}
                              </p>
                            </div>
                            <Switch
                              checked={localIsRenovation}
                              onCheckedChange={(checked) => handleUpdateFormData({ isRenovation: checked })}
                            />
                          </div>

                          {/* Project Scope */}
                          <div className="py-3 border-t border-border">
                            <label className="text-xs font-medium mb-3 block">Project Scope</label>
                            <div className="flex gap-2">
                              {scopeOptions.map((option) => (
                                <button
                                  key={option.value}
                                  onClick={() => handleUpdateFormData({ projectScope: option.value })}
                                  className={`flex-1 py-2 px-2 rounded-full text-[10px] font-medium transition-all duration-200 touch-manipulation active:scale-[0.98] ${
                                    localProjectScope === option.value
                                      ? 'bg-foreground text-background'
                                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                  }`}
                                >
                                  {option.label}
                                </button>
                              ))}
                            </div>
                          </div>
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
                      {(selectedMaterial && paletteMaterials[selectedMaterial] 
                        ? paletteMaterials[selectedMaterial] 
                        : defaultMaterials
                      ).map((material, index) => (
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
