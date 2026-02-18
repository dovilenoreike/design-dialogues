import { supabase } from "@/integrations/supabase/client";
import { captureError } from "@/lib/sentry";

type EmailType = "partner" | "feedback" | "designer-inquiry" | "material-request";

export async function sendEmail(type: EmailType, data: Record<string, unknown>) {
  try {
    const { data: result, error } = await supabase.functions.invoke("send-email", {
      body: { type, data },
    });

    if (error) {
      captureError(error, {
        action: "sendEmail",
        edgeFunction: "send-email",
        emailType: type,
      });
      throw new Error(error.message);
    }

    return result;
  } catch (err) {
    captureError(err, {
      action: "sendEmail",
      edgeFunction: "send-email",
      emailType: type,
    });
    throw err;
  }
}
