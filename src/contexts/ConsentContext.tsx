import { createContext, useContext, useState, useEffect, ReactNode } from "react";

const CONSENT_KEY = "cookieConsent";

interface ConsentContextValue {
  consentGiven: boolean | null;
  acceptAll: () => void;
  declineAll: () => void;
}

const ConsentContext = createContext<ConsentContextValue | undefined>(undefined);

export function ConsentProvider({ children }: { children: ReactNode }) {
  const [consentGiven, setConsentGiven] = useState<boolean | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (stored === "accepted") setConsentGiven(true);
    else if (stored === "declined") setConsentGiven(false);
  }, []);

  const acceptAll = () => {
    localStorage.setItem(CONSENT_KEY, "accepted");
    setConsentGiven(true);
  };

  const declineAll = () => {
    localStorage.setItem(CONSENT_KEY, "declined");
    setConsentGiven(false);
  };

  return (
    <ConsentContext.Provider value={{ consentGiven, acceptAll, declineAll }}>
      {children}
    </ConsentContext.Provider>
  );
}

export function useConsent() {
  const ctx = useContext(ConsentContext);
  if (!ctx) throw new Error("useConsent must be used inside ConsentProvider");
  return ctx;
}
