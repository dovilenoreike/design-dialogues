import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export type CollectionPreset = {
  id: string;
  name: { en: string; lt: string };
  designer: string | null;
  vibe: string | null;
  room_category: string | null;
  image_url: string | null;
  /** slot_key → technical_code, e.g. { floor: "solido-bolsena", bottomCabinets: "velvet-7393" } */
  materials: Record<string, string>;
};

export function useCollectionPresets(roomCategory?: string | null) {
  const [presets, setPresets] = useState<CollectionPreset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query = (supabase as any)
        .from("collection_presets")
        .select("*")
        .order("id");

      if (roomCategory) {
        query = query.ilike("room_category", roomCategory);
      }

      const { data, error } = await query;
      if (!cancelled) {
        if (!error && data) setPresets(data as CollectionPreset[]);
        setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [roomCategory]);

  return { presets, loading };
}
