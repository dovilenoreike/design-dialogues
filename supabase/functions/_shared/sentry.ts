/**
 * Sentry error reporting for Deno edge functions
 * Uses manual HTTP API since there's no official Deno SDK
 */

interface SentryContext {
  functionName: string;
  userId?: string;
  extra?: Record<string, unknown>;
}

/**
 * Parse Sentry DSN into components
 */
function parseDsn(dsn: string): { publicKey: string; host: string; projectId: string } | null {
  try {
    // DSN format: https://<public_key>@<host>/<project_id>
    const url = new URL(dsn);
    const publicKey = url.username;
    const host = url.host;
    const projectId = url.pathname.slice(1);

    if (!publicKey || !host || !projectId) {
      return null;
    }

    return { publicKey, host, projectId };
  } catch {
    return null;
  }
}

/**
 * Build Sentry event payload
 */
function buildEvent(
  error: Error,
  context: SentryContext
): Record<string, unknown> {
  return {
    event_id: crypto.randomUUID().replace(/-/g, ""),
    timestamp: new Date().toISOString(),
    platform: "javascript",
    level: "error",
    environment: Deno.env.get("ENVIRONMENT") || "production",
    server_name: "supabase-edge-functions",
    tags: {
      function: context.functionName,
      runtime: "deno",
    },
    user: context.userId
      ? { id: context.userId }
      : undefined,
    extra: context.extra || {},
    exception: {
      values: [
        {
          type: error.name || "Error",
          value: error.message,
          stacktrace: error.stack
            ? {
                frames: parseStackTrace(error.stack),
              }
            : undefined,
        },
      ],
    },
  };
}

/**
 * Parse stack trace into Sentry frames format
 */
function parseStackTrace(stack: string): Array<{ filename: string; function: string; lineno?: number }> {
  const lines = stack.split("\n").slice(1); // Skip first line (error message)
  const frames: Array<{ filename: string; function: string; lineno?: number }> = [];

  for (const line of lines) {
    const match = line.match(/at\s+(.+?)\s+\((.+?):(\d+):\d+\)/);
    if (match) {
      frames.push({
        function: match[1],
        filename: match[2],
        lineno: parseInt(match[3], 10),
      });
    } else {
      // Try simpler format: at file:line:col
      const simpleMatch = line.match(/at\s+(.+?):(\d+):\d+/);
      if (simpleMatch) {
        frames.push({
          filename: simpleMatch[1],
          function: "<anonymous>",
          lineno: parseInt(simpleMatch[2], 10),
        });
      }
    }
  }

  // Sentry expects frames in reverse order (oldest first)
  return frames.reverse();
}

/**
 * Send exception to Sentry
 */
export async function captureException(
  error: unknown,
  context: SentryContext
): Promise<void> {
  const dsn = Deno.env.get("SENTRY_DSN");

  if (!dsn) {
    console.error(`[${context.functionName}] Sentry DSN not configured, error not reported:`, error);
    return;
  }

  const parsed = parseDsn(dsn);
  if (!parsed) {
    console.error(`[${context.functionName}] Invalid Sentry DSN format`);
    return;
  }

  // Convert non-Error objects to proper Error instances
  let errorObj: Error;
  if (error instanceof Error) {
    errorObj = error;
  } else if (typeof error === "object" && error !== null) {
    // Handle API error objects (e.g., Resend errors with message property)
    const errObj = error as Record<string, unknown>;
    const message = errObj.message || errObj.error || JSON.stringify(error);
    errorObj = new Error(String(message));
    errorObj.name = errObj.name ? String(errObj.name) : "APIError";
  } else {
    errorObj = new Error(String(error));
  }
  const event = buildEvent(errorObj, context);

  const storeUrl = `https://${parsed.host}/api/${parsed.projectId}/store/`;

  try {
    const response = await fetch(storeUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Sentry-Auth": `Sentry sentry_version=7, sentry_client=deno-edge/1.0.0, sentry_key=${parsed.publicKey}`,
      },
      body: JSON.stringify(event),
    });

    if (!response.ok) {
      console.error(`[${context.functionName}] Sentry API error:`, response.status, await response.text());
    }
  } catch (sendError) {
    // Don't let Sentry errors break the function
    console.error(`[${context.functionName}] Failed to send to Sentry:`, sendError);
  }
}
