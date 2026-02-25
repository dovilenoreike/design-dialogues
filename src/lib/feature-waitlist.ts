import { supabase } from "@/integrations/supabase/client";
import { captureError } from "@/lib/sentry";

export async function joinFeatureWaitlist(
  featureId: string,
  email: string,
  name?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke(
      "feature-waitlist-signup",
      { body: { featureId, email, name } }
    );

    if (error) {
      captureError(error, {
        action: "joinFeatureWaitlist",
        edgeFunction: "feature-waitlist-signup",
        featureId,
      });
      throw new Error(error.message || "Failed to join waitlist");
    }

    if (data?.error) {
      throw new Error(data.error);
    }

    return { success: true };
  } catch (error) {
    captureError(error, {
      action: "joinFeatureWaitlist",
      edgeFunction: "feature-waitlist-signup",
      featureId,
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}
