import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const CREDITS_CACHE_KEY = "design_dialogues_credits";

// Save credits to localStorage cache
function cacheCredits(credits: number) {
  localStorage.setItem(CREDITS_CACHE_KEY, JSON.stringify({
    credits,
    timestamp: Date.now()
  }));
}

// Load cached credits (returns null if expired or missing)
function getCachedCredits(): number | null {
  const cached = localStorage.getItem(CREDITS_CACHE_KEY);
  if (!cached) return null;

  try {
    const { credits, timestamp } = JSON.parse(cached);
    // Cache valid for 24 hours
    if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
      return credits;
    }
  } catch {
    // Invalid cache data
  }
  return null;
}

interface CreditsContextValue {
  credits: number | null;
  loading: boolean;
  error: string | null;
  buyCredits: () => Promise<void>;
  useCredit: () => Promise<{ success: boolean; credits: number }>;
  refetchCredits: () => Promise<void>;
}

const CreditsContext = createContext<CreditsContextValue | undefined>(undefined);

interface CreditsProviderProps {
  children: ReactNode;
}

export function CreditsProvider({ children }: CreditsProviderProps) {
  // Initialize from cache for instant display
  const [credits, setCredits] = useState<number | null>(getCachedCredits());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { user, loading: authLoading } = useAuth();

  const fetchCredits = useCallback(async () => {
    if (!user) {
      console.log("fetchCredits: No user, skipping");
      return;
    }

    console.log("fetchCredits: User ID:", user.id);

    try {
      setLoading(true);
      setError(null);

      // Supabase client automatically includes the user's JWT in the Authorization header
      const { data, error: fnError } = await supabase.functions.invoke("get-credits");

      console.log("fetchCredits response:", { data, error: fnError });

      if (fnError) {
        throw fnError;
      }

      setCredits(data.credits);
      cacheCredits(data.credits);
    } catch (err) {
      console.error("Failed to fetch credits:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch credits");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchCredits();
    } else if (!authLoading && !user) {
      setLoading(false);
    }
  }, [fetchCredits, authLoading, user]);

  const buyCredits = useCallback(async () => {
    if (!user) {
      throw new Error("User not authenticated");
    }

    try {
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.set('payment', 'success');
      const successUrl = currentUrl.toString();

      const cancelUrlObj = new URL(window.location.href);
      cancelUrlObj.searchParams.set('payment', 'cancelled');
      const cancelUrl = cancelUrlObj.toString();

      // Supabase client automatically includes the user's JWT in the Authorization header
      const { data, error: fnError } = await supabase.functions.invoke("create-checkout", {
        body: {
          success_url: successUrl,
          cancel_url: cancelUrl,
        },
      });

      if (fnError) {
        throw fnError;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Failed to create checkout:", err);
      throw err;
    }
  }, [user]);

  const useCredit = useCallback(async (): Promise<{ success: boolean; credits: number }> => {
    if (!user) {
      throw new Error("User not authenticated");
    }

    try {
      // Supabase client automatically includes the user's JWT in the Authorization header
      const { data, error: fnError } = await supabase.functions.invoke("use-credit");

      if (fnError) {
        throw fnError;
      }

      // Always update local state and cache with server value
      const serverCredits = data.credits ?? 0;
      setCredits(serverCredits);
      cacheCredits(serverCredits);

      if (data.success) {
        return { success: true, credits: serverCredits };
      } else {
        return { success: false, credits: serverCredits };
      }
    } catch (err) {
      console.error("Failed to use credit:", err);
      throw err;
    }
  }, [user]);

  const value: CreditsContextValue = {
    credits,
    loading: loading || authLoading,
    error,
    buyCredits,
    useCredit,
    refetchCredits: fetchCredits,
  };

  return (
    <CreditsContext.Provider value={value}>
      {children}
    </CreditsContext.Provider>
  );
}

export function useCredits() {
  const context = useContext(CreditsContext);
  if (context === undefined) {
    throw new Error("useCredits must be used within a CreditsProvider");
  }
  return context;
}
