import type { DesignerProfile } from "@/types/palette";

const ALL_STYLES = [
  "minimalist",
  "organic",
  "classic",
  "industrial",
];

export const designers: Record<string, DesignerProfile> = {
  "heya_studio": {
    name: "HEYA Studio",
    title: "Interjero dizaino studija",
    bio: "Gyvenamųjų ir komercinių erdvių projektavimas. Interjero techniniai brėžiniai, online konsultacijos, vizualizacijos.",
    styles: ["minimalist", "organic", "industrial"],
    cities:["klaipeda"],
    email: "hello@heyastudio.com",
    instagram: "_heya_studio",
  },
  "athena_blackbird": {
    name: "Athena Blackbird",
    title: "Interior Architect",
    bio: "I strive to design spaces that feel elevated, are functional and remain timeless - thus creating exceptional living experiences",
    styles: ALL_STYLES,
    cities:["klaipeda"],
    email: "athenablackbird@gmail.com",
    instagram: "athenablackbird",
    website: "https://athenablackbird.com",
    
  },
  "gn_interiordesign": {
    name: "GN Interior Design",
    title: "Interjero dizaino studija",
    bio: "Trokštam kurti novatoriškus, funckionalius, bei akį traukiančius interjerus, su didžiule aistra dizaino ekspedicijai suteikti lengvumo ir aiškumo užsakovams.",
    styles: ALL_STYLES,
    cities:["klaipeda"],
    email: "gn.studija@gmail.com",
    website: "https://gninteriordesign.lt/",
    instagram: "gn_interiordesign",
  },
  "impeka": {
    name: "Impeka komanda",
    title: "Baldų plokčių ir rankenų tiekėjai",
    bio: "Esame profesionalų komanda. Jau 20 metų tiekiame  rinkai baldines medžiagas, laminuotas grindis bei priedus joms.",
    styles: ALL_STYLES,
    cities:["vilnius","kaunas","klaipeda"],
    instagram: "impeka_home",
    website: "https://www.impeka.lt/",
  },
  "design-dialogues": {
    name: "Dizaino Dialogai",
    title: "Interjero dizaino platforma",
    bio: "Sukurta, kad padėtų Jums kurti nuostabias erdves.",
    styles: ALL_STYLES,
    cities:[],
    instagram: "dizainodialogai",
    website: "https://www.dizainodialogai.lt/",
  },
  "dizaino_dialogai": {
    name: "Dizaino Dialogai",
    title: "Dizaino Platforma",
    bio: "Sukurta, kad padėtų Jums kurti nuostabias erdves.",
    styles: ALL_STYLES,
    cities:[],
    instagram: "dizainodialogai",
    website: "https://www.dizainodialogai.lt/",
  },
};

export function getDesignerByName(name: string): DesignerProfile | undefined {
  return designers[name];
}

export function getDesignerWithFallback(name: string, title: string): DesignerProfile {
  if (designers[name]) {
    return designers[name];
  }

  // Format the name by removing underscores and hyphens, capitalizing words
  const formattedName = name
    .replace(/[_-]/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return {
    name: formattedName,
    title,
    bio: "Interior designer passionate about creating beautiful, functional spaces.",
    styles: ALL_STYLES,
  };
}
