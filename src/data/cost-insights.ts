/**
 * Cost insight data for each category and tier
 * Used by CostInsightSheet to display detailed breakdowns
 */

export interface TierSpecificContent {
  lifespan: string;
  save: { title: string; items: string[] };
  risk: { title: string; items: string[] };
}

export interface CategoryInsight {
  definition: string;
  budget: TierSpecificContent;
  standard: TierSpecificContent;
  premium: TierSpecificContent;
}

export const categoryInsights: Record<string, CategoryInsight> = {
  "Interior Design": {
    definition: "Professional space planning, with material and furniture selection tailored to your chosen project scope.",
    budget: {
      lifespan: "Basic Value",
      save: {
        title: "Where to Save",
        items: ["Standard layouts","Limited revisions (1-2 rounds)", "Standartizet material selections"]
      },
      risk: {
        title: "Risk Zone",
        items: ["Insufficient planning — leads to costly changes during construction and dissatisfaction later."]
      }
    },
    standard: {
      lifespan: "Permanent Value",
      save: {
        title: "Where to Save",
        items: ["Know your must-haves early", "Find designer matching your style", "Limit major layout changes after initial design"]
      },
      risk: {
        title: "Risk Zone",
        items: ["Skipping design phases — rushing to construction without thorough planning often leads to costly mistakes."]
      }
    },
    premium: {
      lifespan: "Lasting Legacy",
      save: {
        title: "Smart Savings",
        items: ["Clear vision and priorities from the start", "Trust experienced designers to guide decisions", "Focus on quality over quantity in selections"]
      },
      risk: {
        title: "Diminishing Returns",
        items: ["Over-customization — excessive bespoke elements can inflate costs without proportional value increase.", "Constant revisions — frequent changes drain budget and delay timelines."]
      }
    }
  },
  "Construction & Finish": {
    definition: "The 'wet' work: smoothing walls, painting, tiling, and floor installation.",
    budget: {
      lifespan: "5-10 Years",
      save: {
        title: "Smart Savings",
        items: ["Standard tile sizes 60x60, not large slabs or mosaics (higher labor).",
          "Surface-mounted plumbing/electrical avoids expensive wall chasing."]
      },
      risk: {
        title: "The 'Quick Fix'",
        items: ["Rushing plaster drying. Painting over damp plaster causes peeling in <1 year.",
          "Skipping waterproofing in bathrooms. Leads to mold and leaks, regardless of tile price."]
      }
    },
    standard: {
      lifespan: "15+ Years",
      save: {
        title: "Smart Choices",
        items: ["Simple layouts. Avoid 45° flooring angles to reduce waste and labor hours.", "Quality paint over expensive wall panels."]
      },
      risk: {
        title: "The 'Blame Game'",
        items: ["Fragmented hiring. Without a Lead Contractor, the tiler blames the plumber for uneven walls.",
          "Skipping leveling. New floors on uneven concrete will creak and break locks."]
      }
    },
    premium: {
      lifespan: "25+ Years",
      save: {
        title: "Strategic Efficiency",
        items: ["Standard drywall, premium plaster finish. Invest in skill, not just material.",
          "Zone-controlled underfloor heating prioritizes comfort over complex aesthetic systems."]
      },
      risk: {
        title: "Precision & Physics",
        items: ["Geometry. Shadow gaps require 90° perfect walls; slight errors look terrible.",
          "Over-specifying materials. Ultra-premium tiles and paints have minimal visible difference at high-end."]
      }
    }
  },
  "Materials": {
    definition: "All surface finishes: flooring, tiles, paint, wallcoverings, and decorative elements.",
    budget: {
      lifespan: "5-10 Years",
      save: {
        title: "Smart Savings",
        items: ["Glued Vinyl plank. 100% waterproof, quieter, and more resilient than cheap laminate.",
          "Ceramic wall tiles. Cheaper than porcelain, identical look on walls."]
      },
      risk: {
        title: "Premature Wear",
        items: [ "Paper-foil doors. Cheapest 'wood look' doors scratch and peel instantly. Aim for CPL coating.",
          "White grout on floors. Turns grey/dirty in weeks. Always choose a matching grey or beige."]
      }
    },
    standard: {
      lifespan: "10-20 Years",
      save: {
        title: "Smart Choices",
        items: ["Porcelain over Natural Stone. Identical look to marble/travertine but stain-proof, no sealing.",
          "MDF skirting. More stable than wood, paints smoother, and doesn't warp."]
      },
      risk: {
        title: "Functionality Compromise",
        items: ["Hollow-core doors. Feel light, block zero sound. Upgrade to 'Solid Core' for privacy.",
          "Matte paint in hallways. Scuffs instantly. Use 'Washable/Eggshell' in high-traffic zones."]
      }
    },
    premium: {
      lifespan: "15-25 Years",
      save: {
        title: "Strategic Choices",
        items: ["Engineered Wood over Solid. More stable with underfloor heating, resists warping/gaps.",
          "'Character' Grade Wood. Natural knots add texture; often cheaper than 'Select' clean grade."]
      },
      risk: {
        title: "Maintenance & Damage",
        items: ["Natural Marble in Showers. Absorbs soap scum, hard water stains. Requires constant resealing.",
          "Very Dark Floors. Show every dust particle and micro-scratch. Requires daily cleaning."]
      }
    }
  },
  "Kitchen": {
    definition: "Integrated cabinetry, worktops, and internal drawer/door systems.",
    budget: {
      lifespan: "5-10 Years",
      save: {
        title: "Smart Savings",
        items: ["Melamine (LMDP) cabinets. Durable, easy to clean, cost-effective.",
          "Standard HPL worktops. Wide range of styles, highly resistant to scratches and heat."]
      },
      risk: {
        title: "Heat & Wear",
        items: ["Thermofoil doors near oven. Heat causes plastic coating to bubble and peel within 3 years.",
          "Unbranded drawer runners. Sag and break under daily use, making drawers unusable."]
      }
    },
    standard: {
      lifespan: "15-20 Years",
      save: {
        title: "Smart Choices",
        items: ["Painted MDF cabinets. Offers custom colors and a seamless look, less prone to heat issues.",
          "Fewer drawers, better hinges. Invest in quality Blum/Hettich hinges, use shelves for less-used items."]
      },
      risk: {
        title: "Water Damage",
        items: ["Exposed chipboard edges. Unsealed edges of cabinets/worktops swell instantly with water splashes.",
          "Cheap sinks. Prone to dents, scratches, and transmit dishwasher/water noise."]
      }
    },
    premium: {
      lifespan: "20-30 Years",
      save: {
        title: "Strategic Efficiency",
        items: ["Standard internal cabinet boxes. Focus budget on custom facades and hardware.",
          "Integrated bins/organizers. Improve daily function more than exotic materials."]
      },
      risk: {
        title: "Misplaced Luxury",
        items: ["Exotic wood veneers. Prone to staining, scratching, and require delicate cleaning.",
          "Overly thick worktops. Adds weight and cost with no functional benefit."]
      }
    }
  },
  "Wardrobes": {
    definition: "Built-in closet systems, sliding doors, internal organizers.",
    budget: {
      lifespan: "5-10 Years",
      save: {
        title: "Smart Savings",
        items: ["Simple internal layouts. Focus on shelves and hanging rails (standard sizes).",
          "Standard door sizes. Avoid custom heights/widths to save on manufacturing and installation."]
      },
      risk: {
        title: "Daily Frustration",
        items: ["Cheap sliding door tracks. Warp, jam, and make loud noise within months.",
          "Exposed hanging rails. Looks untidy and allows clothes to gather dust quickly."]
      }
    },
    standard: {
      lifespan: "15-20 Years",
      save: {
        title: "Smart Choices",
        items: ["Standard panel colors for interiors. Focus budget on external facades and hardware.",
          "Good quality hinges/soft-close mechanisms. Invest in daily function over aesthetics."]
      },
      risk: {
        title: "Premature Failure",
        items: ["Budget drawer runners. Sag and fail quickly under weight. Clothes get stuck.",
          "Non-soft-close doors. Slamming doors lead to wear and tear, and constant noise."]
      }
    },
    premium: {
      lifespan: "20-25 Years",
      save: {
        title: "Strategic Efficiency",
        items: ["Standard back panels. Spend on internal lighting and specific organizers (e.g., tie racks).",
          "Optimal ventilation. Prevents mold and musty smells in shoe storage."]
      },
      risk: {
        title: "Detail Degradation",
        items: ["Ultra-thin doors. Feel flimsy and show warping over time.",
          "Over-complicated organizers. Often unused and add unnecessary cost."]
      }
    }
  },
  "Appliances": {
    definition: "Major white goods: Refrigerator, cooking appliances, dishwasher, and laundry units.",
    budget: {
      lifespan: "5-8 Years",
      save: {
        title: "Smart Savings",
        items: ["Freestanding Fridge. Integrated models cost 30% more and have 20% less internal space.",
          "Basic Induction. Even entry-level induction performs better and is safer than electric ceramic."]
      },
      risk: {
        title: "Unreliable Performance",
        items: ["Energy ratings — A+ costs €150+ more annually than A+++ over its shorter lifespan."]
      }
    },
    standard: {
      lifespan: "10-15 Years",
      save: {
        title: "Smart Choices",
        items: ["Skip 'Smart' Features. Wi-Fi on ovens is rarely used. Pay for mechanics, not the app.",
          "Standard (60cm) Dishwasher. Slim (45cm) models cost the same but hold half the load and often clean worse."]
      },
      risk: {
        title: "The 'Combo' Trap",
        items: ["Washer-Dryer Combos. Cycles take 5+ hours, drying is often damp, and breakdown rates are high. Stack separate units if possible.",
          "Cheap Recirculating Hoods. Loud filters that just blow smells back into the room. Always duct out if possible."]
      }
    },
    premium: {
      lifespan: "12-15 Years",
      save: {
        title: "Strategic Efficiency",
        items: ["Entry-level Luxury. A base-model Miele cleans as well as the flagship; you pay extra for touchscreens, not performance.",
          "Separate Freezer. Buying a standalone freezer allows for a larger dedicated fridge in the kitchen."]
      },
      risk: {
        title: "Form over Function",
        items: ["Downdraft Hobs. While sleek, they struggle with tall pots compared to overhead extraction.",
          "Integrated Fridge Volume. Premium built-ins are deceptively small inside. Check 'Net Liters' before buying."]
      }
    }
  },
  "Furniture": {
    definition: "Movable items: sofas, dining tables, beds, chairs, and decorative pieces.",
    budget: {
      lifespan: "2-5 Years",
      save: {
        title: "Smart Savings",
        items: ["Accent pieces and decorative items. Easily replaced; budget for seasonal trends.",
          "Guest bedroom furniture. Less frequent use, allows for cost-effective choices."]
      },
      risk: {
        title: "Daily Discomfort",
        items: ["Daily-use sofa. Cheap frames sag, cushions flatten, losing support in <2 years.",
          "Flimsy dining chairs. Wobble, creak, and break with regular use."
]
      }
    },
    standard: {
      lifespan: "5-15 Years",
      save: {
        title: "Smart Choices",
        items: ["Local manufacturers. Often offer better value and quality than unknown foreign brands.",
          "Quality synthetic fabrics. More durable and cleanable than budget natural materials."]
      },
      risk: {
        title: "Durability Blind Spots",
        items: ["Buying online without testing. Comfort is subjective; sofa feels different in person.",
          "Flimsy bed frames. Lead to squeaking, sagging, and poor sleep over time."]
      }
    },
    premium: {
      lifespan: "15-25 Years",
      save: {
        title: "Strategic Choices",
        items: ["High-grade synthetic blends for upholstery. Offer luxury look with superior durability to silk/velvet.",
          "Focus on frame quality. An expensive sofa is an investment in its structure."]
      },
      risk: {
        title: "Misplaced Investment",
        items: ["Delicate designer pieces in high-traffic areas. Not suitable for kids/pets; get damaged easily.",
          "Untested comfort. Expensive bespoke pieces should be experienced before commissioning."]
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

/**
 * Tier badge configuration for display
 */
export const tierConfig = {
  budget: {
    label: "BUDGET",
    className: "bg-surface-muted text-text-secondary text-[10px] uppercase tracking-widest"
  },
  standard: {
    label: "STANDARD",
    className: "border border-ds-border-strong bg-transparent text-text-secondary text-[10px] uppercase tracking-widest"
  },
  premium: {
    label: "PREMIUM",
    className: "bg-interactive text-background text-[10px] uppercase tracking-widest"
  }
} as const;
