import { supabase } from "@/integrations/supabase/client";

type EmailType = "partner" | "feedback" | "designer-inquiry" | "material-request";

export async function sendEmail(type: EmailType, data: Record<string, unknown>) {
  const { data: result, error } = await supabase.functions.invoke("send-email", {
    body: { type, data },
  });

  if (error) {
    throw new Error(error.message);
  }

  return result;
}
