export interface MaterialPurpose {
  default: string;
  kitchen?: string;
  bathroom?: string;
  bedroom?: string;
  livingRoom?: string;
  other?: string;
}

export interface LocalizedString {
  en: string;
  lt: string;
}

export interface Material {
  description: string | LocalizedString;
  rooms: string[];
  purpose: MaterialPurpose;
  materialType?: string;
  technicalCode?: string;
  includeInPrompt?: boolean; // defaults to true if omitted
}

export interface DesignerProfile {
  name: string;
  title: string;
  bio: string;
  styles: string[];
  cities?: string[];
  email?: string;
  instagram?: string;
  website?: string;
}

export interface Palette {
  id: string;
  name: string;
  designer: string;
  designerTitle: string;
  designerProfile?: DesignerProfile;
  promptSnippet: string;
  materials: Record<string, Material>;
}

export type RoomCategory =
  | "kitchen"
  | "bathroom"
  | "bedroom"
  | "livingRoom"
  | "other"
  | "all";
