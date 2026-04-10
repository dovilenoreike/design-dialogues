import { supabase } from "@/integrations/supabase/client";
import { captureError } from "@/lib/sentry";

type EmailType = "partner" | "feedback" | "designer-inquiry" | "material-request" | "provider-inquiry";

export async function sendEmail(type: EmailType, data: Record<string, unknown>) {
  const { data: result, error } = await supabase.functions.invoke("send-email", {
    body: { type, data },
  });

  if (error) {
    // Extract the actual error message from the edge function response body
    let message = error.message;
    try {
      // FunctionsHttpError exposes the raw response on .context
      const body = await (error as unknown as { context: Response }).context?.json?.();
      if (body?.error) message = body.error;
    } catch {
      // ignore — fall back to generic message
    }

    captureError(new Error(message), {
      action: "sendEmail",
      edgeFunction: "send-email",
      emailType: type,
    });
    throw new Error(message);
  }

  return result;
}
