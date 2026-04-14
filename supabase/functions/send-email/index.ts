import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { captureException } from "../_shared/sentry.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Parse request body early so it's available in catch block
  let type = "unknown";
  let data: Record<string, unknown> = {};

  try {
    const body = await req.json();
    type = body.type || "unknown";
    data = body.data || {};

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const RECIPIENT_EMAIL = Deno.env.get("RECIPIENT_EMAIL");
    if (!RECIPIENT_EMAIL) {
      throw new Error("RECIPIENT_EMAIL is not configured");
    }

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
          <p><strong>Designer Email:</strong> ${data.designerEmail || "Not provided"}</p>
          <p><strong>From:</strong> ${data.name} (${data.email})</p>
          <p><strong>Project Details:</strong></p>
          <p>${data.project}</p>
          <hr>
          <p><em>Laiškas išsiųstas pagal kliento užklausą www.interjeroplanuote.lt</em></p>
        `;
        break;

      case "provider-inquiry":
        subject = `Service Inquiry for ${data.providerName}`;
        html = `
          <h2>New Service Inquiry</h2>
          <p><strong>Provider:</strong> ${data.providerName}</p>
          ${data.providerPhone ? `<p><strong>Provider Phone:</strong> ${data.providerPhone}</p>` : ""}
          ${data.providerEmail ? `<p><strong>Provider Email:</strong> ${data.providerEmail}</p>` : ""}
          <p><strong>From:</strong> ${data.name} (${data.email})</p>
          <p><strong>Message:</strong></p>
          <p>${data.message}</p>
          <hr>
          <p><em>Laiškas išsiųstas pagal kliento užklausą www.interjeroplanuote.lt</em></p>
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

      case "palette-waitlist":
        subject = `Palette Waitlist Signup: ${data.paletteId}`;
        html = `
          <h2>New Palette Waitlist Signup</h2>
          <p><strong>Palette ID:</strong> ${data.paletteId}</p>
          <p><strong>Email:</strong> ${data.email}</p>
          <p><strong>Name:</strong> ${data.name}</p>
          <p><strong>Budget Tier:</strong> ${data.budgetTier}</p>
        `;
        break;

      case "feature-waitlist":
        subject = `Feature Waitlist Signup: ${data.featureId}`;
        html = `
          <h2>New Feature Waitlist Signup</h2>
          <p><strong>Feature:</strong> ${data.featureId}</p>
          <p><strong>Email:</strong> ${data.email}</p>
          <p><strong>Name:</strong> ${data.name}</p>
          ${data.preferences ? `<p><strong>Selections:</strong> ${String(data.preferences).replace(/\|/g, "<br>")}</p>` : ""}
        `;
        break;

      case "palette-review": {
        const mats = (data.materials as Array<{ slot: string; name: string; code: string; compatible: boolean }>) ?? [];
        const incompatible = mats.filter((m) => !m.compatible);
        const subjectCodes = mats.map((m) => m.code).join(" / ");
        subject = `Palette Review – ${subjectCodes}`;
        html = `
          <h2>Palette Review Request</h2>
          ${data.shareUrl ? `<p><strong>🔗 Open session:</strong> <a href="${data.shareUrl}">${data.shareUrl}</a></p>` : ""}
          <table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;width:100%">
            <thead><tr><th>Slot</th><th>Material</th><th>Code</th><th>Compatible?</th></tr></thead>
            <tbody>
              ${mats.map((m) => `<tr><td>${m.slot}</td><td>${m.name}</td><td><code>${m.code}</code></td><td>${m.compatible ? "✓" : "✗"}</td></tr>`).join("")}
            </tbody>
          </table>
          ${incompatible.length > 0 ? `<p><strong>Incompatible slots:</strong> ${incompatible.map((m) => m.slot).join(", ")}</p>` : "<p>All slots compatible ✓</p>"}
          ${data.message ? `<p><strong>User note:</strong> ${data.message}</p>` : ""}
          ${data.email ? `<p><strong>Reply to:</strong> ${data.email}</p>` : ""}
        `;
        break;
      }

      case "credit-request":
        subject = `Credit Request from ${data.email}`;
        html = `
          <h2>Free Credits Request</h2>
          <p><strong>Email:</strong> ${data.email}</p>
          <p><strong>User ID:</strong> <code>${data.userId}</code></p>
          <hr>
          <p>To add credits, run in Supabase SQL editor:</p>
          <pre>UPDATE user_credits SET credits = credits + 5 WHERE user_id = '${data.userId}';</pre>
        `;
        break;

      default:
        throw new Error("Unknown email type");
    }

    // All emails go to admin (Resend free tier can't send to unverified addresses)
    // Designer email is included in the message body for manual forwarding
    const toEmail = RECIPIENT_EMAIL;

    console.log(`Sending ${type} email to: ${toEmail}`);

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Design Dialogues <noreply@updates.dizainodialogai.lt>",
        to: [toEmail],
        subject,
        html,
        reply_to: typeof data.email === "string" ? data.email : undefined,
      }),
    });

    if (!resendRes.ok) {
      const resendError = await resendRes.json().catch(() => ({}));
      console.error("Resend error:", resendError);
      throw new Error(resendError.message || resendError.name || JSON.stringify(resendError));
    }

    console.log("Email sent successfully");

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error sending email:", error);
    await captureException(error, {
      functionName: "send-email",
      extra: { emailType: type, userEmail: data?.email }
    });
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to send email" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
