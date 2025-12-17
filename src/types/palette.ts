export interface MaterialPurpose {
  default: string;
  kitchen?: string;
  bathroom?: string;
  bedroom?: string;
  livingRoom?: string;
  office?: string;
}

export interface Material {
  rooms: string[];
  purpose: MaterialPurpose;
}

export interface Palette {
  id: string;
  name: string;
  temp: string;
  designer: string;
  designerTitle: string;
  promptSnippet: string;
  materials: Record<string, Material>;
}

export type RoomCategory = 
  | "kitchen" 
  | "bathroom" 
  | "bedroom" 
  | "livingRoom" 
  | "office" 
  | "all";
