import { supabase } from "@/integrations/supabase/client";
import type { Tier } from "@/contexts/DesignContext";

export async function joinPaletteWaitlist(
  paletteId: string,
  email: string,
  budgetTier: Tier,
  name?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke(
      "palette-waitlist-signup",
      { body: { paletteId, email, name, budgetTier } }
    );

    if (error) {
      throw new Error(error.message || "Failed to join waitlist");
    }

    if (data?.error) {
      throw new Error(data.error);
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}
