import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import TierSelector from "./TierSelector";
import MaterialCard from "./MaterialCard";
import ServiceCard from "./ServiceCard";
import { CostInsightSheet } from "./CostInsightSheet";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { ChevronDown, Download, Share2, X, Info, RefreshCw, Palette, RotateCcw, User, MessageSquare, Sparkles } from "lucide-react";
import {
  FormData,
  ServiceSelection,
  baseRates,
  designRates,
  kitchenRates,
  appliancePackages,
  wardrobeRates,
  renovationRate,
  furniturePercentage,
  priceVariance,
  roundToHundred,
  serviceCardContent,
} from "@/types/calculator";

interface ResultDashboardProps {
  mode?: "full" | "calculator";
  isVisible: boolean;
  formData: FormData | null;
  uploadedImage: string | null;
  selectedMaterial: string | null;
  selectedStyle: string | null;
  freestyleDescription?: string;
  onClose?: () => void;
  onFormDataChange?: (formData: FormData) => void;
  onRegenerateVisualization?: () => void;
  onChangeStyle?: () => void;
  onStartFresh?: () => void;
}

// Material data mapped to each palette with designer info
const paletteMaterials: Record<string, {
  designer: { name: string; title: string };
  materials: { swatchColors: string[]; title: string; category: string }[];
}> = {
  "Milan Grey": {
    designer: { name: "Sigita Kulikajeva", title: "Interior Designer" },
    materials: [
      { swatchColors: ["bg-slate-300", "bg-slate-400", "bg-slate-200", "bg-slate-500"], title: "Polished Concrete", category: "Micro-cement Finish" },
      { swatchColors: ["bg-zinc-400", "bg-zinc-500", "bg-zinc-300", "bg-zinc-600"], title: "Brushed Steel", category: "Cabinet Handles" },
      { swatchColors: ["bg-gray-200", "bg-gray-300", "bg-gray-100", "bg-gray-400"], title: "Limestone Tile", category: "Honed 600x600" },
      { swatchColors: ["bg-slate-200", "bg-slate-300", "bg-slate-100", "bg-slate-400"], title: "Smoked Glass", category: "Partition Panels" },
    ],
  },
  "Natural Walnut": {
    designer: { name: "Sigita Kulikajeva", title: "Interior Designer" },
    materials: [
      { swatchColors: ["bg-amber-600", "bg-amber-700", "bg-amber-500", "bg-amber-800"], title: "Engineered Walnut", category: "Herringbone • 15mm" },
      { swatchColors: ["bg-yellow-700", "bg-yellow-800", "bg-yellow-600", "bg-amber-700"], title: "Walnut Veneer", category: "Joinery Fronts" },
      { swatchColors: ["bg-amber-200", "bg-amber-300", "bg-amber-100", "bg-amber-400"], title: "Brass Fixtures", category: "Burnished Finish" },
      { swatchColors: ["bg-neutral-200", "bg-neutral-300", "bg-neutral-100", "bg-neutral-400"], title: "Linen Fabric", category: "Acoustic Panels" },
    ],
  },
  "Onyx & Brass": {
    designer: { name: "Sigita Kulikajeva", title: "Interior Designer" },
    materials: [
      { swatchColors: ["bg-zinc-900", "bg-zinc-800", "bg-zinc-950", "bg-zinc-700"], title: "Black Marble", category: "Nero Marquina • Polished" },
      { swatchColors: ["bg-yellow-600", "bg-yellow-500", "bg-amber-500", "bg-yellow-700"], title: "Brushed Brass", category: "Hardware & Fixtures" },
      { swatchColors: ["bg-zinc-800", "bg-zinc-700", "bg-zinc-900", "bg-zinc-600"], title: "Smoked Oak", category: "Flooring • Matte" },
      { swatchColors: ["bg-zinc-700", "bg-zinc-600", "bg-zinc-800", "bg-zinc-500"], title: "Black Steel", category: "Frame Details" },
    ],
  },
  "Calacatta White": {
    designer: { name: "Sigita Kulikajeva", title: "Interior Designer" },
    materials: [
      { swatchColors: ["bg-neutral-100", "bg-neutral-200", "bg-neutral-50", "bg-gray-100"], title: "Calacatta Quartz", category: "Worktops • 30mm" },
      { swatchColors: ["bg-white", "bg-gray-50", "bg-neutral-50", "bg-gray-100"], title: "White Oak", category: "Flooring • Wide Plank" },
      { swatchColors: ["bg-neutral-200", "bg-neutral-300", "bg-neutral-100", "bg-neutral-400"], title: "Matte Lacquer", category: "Cabinet Finish" },
      { swatchColors: ["bg-gray-100", "bg-gray-200", "bg-gray-50", "bg-neutral-100"], title: "Textured Plaster", category: "Wall Finish" },
    ],
  },
};

