import type { Archetype } from "./types";
import type { MaterialRole } from "@/types/material-types";

export const archetypes: Archetype[] = [
  // ── Floor (2) ─────────────────────────────────────────────────────────────
  { id: "wood",  role: "floor", label: { en: "Wood",  lt: "Medis" }, value: "#c4a882" },
  { id: "stone", role: "floor", label: { en: "Stone", lt: "Akmuo" }, value: "#b0a898" },

  // ── Front / Cabinet Fronts (3) ────────────────────────────────────────────
  { id: "wood",     role: "front", label: { en: "Wood",     lt: "Medis"     }, value: "#b89870" },
  { id: "plain",    role: "front", label: { en: "Plain",    lt: "Lygūs"     }, value: "#bfbcb6" },
  { id: "metallic", role: "front", label: { en: "Metallic", lt: "Metališki" }, value: "#8c7055" },

  // ── Worktop (4) ───────────────────────────────────────────────────────────
  { id: "stone",    role: "worktop", label: { en: "Stone", lt: "Akmuo"   }, value: "#d8d4cc" },
  { id: "wood",     role: "worktop", label: { en: "Wood",  lt: "Medis"   }, value: "#c4a882" },
  { id: "plain",    role: "worktop", label: { en: "Plain", lt: "Lygūs"   }, value: "#d8d6d0" },
  { id: "metallic", role: "worktop", label: { en: "Metal", lt: "Metalas" }, value: "#b0b4bc" },

  // ── Accent (1) ────────────────────────────────────────────────────────────
  { id: "metallic", role: "accent", label: { en: "Metallic", lt: "Metaliniai" }, value: "#c0c4cc" },
];

export function getArchetypeById(id: string, role?: MaterialRole): Archetype | undefined {
  return archetypes.find((a) => a.id === id && (!role || a.role === role));
}

export function getArchetypesByRole(role: MaterialRole): Archetype[] {
  return archetypes.filter((a) => a.role === role);
}
