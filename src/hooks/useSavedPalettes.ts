import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

const LS_KEY = "saved-palettes";
const MAX_SAVES = 5;

export interface SavedPalette {
  id: string;
  savedAt: number;
  materials: Record<string, string>;
  roomCategory: string | null;
  showroomId: string | null;
}

function readFromStorage(): SavedPalette[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as SavedPalette[]) : [];
  } catch {
    return [];
  }
}

function writeToStorage(palettes: SavedPalette[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(palettes));
  } catch {}
}

function snapshotKey(materials: Record<string, string>): string {
  return Object.entries(materials)
    .filter(([, v]) => !!v)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}:${v}`)
    .join("|");
}

export function useSavedPalettes() {
  const [savedPalettes, setSavedPalettes] = useState<SavedPalette[]>(readFromStorage);

  const isSaved = useCallback(
    (materials: Record<string, string>): boolean => {
      const key = snapshotKey(materials);
      return savedPalettes.some((p) => snapshotKey(p.materials) === key);
    },
    [savedPalettes],
  );

  const savePalette = useCallback(
    (
      materials: Record<string, string>,
      roomCategory: string | null,
      showroomId: string | null,
    ) => {
      const id = crypto.randomUUID();
      const newPalette: SavedPalette = {
        id,
        savedAt: Date.now(),
        materials,
        roomCategory,
        showroomId,
      };
      const updated = [newPalette, ...savedPalettes].slice(0, MAX_SAVES);
      setSavedPalettes(updated);
      writeToStorage(updated);

      // Analytics insert
      /* eslint-disable @typescript-eslint/no-explicit-any */
      (supabase as any).from("saved_palettes").insert({
        id,
        created_at: new Date().toISOString(),
        showroom_id: showroomId,
        room_category: roomCategory,
        materials,
      }).then(({ error }: { error: unknown }) => {
        if (error) console.error("[saved_palettes] insert failed:", error);
        else console.log("[saved_palettes] inserted", id);
      });
      /* eslint-enable @typescript-eslint/no-explicit-any */
    },
    [savedPalettes],
  );

  const unsavePalette = useCallback(
    (id: string) => {
      const updated = savedPalettes.filter((p) => p.id !== id);
      setSavedPalettes(updated);
      writeToStorage(updated);
    },
    [savedPalettes],
  );

  return { savedPalettes, isSaved, savePalette, unsavePalette };
}
