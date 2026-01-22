import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const RECIPIENT_EMAIL = Deno.env.get("RECIPIENT_EMAIL");
    if (!RECIPIENT_EMAIL) {
      throw new Error("RECIPIENT_EMAIL is not configured");
    }

    const resend = new Resend(RESEND_API_KEY);
    const { type, data } = await req.json();

    let subject: string;
    let html: string;

    switch (type) {
      case "partner":
        subject = `Partnership Request: ${data.profession} - ${data.name}`;
        html = `
          <h2>New Partnership Request</h2>
          <p><strong>Name:</strong> ${data.name}</p>
          <p><strong>Email:</strong> ${data.email}</p>
          <p><strong>Profession:</strong> ${data.profession}</p>
          <p><strong>Website:</strong> ${data.website}</p>
          ${data.message ? `<p><strong>Message:</strong> ${data.message}</p>` : ""}
        `;
        break;

      case "feedback":
        subject = `Feedback from ${data.email || "Anonymous"}`;
        html = `
          <h2>User Feedback</h2>
          <p><strong>Email:</strong> ${data.email || "Not provided"}</p>
          <p><strong>Feedback:</strong></p>
          <p>${data.feedback}</p>
        `;
        break;

      case "designer-inquiry":
        subject = `Project Inquiry for ${data.designerName}`;
        html = `
          <h2>New Project Inquiry</h2>
          <p><strong>Designer:</strong> ${data.designerName}</p>
          <p><strong>From:</strong> ${data.name} (${data.email})</p>
          <p><strong>Project Details:</strong></p>
          <p>${data.project}</p>
        `;
        break;

      case "material-request":
        subject = `Material List Request from ${data.name}`;
        html = `
          <h2>Curated Material List Request</h2>
          <p><strong>Name:</strong> ${data.name}</p>
          <p><strong>Email:</strong> ${data.email}</p>
          <p><strong>Budget Tier:</strong> ${data.selectedTier || "Not specified"}</p>
          ${data.freestyleDescription ? `<p><strong>Design Vision:</strong> ${data.freestyleDescription}</p>` : ""}
          ${data.preferences ? `<p><strong>Additional Preferences:</strong> ${data.preferences}</p>` : ""}
        `;
        break;

      default:
        throw new Error("Unknown email type");
    }

    // Determine recipient based on email type
    let toEmail: string;
    if (type === "designer-inquiry" && data.designerEmail) {
      toEmail = data.designerEmail; // Send directly to designer
    } else {
      toEmail = RECIPIENT_EMAIL; // General business email
    }

    console.log(`Sending ${type} email to: ${toEmail}`);

    const { error } = await resend.emails.send({
      from: "Design Dialogues <onboarding@resend.dev>", // Update to your verified domain
      to: [toEmail],
      subject,
      html,
      reply_to: data.email || undefined,
    });

    if (error) {
      console.error("Resend error:", error);
      throw error;
    }

    console.log("Email sent successfully");

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error sending email:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to send email" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
