import { supabase } from "@/integrations/supabase/client";
import { captureError } from "@/lib/sentry";
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
      captureError(error, {
        action: "joinPaletteWaitlist",
        edgeFunction: "palette-waitlist-signup",
        paletteId,
      });
      throw new Error(error.message || "Failed to join waitlist");
    }

    if (data?.error) {
      throw new Error(data.error);
    }

    return { success: true };
  } catch (error) {
    captureError(error, {
      action: "joinPaletteWaitlist",
      edgeFunction: "palette-waitlist-signup",
      paletteId,
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}
