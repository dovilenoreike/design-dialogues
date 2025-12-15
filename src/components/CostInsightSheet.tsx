import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { Check, AlertTriangle, Clock, X } from "lucide-react";

interface CategoryInsight {
  definition: string;
  lifespan: string;
  save: {
    title: string;
    items: string[];
  };
  risk: {
    title: string;
    items: string[];
  };
}

const categoryInsights: Record<string, CategoryInsight> = {
  "Interior Design": {
    definition: "Professional space planning, 3D visualization, material selection, and project coordination.",
    lifespan: "Permanent Value",
    save: {
      title: "Where to Save",
      items: ["Basic mood boards instead of full 3D renders", "Standard furniture layouts"]
    },
    risk: {
      title: "Risk Zone",
      items: ["Skipping professional measurements. Errors here cascade into expensive mistakes."]
    }
  },
  "Construction & Finish": {
    definition: "The 'wet' work: smoothing walls, painting, tiling, and floor installation.",
    lifespan: "15+ Years",
    save: {
      title: "Where to Save",
      items: ["Wall colors (paint is easy to change)", "Skirting boards"]
    },
    risk: {
      title: "Risk Zone",
      items: ["Floor preparation. If the sub-floor isn't level, expensive parquet will creak and break."]
    }
  },
  "Materials": {
    definition: "All surface finishes: flooring, tiles, paint, wallcoverings, and decorative elements.",
    lifespan: "10-20 Years",
    save: {
      title: "Where to Save",
      items: ["Accent walls instead of full room treatments", "Quality vinyl over cheap hardwood"]
    },
    risk: {
      title: "Risk Zone",
      items: ["Bathroom tiles and wet area materials. Water damage from cheap tiles is catastrophic."]
    }
  },
  "Kitchen": {
    definition: "Cabinetry, countertops, sink, tap, and all fitted kitchen furniture.",
    lifespan: "15-25 Years",
    save: {
      title: "Where to Save",
      items: ["MDF carcasses with quality fronts", "Standard cabinet dimensions"]
    },
    risk: {
      title: "Risk Zone",
      items: ["Drawer runners and hinges. Cheap hardware fails within 2 years of daily use."]
    }
  },
  "Wardrobes": {
    definition: "Built-in closet systems, sliding doors, internal organizers, and lighting.",
    lifespan: "15-20 Years",
    save: {
      title: "Where to Save",
      items: ["Simple internal layouts", "Standard door sizes"]
    },
    risk: {
      title: "Risk Zone",
      items: ["Sliding door mechanisms. Cheap tracks warp and jam within months."]
    }
  },
  "Appliances": {
    definition: "Kitchen appliances: hob, oven, extractor, refrigerator, dishwasher, and washer/dryer.",
    lifespan: "8-12 Years",
    save: {
      title: "Where to Save",
      items: ["Previous-year models with same specs", "Bundle deals from single brand"]
    },
    risk: {
      title: "Risk Zone",
      items: ["Energy ratings. A cheap A+ fridge costs €200+ more annually than A+++ over its lifetime."]
    }
  },
  "Furniture": {
    definition: "Freestanding pieces: sofas, dining tables, beds, chairs, and decorative items.",
    lifespan: "5-15 Years",
    save: {
      title: "Where to Save",
      items: ["Accent pieces and decorative items", "Guest bedroom furniture"]
    },
    risk: {
      title: "Risk Zone",
      items: ["Daily-use seating. A cheap sofa loses support in 2 years; quality frames last decades."]
    }
  },
  "Prep Work": {
    definition: "Demolition, waste removal, stripping old finishes, and preparing surfaces for new work.",
    lifespan: "One-time",
    save: {
      title: "Where to Save",
      items: ["DIY demolition of non-structural elements", "Own waste disposal runs"]
    },
    risk: {
      title: "Risk Zone",
      items: ["Asbestos or lead paint assessment. Skipping tests can create serious health hazards."]
    }
  }
};

interface CostInsightSheetProps {
  isOpen: boolean;
  onClose: () => void;
  category: string;
}

export const CostInsightSheet = ({ isOpen, onClose, category }: CostInsightSheetProps) => {
  const isMobile = useIsMobile();
  const insight = categoryInsights[category];

  if (!insight) return null;

  const content = (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <h2 className="font-serif text-2xl text-stone-900">{category}</h2>
        {!isMobile && (
          <button onClick={onClose} className="text-stone-400 hover:text-stone-900 transition-colors">
            <X size={20} />
          </button>
        )}
      </div>

      {/* Definition */}
      <p className="text-stone-500 text-sm leading-relaxed">{insight.definition}</p>

      {/* Durability Badge */}
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 rounded-full text-xs font-medium text-stone-600">
        <Clock size={12} />
        <span>Lifespan: {insight.lifespan}</span>
      </div>

      {/* Strategy Blocks */}
      <div className={`grid gap-3 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
        {/* Save Block */}
        <div className="bg-green-50 border border-green-100 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
              <Check size={14} className="text-green-600" />
            </div>
            <span className="font-medium text-green-900 text-sm">{insight.save.title}</span>
          </div>
          <ul className="space-y-2">
            {insight.save.items.map((item, idx) => (
              <li key={idx} className="text-green-800 text-sm leading-relaxed">
                • {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Risk Block */}
        <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center">
              <AlertTriangle size={14} className="text-orange-600" />
            </div>
            <span className="font-medium text-orange-900 text-sm">{insight.risk.title}</span>
          </div>
          <ul className="space-y-2">
            {insight.risk.items.map((item, idx) => (
              <li key={idx} className="text-orange-800 text-sm leading-relaxed">
                • {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="bottom" className="rounded-t-2xl px-5 pb-8 pt-6">
          {content}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-6 gap-0" hideCloseButton>
        {content}
      </DialogContent>
    </Dialog>
  );
};
