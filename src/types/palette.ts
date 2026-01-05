export interface MaterialPurpose {
  default: string;
  kitchen?: string;
  bathroom?: string;
  bedroom?: string;
  livingRoom?: string;
  other?: string;
}

export interface Material {
  description: string;
  rooms: string[];
  purpose: MaterialPurpose;
}

export interface DesignerProfile {
  name: string;
  title: string;
  bio: string;
  email?: string;
  instagram?: string;
  website?: string;
}

export interface Palette {
  id: string;
  name: string;
  temp: string;
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
