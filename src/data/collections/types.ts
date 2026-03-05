import type { SurfaceCategory } from "@/data/materials/types";

export interface Collection {
  id: string;
  name: string;
  promptBase: string;
  pool: Partial<Record<SurfaceCategory, string[]>>;
  thumbnail: string;
}
