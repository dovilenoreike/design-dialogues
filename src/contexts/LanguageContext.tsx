import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Language = "en" | "lt";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Translation dictionaries
const translations: Record<Language, Record<string, string>> = {
  en: {
    // Header
    "nav.howItWorks": "How it Works",
    "nav.mission": "The Mission",
    "nav.partner": "Partner with Us",
    "nav.calculator": "Calculator",
    "header.credits": "Credits",
    
    // Landing page
    "landing.title": "Design Dialogues",
    "landing.subtitle": "Upload your space. Discover your style.",
    "landing.uploadHint": "Drop your room here",
    "landing.uploadHelper": "Photo, sketch, or floor plan",
    "landing.roomTypeDisabled": "Select room type (after upload)",
    "landing.roomTypeActive": "What room is this?",
    "landing.estimateBudget": "Estimate budget only",
    
    // Space categories
    "space.kitchen": "Kitchen",
    "space.livingRoom": "Living Room",
    "space.bedroom": "Bedroom",
    "space.bathroom": "Bathroom",
    "space.office": "Office",
    "space.hallway": "Hallway",
    
    // Design Matrix
    "matrix.title": "The Design Matrix",
    "matrix.materialPalette": "Material Palette",
    "matrix.designerCollections": "Designer Collections",
    "matrix.createYourOwn": "Create Your Own",
    "matrix.describeMaterials": "Describe your ideal materials...",
    "matrix.styleCheckbox": "I want to try a specific style",
    "matrix.architecturalStyle": "Architectural Style",
    "matrix.generateDesign": "Generate Design",
    
    // Result Dashboard
    "result.title": "Project Passport",
    "result.conservativeEstimate": "Conservative estimate incl. 15% market buffer",
    "result.shell": "Shell",
    "result.joinery": "Joinery",
    "result.technics": "Technics",
    "result.adjustParameters": "Adjust Parameters & Breakdown",
    "result.dimensions": "Dimensions",
    "result.totalArea": "Total Area",
    "result.kitchenLength": "Kitchen Length",
    "result.wardrobeLength": "Wardrobe Length",
    "result.conditions": "Conditions",
    "result.renovationRequired": "Renovation Required",
    "result.services": "Services",
    "result.costBreakdown": "Cost Breakdown",
    "result.disclaimer": "All figures are preliminary estimates based on typical project costs",
    "result.visualizeSpace": "Visualize Your Space",
    "result.tryAnother": "Try Another Version",
    "result.changeStyle": "Change Style",
    "result.startFresh": "Start Fresh",
    "result.materialManifest": "Material Manifest",
    "result.curatedBy": "Curated by",
    "result.requestCurated": "Request Curated Material List",
    "result.visualizationDisclaimer": "Conceptual visualization — actual spaces and materials may vary",
    
    // Tiers
    "tier.budget": "Budget",
    "tier.standard": "Standard",
    "tier.premium": "Premium",
    "tier.budgetDesc": "Smart choices for practical living",
    "tier.standardDesc": "Quality materials with lasting value",
    "tier.premiumDesc": "Exceptional finishes for discerning taste",
    
    // Services
    "service.spacePlanning": "Space Planning",
    "service.interiorFinishes": "Interior Finishes",
    "service.furnishingDecor": "Furnishing & Decor",
    
    // Cost categories
    "cost.interiorDesign": "Interior Design",
    "cost.constructionFinish": "Construction & Finish",
    "cost.materials": "Materials",
    "cost.kitchen": "Kitchen",
    "cost.wardrobes": "Wardrobes",
    "cost.appliances": "Appliances",
    "cost.furniture": "Furniture",
    "cost.renovationPrep": "Renovation Prep",
    "cost.projectShell": "PROJECT & SHELL",
    "cost.fixedJoinery": "FIXED JOINERY",
    "cost.movablesTech": "MOVABLES & TECH",
    
    // Processing
    "processing.title": "Crafting Your Vision",
    "processing.generating": "Generating your personalized design...",
    "processing.refineQuote": "Refine Your Quote",
    
    // Footer
    "footer.copyright": "Design Dialogues",
    "footer.allRights": "All rights reserved.",
    
    // How it Works
    "howItWorks.title": "How it Works",
    "howItWorks.subtitle": "Three simple steps to visualize your dream space",
    "howItWorks.step1Title": "Upload Your Space",
    "howItWorks.step1Desc": "Share a photo, sketch, or floor plan of your room",
    "howItWorks.step2Title": "Choose Your Style",
    "howItWorks.step2Desc": "Select materials and architectural direction",
    "howItWorks.step3Title": "Get Your Vision",
    "howItWorks.step3Desc": "Receive AI visualization and detailed cost estimate",
    "howItWorks.cta": "Start Designing",
    
    // Mission
    "mission.title": "The Mission",
    "mission.subtitle": "Democratizing design, one space at a time",
    
    // Partner
    "partner.title": "Partner with Us",
    "partner.subtitle": "Join our network of design professionals",
    "partner.name": "Name",
    "partner.website": "Company Website",
    "partner.profession": "Profession",
    "partner.email": "Email",
    "partner.submit": "Request Partnership",
    "partner.architect": "Architect",
    "partner.designer": "Interior Designer",
    "partner.supplier": "Material Supplier",
    
    // Designer Profile
    "designer.workWithMe": "Work with Me",
    "designer.sendInquiry": "Send Project Inquiry",
    "designer.myCollections": "My Collections",
  },
  lt: {
    // Header
    "nav.howItWorks": "Kaip tai veikia",
    "nav.mission": "Misija",
    "nav.partner": "Bendradarbiaukite",
    "nav.calculator": "Skaičiuoklė",
    "header.credits": "Kreditai",
    
    // Landing page
    "landing.title": "Design Dialogues",
    "landing.subtitle": "Įkelkite savo erdvę. Atraskite savo stilių.",
    "landing.uploadHint": "Įkelkite kambario nuotrauką",
    "landing.uploadHelper": "Nuotrauka, eskizas arba planas",
    "landing.roomTypeDisabled": "Pasirinkite kambario tipą (po įkėlimo)",
    "landing.roomTypeActive": "Koks tai kambarys?",
    "landing.estimateBudget": "Tik biudžeto skaičiavimas",
    
    // Space categories
    "space.kitchen": "Virtuvė",
    "space.livingRoom": "Svetainė",
    "space.bedroom": "Miegamasis",
    "space.bathroom": "Vonios kambarys",
    "space.office": "Biuras",
    "space.hallway": "Prieškambaris",
    
    // Design Matrix
    "matrix.title": "Dizaino Matrica",
    "matrix.materialPalette": "Medžiagų Paletė",
    "matrix.designerCollections": "Dizainerių Kolekcijos",
    "matrix.createYourOwn": "Sukurkite Savo",
    "matrix.describeMaterials": "Aprašykite norimas medžiagas...",
    "matrix.styleCheckbox": "Noriu išbandyti konkretų stilių",
    "matrix.architecturalStyle": "Architektūrinis Stilius",
    "matrix.generateDesign": "Generuoti Dizainą",
    
    // Result Dashboard
    "result.title": "Projekto Pasas",
    "result.conservativeEstimate": "Konservatyvus įvertinimas su 15% rinkos rezervu",
    "result.shell": "Apdaila",
    "result.joinery": "Baldai",
    "result.technics": "Technika",
    "result.adjustParameters": "Koreguoti Parametrus",
    "result.dimensions": "Matmenys",
    "result.totalArea": "Bendras Plotas",
    "result.kitchenLength": "Virtuvės Ilgis",
    "result.wardrobeLength": "Spintų Ilgis",
    "result.conditions": "Sąlygos",
    "result.renovationRequired": "Reikalinga Renovacija",
    "result.services": "Paslaugos",
    "result.costBreakdown": "Kainos Struktūra",
    "result.disclaimer": "Visos sumos yra preliminarios sąmatos remiantis tipinėmis projekto kainomis",
    "result.visualizeSpace": "Vizualizuoti Erdvę",
    "result.tryAnother": "Bandyti Kitą Versiją",
    "result.changeStyle": "Keisti Stilių",
    "result.startFresh": "Pradėti Iš Naujo",
    "result.materialManifest": "Medžiagų Sąrašas",
    "result.curatedBy": "Kuruoja",
    "result.requestCurated": "Užsakyti Medžiagų Sąrašą",
    "result.visualizationDisclaimer": "Konceptuali vizualizacija — tikros erdvės ir medžiagos gali skirtis",
    
    // Tiers
    "tier.budget": "Ekonominis",
    "tier.standard": "Standartinis",
    "tier.premium": "Premium",
    "tier.budgetDesc": "Protingi sprendimai praktiškai gyvensenai",
    "tier.standardDesc": "Kokybiškos medžiagos su ilgalaike verte",
    "tier.premiumDesc": "Išskirtinė apdaila išrankiam skoniui",
    
    // Services
    "service.spacePlanning": "Erdvės Planavimas",
    "service.interiorFinishes": "Interjero Apdaila",
    "service.furnishingDecor": "Baldai ir Dekoras",
    
    // Cost categories
    "cost.interiorDesign": "Interjero Dizainas",
    "cost.constructionFinish": "Statybos ir Apdaila",
    "cost.materials": "Medžiagos",
    "cost.kitchen": "Virtuvė",
    "cost.wardrobes": "Spintos",
    "cost.appliances": "Buitinė Technika",
    "cost.furniture": "Baldai",
    "cost.renovationPrep": "Renovacijos Paruošimas",
    "cost.projectShell": "PROJEKTAS IR APDAILA",
    "cost.fixedJoinery": "ĮMONTUOTI BALDAI",
    "cost.movablesTech": "BALDAI IR TECHNIKA",
    
    // Processing
    "processing.title": "Kuriame Jūsų Viziją",
    "processing.generating": "Generuojamas jūsų personalizuotas dizainas...",
    "processing.refineQuote": "Patikslinti Kainą",
    
    // Footer
    "footer.copyright": "Design Dialogues",
    "footer.allRights": "Visos teisės saugomos.",
    
    // How it Works
    "howItWorks.title": "Kaip tai Veikia",
    "howItWorks.subtitle": "Trys paprasti žingsniai vizualizuoti svajonių erdvę",
    "howItWorks.step1Title": "Įkelkite Erdvę",
    "howItWorks.step1Desc": "Pasidalinkite nuotrauka, eskizu ar planu",
    "howItWorks.step2Title": "Pasirinkite Stilių",
    "howItWorks.step2Desc": "Išsirinkite medžiagas ir architektūrinę kryptį",
    "howItWorks.step3Title": "Gaukite Viziją",
    "howItWorks.step3Desc": "Gaukite AI vizualizaciją ir detalią kainų sąmatą",
    "howItWorks.cta": "Pradėti Kurti",
    
    // Mission
    "mission.title": "Misija",
    "mission.subtitle": "Demokratizuojame dizainą, po vieną erdvę",
    
    // Partner
    "partner.title": "Bendradarbiaukite",
    "partner.subtitle": "Prisijunkite prie mūsų dizaino profesionalų tinklo",
    "partner.name": "Vardas",
    "partner.website": "Įmonės Svetainė",
    "partner.profession": "Profesija",
    "partner.email": "El. paštas",
    "partner.submit": "Pateikti Paraišką",
    "partner.architect": "Architektas",
    "partner.designer": "Interjero Dizaineris",
    "partner.supplier": "Medžiagų Tiekėjas",
    
    // Designer Profile
    "designer.workWithMe": "Dirbkime Kartu",
    "designer.sendInquiry": "Siųsti Užklausą",
    "designer.myCollections": "Mano Kolekcijos",
  },
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem("language");
    return (saved as Language) || "en";
  });

  useEffect(() => {
    localStorage.setItem("language", language);
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
