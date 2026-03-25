import type { LocalizedString } from "@/data/materials/types";
export type { LocalizedString };

export interface MaterialPurpose {
  default: string;
  kitchen?: string;
  bathroom?: string;
  bedroom?: string;
  livingRoom?: string;
  other?: string;
}

export interface Material {
  description: string | LocalizedString;
  rooms: string[];
  purpose: MaterialPurpose;
  materialType?: string;
  technicalCode?: string;
  includeInPrompt?: boolean; // defaults to true if omitted
  showroomIds?: string[]; // IDs of showrooms that carry this material
}

export type { DesignerProfile } from "@/data/designers/types";
import type { DesignerProfile } from "@/data/designers/types";

export interface Palette {
  id: string;
  name: string;
  designer: string;
  designerTitle: string;
  designerProfile?: DesignerProfile;
  promptSnippet: string;
  materials: Record<string, Material>;
  status?: "available" | "coming-soon";
}

export type RoomCategory =
  | "kitchen"
  | "bathroom"
  | "bedroom"
  | "livingRoom"
  | "other"
  | "all";
