import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { providerBrands } from "@/data/sourcing/providers";
import type { ProviderBrand } from "@/data/sourcing/types";

const STORAGE_KEY = "dd_active_provider";

interface ProviderContextType {
  isProviderMode: boolean;
  activeProvider: ProviderBrand | null;
  exitProviderMode: () => void;
}

const ProviderContext = createContext<ProviderContextType | undefined>(undefined);

export const ProviderProvider = ({ children }: { children: ReactNode }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeProvider, setActiveProvider] = useState<ProviderBrand | null>(() => {
    try {
      const storedId = localStorage.getItem(STORAGE_KEY);
      if (storedId) return providerBrands.find((p) => p.id === storedId) ?? null;
    } catch {}
    return null;
  });

  useEffect(() => {
    const urlProviderId = searchParams.get("provider");
    if (!urlProviderId) return;
    const provider = providerBrands.find((p) => p.id === urlProviderId);
    if (provider) {
      setActiveProvider(provider);
      localStorage.setItem(STORAGE_KEY, provider.id);
      searchParams.delete("provider");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const exitProviderMode = () => {
    localStorage.removeItem(STORAGE_KEY);
    setActiveProvider(null);
  };

  return (
    <ProviderContext.Provider value={{ isProviderMode: activeProvider !== null, activeProvider, exitProviderMode }}>
      {children}
    </ProviderContext.Provider>
  );
};

export const useProvider = () => {
  const context = useContext(ProviderContext);
  if (!context) throw new Error("useProvider must be used within a ProviderProvider");
  return context;
};
