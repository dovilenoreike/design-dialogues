import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

const DEVICE_ID_KEY = "design_dialogues_device_id";

function getDeviceId(): string {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}

export function useCredits() {
  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const deviceId = getDeviceId();

  const fetchCredits = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fnError } = await supabase.functions.invoke("get-credits", {
        body: { device_id: deviceId },
      });

      if (fnError) {
        throw fnError;
      }

      setCredits(data.credits);
    } catch (err) {
      console.error("Failed to fetch credits:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch credits");
    } finally {
      setLoading(false);
    }
  }, [deviceId]);

  useEffect(() => {
    fetchCredits();
  }, [fetchCredits]);

  const buyCredits = useCallback(async () => {
    try {
      const successUrl = `${window.location.origin}?payment=success`;
      const cancelUrl = `${window.location.origin}?payment=cancelled`;

      const { data, error: fnError } = await supabase.functions.invoke("create-checkout", {
        body: {
          device_id: deviceId,
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
  }, [deviceId]);

  const useCredit = useCallback(async (): Promise<{ success: boolean; credits: number }> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke("use-credit", {
        body: { device_id: deviceId },
      });

      if (fnError) {
        throw fnError;
      }

      // Always update local state with server value
      const serverCredits = data.credits ?? 0;
      setCredits(serverCredits);

      if (data.success) {
        return { success: true, credits: serverCredits };
      } else {
        return { success: false, credits: serverCredits };
      }
    } catch (err) {
      console.error("Failed to use credit:", err);
      throw err;
    }
  }, [deviceId]);

  return {
    credits,
    loading,
    error,
    buyCredits,
    useCredit,
    refetchCredits: fetchCredits,
    deviceId,
  };
}