// Fallback materials if no palette selected
const defaultMaterials = [
  { swatchColors: ["bg-neutral-200", "bg-neutral-300", "bg-neutral-100", "bg-neutral-400"], title: "Engineered Wood", category: "Oak Finish" },
  { swatchColors: ["bg-gray-200", "bg-gray-300", "bg-gray-100", "bg-gray-400"], title: "Painted MDF", category: "Matte White" },
  { swatchColors: ["bg-zinc-300", "bg-zinc-400", "bg-zinc-200", "bg-zinc-500"], title: "LED System", category: "Dimmable Track" },
  { swatchColors: ["bg-neutral-200", "bg-neutral-300", "bg-neutral-100", "bg-neutral-400"], title: "Wall Panels", category: "Textured Finish" },
];

const ResultDashboard = ({ 
  mode = "full",
  isVisible, 
  formData, 
  uploadedImage,
  selectedMaterial,
  selectedStyle,
  freestyleDescription,
  onClose,
  onFormDataChange,
  onRegenerateVisualization,
  onChangeStyle,
  onStartFresh
}: ResultDashboardProps) => {
  const [selectedTier, setSelectedTier] = useState<"Budget" | "Standard" | "Premium">("Standard");
  const [isRefineOpen, setIsRefineOpen] = useState(false);
  const [activeInsight, setActiveInsight] = useState<string | null>(null);

  // Local state for refine inputs
  const [localArea, setLocalArea] = useState(formData?.area ?? 50);
  const [localIsRenovation, setLocalIsRenovation] = useState(formData?.isRenovation ?? false);
  const [localServices, setLocalServices] = useState<ServiceSelection>(
    formData?.services ?? { spacePlanning: true, interiorFinishes: true, furnishingDecor: true }
  );
  const [localKitchenLength, setLocalKitchenLength] = useState(formData?.kitchenLength ?? 4);
  const [localWardrobeLength, setLocalWardrobeLength] = useState(formData?.wardrobeLength ?? 3);

  // Sync local state when formData changes
  useState(() => {
    if (formData) {
      setLocalArea(formData.area);
      setLocalIsRenovation(formData.isRenovation);
      setLocalServices(formData.services);
      setLocalKitchenLength(formData.kitchenLength);
      setLocalWardrobeLength(formData.wardrobeLength);
    }
  });

  const handleUpdateFormData = (updates: Partial<FormData>) => {
    const newFormData: FormData = {
      area: updates.area ?? localArea,
      isRenovation: updates.isRenovation ?? localIsRenovation,
      services: updates.services ?? localServices,
      kitchenLength: updates.kitchenLength ?? localKitchenLength,
      wardrobeLength: updates.wardrobeLength ?? localWardrobeLength,
    };
    
    if (updates.area !== undefined) setLocalArea(updates.area);
    if (updates.isRenovation !== undefined) setLocalIsRenovation(updates.isRenovation);
    if (updates.services !== undefined) setLocalServices(updates.services);
    if (updates.kitchenLength !== undefined) setLocalKitchenLength(updates.kitchenLength);
    if (updates.wardrobeLength !== undefined) setLocalWardrobeLength(updates.wardrobeLength);
    
    onFormDataChange?.(newFormData);
  };

  const handleToggleService = (service: keyof ServiceSelection) => {
    const newServices = { ...localServices, [service]: !localServices[service] };
    handleUpdateFormData({ services: newServices });
  };

  const calculation = useMemo(() => {
    const tier = selectedTier;
    
    // Calculate costs based on selected services
    // Space Planning affects Interior Design cost
    const interiorDesign = localServices.spacePlanning 
      ? roundToHundred(localArea * designRates[tier])
      : 0;
    
    // Interior Finishes affects Construction & Finish, Materials, Kitchen, Wardrobes, Appliances
    const constructionFinish = localServices.interiorFinishes
      ? roundToHundred(localArea * baseRates[tier] * 0.35)
      : 0;
    
    const builtInProducts = localServices.interiorFinishes
      ? roundToHundred(localArea * baseRates[tier] * 0.25)
      : 0;
    
    const kitchenJoinery = localServices.interiorFinishes
      ? roundToHundred(localKitchenLength * kitchenRates[tier])
      : 0;
    
    const appliances = localServices.interiorFinishes
      ? roundToHundred(appliancePackages[tier])
      : 0;
    
    const wardrobes = localServices.interiorFinishes
      ? roundToHundred(localWardrobeLength * wardrobeRates[tier])
      : 0;
    
    // Renovation Prep (if applicable)
    const renovationCost = localIsRenovation ? roundToHundred(localArea * renovationRate) : 0;
    
    // Subtotal before furniture
    const subtotal = interiorDesign + constructionFinish + builtInProducts + kitchenJoinery + appliances + wardrobes + renovationCost;
    
    // Furnishing & Decor affects Furniture cost
    const furniture = localServices.furnishingDecor
      ? roundToHundred(subtotal * furniturePercentage)
      : 0;
    
    // Total
    const total = subtotal + furniture;
    
    // Calculate ±15% range for total (also rounded)
    const lowEstimate = roundToHundred(total * (1 - priceVariance));
    const highEstimate = roundToHundred(total * (1 + priceVariance));

    // Tier-aware tooltips explaining why prices differ
    const tierTooltips = {
      "Interior Design Project": {
        Budget: "Functional layouts with basic lighting — one pendant per room and standard ergonomics",
        Standard: "Detailed plans with layered lighting zones, optimized circulation, and custom details",
        Premium: "Full 3D visualization, bespoke lighting design, premium ergonomics, and meticulous detailing",
      },
      "Construction & Finish": {
        Budget: "Standard finishes, basic plastering, and cost-effective flooring installation",
        Standard: "Quality workmanship, smooth finishes, and precise detailing throughout",
        Premium: "Artisan-level craftsmanship, seamless finishes, and premium installation techniques",
      },
      "Built-in Products & Materials": {
        Budget: "Practical materials — laminate flooring, standard tiles, and basic fixtures",
        Standard: "Quality mid-range — engineered wood, porcelain tiles, and branded fixtures",
        Premium: "Luxury selection — natural stone, hardwood, designer fixtures, and premium hardware",
      },
      "Kitchen & Joinery": {
        Budget: "MDF carcasses with laminate finish, standard hardware, and practical worktops",
        Standard: "Solid wood frames, soft-close mechanisms, and engineered stone surfaces",
        Premium: "Solid timber construction, premium hardware, natural stone worktops, and bespoke details",
      },
      "Home Appliances": {
        Budget: "Reliable brands covering essential functions — practical and efficient",
        Standard: "Premium brands with advanced features — better performance and longevity",
        Premium: "Top-tier brands — professional-grade performance, smart features, and integrated design",
      },
      "Built-in Wardrobes": {
        Budget: "Melamine finish with basic internal layout and standard fittings",
        Standard: "Painted MDF, customized internals, soft-close doors, and quality accessories",
        Premium: "Lacquered or veneer finish, LED lighting, premium fittings, and bespoke organization",
      },
      "Furniture (est.)": {
        Budget: "Functional basics — mix of ready-made pieces from reliable brands",
        Standard: "Quality mid-range — coordinated selection from established furniture brands",
        Premium: "Designer pieces, custom upholstery, and investment furniture built to last decades",
      },
    };

    // Build grouped line items, filtering out zero-value items
    const groupedLineItems = [
      {
        header: "PROJECT & SHELL",
        items: [
          ...(interiorDesign > 0 ? [{ label: "Interior Design", value: interiorDesign, tooltip: tierTooltips["Interior Design Project"][tier] }] : []),
          { label: "Construction & Finish", value: constructionFinish, tooltip: tierTooltips["Construction & Finish"][tier] },
          ...(builtInProducts > 0 ? [{ label: "Materials", value: builtInProducts, tooltip: tierTooltips["Built-in Products & Materials"][tier] }] : []),
        ].filter(item => item.value > 0)
      },
      {
        header: "FIXED JOINERY",
        items: [
          { label: "Kitchen", value: kitchenJoinery, tooltip: tierTooltips["Kitchen & Joinery"][tier] },
          { label: "Wardrobes", value: wardrobes, tooltip: tierTooltips["Built-in Wardrobes"][tier] },
        ].filter(item => item.value > 0)
      },
      {
        header: "MOVABLES & TECH",
        items: [
          { label: "Appliances", value: appliances, tooltip: tierTooltips["Home Appliances"][tier] },
          ...(furniture > 0 ? [{ label: "Furniture", value: furniture, tooltip: tierTooltips["Furniture (est.)"][tier] }] : []),
        ].filter(item => item.value > 0)
      },
    ].filter(group => group.items.length > 0);

    return { total, lowEstimate, highEstimate, groupedLineItems, renovationCost };
  }, [localArea, localIsRenovation, localServices, localKitchenLength, localWardrobeLength, selectedTier]);

  // Build summary line based on selected services
  const summaryLine = useMemo(() => {
    const allSelected = localServices.spacePlanning && localServices.interiorFinishes && localServices.furnishingDecor;
    if (allSelected) {
      return "Construction ~40% • Joinery ~35% • Technics ~25%";
    }
    return "Custom package — see breakdown";
  }, [localServices]);

  if (!isVisible || !formData) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background fade-in overflow-auto">
      <div className="min-h-screen pb-safe">
        {/* Header */}
        <div className="glass-panel sticky top-0 z-10">
          <div className="container mx-auto px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
            <Link to="/" className="text-xl md:text-2xl font-serif font-medium tracking-tight text-foreground">Design Dialogues</Link>
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
          <div className={`grid gap-6 md:gap-12 ${mode === "full" ? "lg:grid-cols-2" : "max-w-xl mx-auto"}`}>
            {/* Left - Image (only in full mode) */}
            {mode === "full" && (
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
                
                {/* Visualization Disclaimer */}
                <p className="text-[10px] md:text-xs text-muted-foreground italic mt-2 text-center">
                  Conceptual visualization — actual spaces and materials may vary
                </p>
                
                <div className="mt-3 md:mt-4 flex gap-2 flex-wrap">
                  {freestyleDescription ? (
                    <span className="px-2.5 md:px-3 py-1 md:py-1.5 bg-secondary rounded-full text-[10px] md:text-xs font-medium flex items-center gap-1">
                      <Sparkles size={10} />
                      Custom Vision
                    </span>
                  ) : selectedMaterial ? (
                    <span className="px-2.5 md:px-3 py-1 md:py-1.5 bg-secondary rounded-full text-[10px] md:text-xs font-medium">
                      {selectedMaterial}
                    </span>
                  ) : null}
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
            )}

            {/* Right - Project Passport */}
            <div className="slide-up" style={{ animationDelay: "0.1s" }}>
              <div className="lg:sticky lg:top-24">
                <h2 className="text-2xl md:text-3xl font-serif mb-1 md:mb-2">Project Passport</h2>
                <p className="text-sm md:text-base text-muted-foreground mb-5 md:mb-8">
                  Estimated investment for {localArea}m²
                </p>

                {/* Unified Card Container */}
                <div className="border border-ds-border-default rounded-2xl overflow-hidden">
                  {/* Top Half - Financials (White) */}
                  <div className="bg-surface-primary p-5 md:p-6">
                    {/* Tier Selector */}
                    <TierSelector 
                      selectedTier={selectedTier} 
                      onSelectTier={setSelectedTier} 
                    />
                    
                    {/* Tier Philosophy */}
                    <p className="text-sm text-text-muted italic py-6 text-center">
                      {selectedTier === "Budget" && "Smart solutions that maximize value — quality basics done well."}
                      {selectedTier === "Standard" && "The sweet spot — lasting quality with thoughtful design details."}
                      {selectedTier === "Premium" && "Exceptional finishes and craftsmanship — built to inspire for decades."}
                    </p>

                    {/* Conservative Estimate */}
                    <div className="text-center">
                      <p className="text-4xl md:text-5xl font-serif tabular-nums">
                        €{calculation.highEstimate.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Conservative estimate incl. 15% market buffer
                      </p>
                    </div>
                    
                    {/* Divider */}
                    <div className="border-t border-ds-border-subtle my-6" />
                    
                    {/* Stat Row - 3 Column Breakdown */}
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-lg font-semibold text-text-secondary">40%</p>
                        <p className="text-[10px] text-text-muted uppercase tracking-wide">Shell</p>
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-text-secondary">35%</p>
                        <p className="text-[10px] text-text-muted uppercase tracking-wide">Joinery</p>
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-text-secondary">25%</p>
                        <p className="text-[10px] text-text-muted uppercase tracking-wide">Technics</p>
                      </div>
                    </div>
                    
                    {/* Trigger Link */}
                    <button
                      onClick={() => setIsRefineOpen(!isRefineOpen)}
                      className="mt-6 text-sm text-text-tertiary hover:text-foreground transition-colors flex items-center gap-1 mx-auto touch-manipulation"
                    >
                      Adjust Parameters & Breakdown
                      <ChevronDown 
                        size={14} 
                        className={`transition-transform duration-200 ${isRefineOpen ? 'rotate-180' : ''}`}
                      />
                    </button>

                    {/* Expanded Panel */}
                    {isRefineOpen && (
                      <div className="mt-4 bg-surface-muted/50 rounded-xl p-4 space-y-5 animate-fade-in">
                        {/* SECTION A: INPUTS */}
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
                        <div className="flex items-center justify-between pt-4 mt-4 border-t border-ds-border-subtle">
                          <label className="font-medium text-sm text-text-primary">Renovation Required</label>
                          <Switch
                            checked={localIsRenovation}
                            onCheckedChange={(checked) => handleUpdateFormData({ isRenovation: checked })}
                          />
                        </div>

                        {/* Service Selection Cards */}
                        <div className="py-3 border-t border-ds-border-default">
                          <label className="text-xs font-medium mb-3 block">Services Included</label>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <ServiceCard
                              title={serviceCardContent.spacePlanning.title}
                              description={serviceCardContent.spacePlanning.descriptions[selectedTier]}
                              isSelected={localServices.spacePlanning}
                              onToggle={() => handleToggleService('spacePlanning')}
                            />
                            <ServiceCard
                              title={serviceCardContent.interiorFinishes.title}
                              description={serviceCardContent.interiorFinishes.descriptions[selectedTier]}
                              isSelected={localServices.interiorFinishes}
                              onToggle={() => handleToggleService('interiorFinishes')}
                            />
                            <ServiceCard
                              title={serviceCardContent.furnishingDecor.title}
                              description={serviceCardContent.furnishingDecor.descriptions[selectedTier]}
                              isSelected={localServices.furnishingDecor}
                              onToggle={() => handleToggleService('furnishingDecor')}
                            />
                          </div>
                        </div>

                        {/* SECTION B: OUTPUTS - Grouped Line Items */}
                        <div className="space-y-4 pt-3 border-t border-ds-border-default">
                          {calculation.groupedLineItems.map((group, groupIndex) => (
                            <div key={groupIndex} className="space-y-2 mt-5 first:mt-0">
                              <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                                {group.header}
                              </p>
                              {group.items.map((item, index) => (
                                <div key={index} className="flex justify-between items-center text-sm">
                                  <span className="text-text-tertiary flex items-center">
                                    {item.label}
                                    <Info 
                                      size={11} 
                                      className="ml-1 text-text-subtle cursor-pointer hover:text-text-primary transition-colors" 
                                      onClick={() => setActiveInsight(item.label)}
                                    />
                                  </span>
                                  <span className="font-medium text-text-primary tabular-nums text-right">
                                    €{item.value.toLocaleString()}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ))}
                          
                          {/* Renovation Prep (conditional) */}
                          {calculation.renovationCost > 0 && (
                            <div className="space-y-2 mt-5 pt-2 border-t border-dashed border-ds-border-default">
                              <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                                RENOVATION
                              </p>
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-text-tertiary flex items-center">
                                  Prep Work
                                  <Info 
                                    size={11} 
                                    className="ml-1 text-text-subtle cursor-pointer hover:text-text-primary transition-colors" 
                                    onClick={() => setActiveInsight("Prep Work")}
                                  />
                                </span>
                                <span className="font-medium text-text-primary tabular-nums text-right">
                                  €{calculation.renovationCost.toLocaleString()}
                                </span>
                              </div>
                            </div>
                          )}
                          
                          <p className="text-[10px] text-muted-foreground pt-2 italic">
                            All figures are preliminary estimates based on typical project costs
                          </p>
                        </div>
                      </div>
                    )}

                  </div>

                  {/* Subtle Divider */}
                  <div className="border-t border-ds-border-subtle" />

                  {/* Bottom Half - Material Manifest (Muted) or Visualize CTA */}
                  <div className="bg-surface-muted p-5 md:p-6">
                    {mode === "calculator" ? (
                      /* Calculator Mode - Show Visualize CTA */
                      <div className="flex flex-col items-center justify-center py-4">
                        <Link
                          to="/"
                          className="flex items-center justify-center gap-2 px-6 py-3 bg-foreground text-background rounded-full font-medium text-sm hover:opacity-90 active:scale-[0.98] transition-all touch-manipulation"
                        >
                          <Sparkles size={16} />
                          Visualize Your Space
                        </Link>
                      </div>
                    ) : freestyleDescription ? (
                      /* Freestyle Mode - Show description and CTA */
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Sparkles size={14} className="text-text-muted" />
                          <h4 className="text-sm font-medium text-foreground">Your Vision</h4>
                        </div>
                        <blockquote className="text-sm text-text-secondary italic border-l-2 border-ds-border-strong pl-3 mb-5">
                          "{freestyleDescription}"
                        </blockquote>
                        <p className="text-xs text-muted-foreground mb-4">
                          Our designers will curate a personalized material selection based on your description
                        </p>
                        <button className="w-full py-3 border-2 border-ds-border-emphasis rounded-xl font-medium text-sm flex items-center justify-center gap-2 hover:bg-surface-sunken transition-colors touch-manipulation">
                          <MessageSquare size={16} />
                          Request Curated Material List
                        </button>
                      </div>
                    ) : (
                      /* Curated Mode - Show material cards */
                      <>
                        {/* Header with Designer Credit */}
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-foreground">Material Palette</h4>
                          <div className="flex items-center gap-2 mt-2">
                            <div className="w-6 h-6 rounded-full bg-surface-sunken flex items-center justify-center flex-shrink-0">
                              <User size={12} className="text-text-muted" />
                            </div>
                            <div>
                              <p className="text-xs font-medium text-foreground">
                                {selectedMaterial && paletteMaterials[selectedMaterial]
                                  ? paletteMaterials[selectedMaterial].designer.name
                                  : "Design Dialogues"}
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                {selectedMaterial && paletteMaterials[selectedMaterial]
                                  ? paletteMaterials[selectedMaterial].designer.title
                                  : "Interior Designer"}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Material Cards Grid */}
                        <div className="space-y-2">
                          {(selectedMaterial && paletteMaterials[selectedMaterial] 
                            ? paletteMaterials[selectedMaterial].materials 
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
                      </>
                    )}
                  </div>
                </div>

                {/* CTA Button (only in full mode) */}
                {mode === "full" && (
                  <button className="w-full mt-6 py-3.5 md:py-4 bg-foreground text-background rounded-full font-medium text-sm flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all">
                    Download Project Passport (PDF)
                    <Download size={16} className="md:w-[18px] md:h-[18px]" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cost Insight Sheet */}
      <CostInsightSheet 
        isOpen={activeInsight !== null}
        onClose={() => setActiveInsight(null)}
        category={activeInsight || ""}
        tier={selectedTier.toLowerCase() as "budget" | "standard" | "premium"}
      />
    </div>
  );
};

export default ResultDashboard;
