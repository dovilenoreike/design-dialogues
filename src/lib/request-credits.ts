import { supabase } from "@/integrations/supabase/client";
import { captureError } from "@/lib/sentry";

export async function requestMoreCredits(
  userId: string,
  email: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke("request-credits", {
      body: { userId, email },
    });

    if (error) {
      captureError(error, {
        action: "requestMoreCredits",
        edgeFunction: "request-credits",
      });
      throw new Error(error.message || "Failed to submit request");
    }

    if (data?.error) {
      throw new Error(data.error);
    }

    return { success: true };
  } catch (error) {
    captureError(error, {
      action: "requestMoreCredits",
      edgeFunction: "request-credits",
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
