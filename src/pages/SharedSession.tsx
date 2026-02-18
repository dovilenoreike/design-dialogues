import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { captureError } from "@/lib/sentry";
import { DesignProvider } from "@/contexts/DesignContext";
import AppShell from "@/components/mobile/AppShell";
import MainContent from "@/components/mobile/MainContent";
import { Loader2 } from "lucide-react";

interface SharedSessionData {
  uploadedImage: string | null;
  generatedImage: string | null;
  selectedCategory: string | null;
  selectedMaterial: string | null;
  selectedStyle: string | null;
  freestyleDescription: string;
  selectedTier: "Budget" | "Standard" | "Premium";
  formData: unknown;
  userMoveInDate: string | null;
  completedTasks: string[];
}

function LoadingState() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Loading shared design...</p>
      </div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4 px-4">
        <p className="text-lg font-medium text-foreground">Unable to load shared design</p>
        <p className="text-sm text-muted-foreground">{message}</p>
        <button
          onClick={() => navigate("/design")}
          className="mt-4 px-4 py-2 bg-foreground text-background rounded-lg text-sm font-medium"
        >
          Start Fresh
        </button>
      </div>
    </div>
  );
}

export default function SharedSession() {
  const { shareId } = useParams<{ shareId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionData, setSessionData] = useState<SharedSessionData | null>(null);

  useEffect(() => {
    async function loadSharedSession() {
      if (!shareId) {
        setError("No share ID provided");
        setLoading(false);
        return;
      }

      try {
        const { data, error: fetchError } = await supabase.functions.invoke("get-shared-session", {
          body: { shareId },
        });

        if (fetchError) {
          throw new Error(fetchError.message || "Failed to load shared session");
        }

        if (data?.error) {
          throw new Error(data.error);
        }

        if (data?.session) {
          setSessionData(data.session);
        } else {
          throw new Error("No session data returned");
        }
      } catch (err) {
        console.error("Error loading shared session:", err);
        captureError(err, {
          action: "loadSharedSession",
          edgeFunction: "get-shared-session",
          shareId,
        });
        setError(err instanceof Error ? err.message : "Failed to load shared design");
      } finally {
        setLoading(false);
      }
    }

    loadSharedSession();
  }, [shareId]);

  if (loading) {
    return <LoadingState />;
  }

  if (error || !sessionData) {
    return <ErrorState message={error || "Unknown error"} />;
  }

  // Render the app with the shared session data as initial state
  return (
    <DesignProvider initialSharedSession={sessionData}>
      <AppShell>
        <MainContent />
      </AppShell>
    </DesignProvider>
  );
}
