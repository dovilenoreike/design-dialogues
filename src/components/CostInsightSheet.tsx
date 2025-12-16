import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { Check, AlertTriangle, Clock, X } from "lucide-react";

interface TierSpecificContent {
  lifespan: string;
  save: { title: string; items: string[] };
  risk: { title: string; items: string[] };
}

interface CategoryInsight {
  definition: string;
  budget: TierSpecificContent;
  standard: TierSpecificContent;
  premium: TierSpecificContent;
}

const categoryInsights: Record<string, CategoryInsight> = {
  "Interior Design": {
    definition: "Professional space planning, 3D visualization, material selection, and project coordination.",
    budget: {
      lifespan: "Basic Value",
      save: {
        title: "Where to Save",
        items: ["DIY mood boards using Pinterest", "Single room focus instead of whole-home"]
      },
      risk: {
        title: "Risk Zone",
        items: ["Skipping measurements entirely — even budget projects need accurate dimensions to avoid costly mistakes."]
      }
    },
    standard: {
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
    premium: {
      lifespan: "Lasting Legacy",
      save: {
        title: "Smart Savings",
        items: ["Photorealistic renders for key rooms only", "Reuse design elements across similar spaces"]
      },
      risk: {
        title: "Diminishing Returns",
        items: ["Over-iterating on 3D renders — after 3 rounds, refinements rarely justify the cost."]
      }
    }
  },
  "Construction & Finish": {
    definition: "The 'wet' work: smoothing walls, painting, tiling, and floor installation.",
    budget: {
      lifespan: "8-12 Years",
      save: {
        title: "Where to Save",
        items: ["Single-coat paints in low-traffic areas", "Basic tile formats (30x30cm)"]
      },
      risk: {
        title: "Risk Zone",
        items: ["Skipping primer — paint will peel within 2 years, costing double to redo."]
      }
    },
    standard: {
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
    premium: {
      lifespan: "20+ Years",
      save: {
        title: "Smart Savings",
        items: ["Feature walls only for expensive finishes", "Standard plaster with premium paint outperforms cheap Venetian plaster"]
      },
      risk: {
        title: "Diminishing Returns",
        items: ["Micro-cement everywhere — it's trendy but requires annual sealing and chips easily."]
      }
    }
  },
  "Materials": {
    definition: "All surface finishes: flooring, tiles, paint, wallcoverings, and decorative elements.",
    budget: {
      lifespan: "5-10 Years",
      save: {
        title: "Where to Save",
        items: ["Vinyl plank over laminate (more durable)", "Paint feature walls instead of wallpaper"]
      },
      risk: {
        title: "Risk Zone",
        items: ["Cheap bathroom tiles — water penetration causes mold and structural damage within 3-5 years."]
      }
    },
    standard: {
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
    premium: {
      lifespan: "15-25 Years",
      save: {
        title: "Smart Savings",
        items: ["Natural stone in focal areas only", "Engineered wood matches solid wood aesthetically at 60% of the cost"]
      },
      risk: {
        title: "Diminishing Returns",
        items: ["Exotic hardwoods — European oak outperforms most tropical woods and costs less."]
      }
    }
  },
  "Kitchen": {
    definition: "Cabinetry, countertops, sink, tap, and all fitted kitchen furniture.",
    budget: {
      lifespan: "8-12 Years",
      save: {
        title: "Where to Save",
        items: ["Laminate fronts over painted MDF", "Standard 60cm cabinet widths"]
      },
      risk: {
        title: "Risk Zone",
        items: ["Soft-close hinges — cheap ones fail in 6 months of daily use, requiring full replacement."]
      }
    },
    standard: {
      lifespan: "15-20 Years",
      save: {
        title: "Where to Save",
        items: ["MDF carcasses with quality fronts", "Standard cabinet dimensions"]
      },
      risk: {
        title: "Risk Zone",
        items: ["Drawer runners and hinges. Cheap hardware fails within 2 years of daily use."]
      }
    },
    premium: {
      lifespan: "20-30 Years",
      save: {
        title: "Smart Savings",
        items: ["Internal organizers — modular systems match custom at half the price", "Handles — €50 handles look identical to €200 designer ones"]
      },
      risk: {
        title: "Diminishing Returns",
        items: ["Over-specifying hardware — €3000 hinges aren't 10x better than €300 quality Blum ones."]
      }
    }
  },
  "Wardrobes": {
    definition: "Built-in closet systems, sliding doors, internal organizers, and lighting.",
    budget: {
      lifespan: "8-12 Years",
      save: {
        title: "Where to Save",
        items: ["Hinged doors over sliding (simpler mechanism)", "Wire baskets instead of wooden drawers"]
      },
      risk: {
        title: "Risk Zone",
        items: ["Bottom-rolling sliding doors — they derail within months. Top-hung is essential even at budget."]
      }
    },
    standard: {
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
    premium: {
      lifespan: "20-25 Years",
      save: {
        title: "Smart Savings",
        items: ["LED strips over integrated lighting systems", "Modular internals allow future reconfiguration"]
      },
      risk: {
        title: "Diminishing Returns",
        items: ["Motorized systems — impressive but €2000+ repair bills when motors fail after warranty."]
      }
    }
  },
  "Appliances": {
    definition: "Kitchen appliances: hob, oven, extractor, refrigerator, dishwasher, and washer/dryer.",
    budget: {
      lifespan: "5-8 Years",
      save: {
        title: "Where to Save",
        items: ["Previous-year models (same specs, 30% less)", "Skip built-in for freestanding options"]
      },
      risk: {
        title: "Risk Zone",
        items: ["Energy ratings — A+ costs €150+ more annually than A+++ over its shorter lifespan."]
      }
    },
    standard: {
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
    premium: {
      lifespan: "12-15 Years",
      save: {
        title: "Smart Savings",
        items: ["Mid-range from premium brands beats top-range from budget brands", "Skip smart features — they're obsolete in 3 years"]
      },
      risk: {
        title: "Diminishing Returns",
        items: ["Professional-grade for home use — requires expensive servicing and wastes energy at domestic scale."]
      }
    }
  },
  "Furniture": {
    definition: "Freestanding pieces: sofas, dining tables, beds, chairs, and decorative items.",
    budget: {
      lifespan: "3-7 Years",
      save: {
        title: "Where to Save",
        items: ["Second-hand solid wood over new particleboard", "Slipcovers extend sofa life significantly"]
      },
      risk: {
        title: "Risk Zone",
        items: ["Cheap mattresses — poor sleep costs more in health than a decent mattress costs upfront."]
      }
    },
    standard: {
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
    premium: {
      lifespan: "15-25 Years",
      save: {
        title: "Smart Savings",
        items: ["Reupholstering vintage pieces costs less than new designer items", "Local craftsmen match Italian quality at 40% less"]
      },
      risk: {
        title: "Diminishing Returns",
        items: ["Designer name premiums — a €15,000 sofa isn't 5x better than a €3,000 quality piece."]
      }
    }
  },
  "Prep Work": {
    definition: "Demolition, waste removal, stripping old finishes, and preparing surfaces for new work.",
    budget: {
      lifespan: "One-time",
      save: {
        title: "Where to Save",
        items: ["DIY demolition of non-structural elements", "Batch waste disposal runs yourself"]
      },
      risk: {
        title: "Risk Zone",
        items: ["Asbestos or lead paint — skipping €200 tests can create €20,000 health hazards."]
      }
    },
    standard: {
      lifespan: "One-time",
      save: {
        title: "Where to Save",
        items: ["DIY demolition of non-structural elements", "Own waste disposal runs"]
      },
      risk: {
        title: "Risk Zone",
        items: ["Asbestos or lead paint assessment. Skipping tests can create serious health hazards."]
      }
    },
    premium: {
      lifespan: "One-time",
      save: {
        title: "Smart Savings",
        items: ["Retain original features worth restoring", "Selective demolition preserves character and reduces waste costs"]
      },
      risk: {
        title: "Diminishing Returns",
        items: ["Full strip-outs — sometimes original bones are better than what replaces them."]
      }
    }
  }
};

interface CostInsightSheetProps {
  isOpen: boolean;
  onClose: () => void;
  category: string;
  tier: "budget" | "standard" | "premium";
}

export const CostInsightSheet = ({ isOpen, onClose, category, tier }: CostInsightSheetProps) => {
  const isMobile = useIsMobile();
  const insight = categoryInsights[category];

  if (!insight) return null;

  const tierContent = insight[tier];

  const tierConfig = {
    budget: { label: "Budget", className: "bg-stone-200 text-stone-600" },
    standard: { label: "Standard", className: "bg-stone-300 text-stone-700" },
    premium: { label: "Premium", className: "bg-stone-800 text-stone-100" }
  };

  const content = (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <h2 className="font-serif text-2xl text-stone-900">{category}</h2>
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full uppercase tracking-wide ${tierConfig[tier].className}`}>
            {tierConfig[tier].label}
          </span>
        </div>
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
        <span>Lifespan: {tierContent.lifespan}</span>
      </div>

      {/* Strategy Blocks */}
      <div className={`grid gap-3 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
        {/* Save Block */}
        <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-stone-100 flex items-center justify-center">
              <Check size={14} className="text-stone-600" />
            </div>
            <span className="font-medium text-stone-900 text-sm">{tierContent.save.title}</span>
          </div>
          <ul className="space-y-2">
            {tierContent.save.items.map((item, idx) => (
              <li key={idx} className="text-stone-600 text-sm leading-relaxed">
                • {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Risk Block */}
        <div className="bg-stone-100 border border-stone-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-stone-200 flex items-center justify-center">
              <AlertTriangle size={14} className="text-stone-700" />
            </div>
            <span className="font-medium text-stone-900 text-sm">{tierContent.risk.title}</span>
          </div>
          <ul className="space-y-2">
            {tierContent.risk.items.map((item, idx) => (
              <li key={idx} className="text-stone-600 text-sm leading-relaxed">
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
