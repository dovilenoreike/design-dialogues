import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { showroomBrands } from "@/data/sourcing/showrooms";
import type { ShowroomBrand } from "@/data/sourcing/types";

const STORAGE_KEY = "dd_active_showroom";

interface ShowroomContextType {
  isShowroomMode: boolean;
  activeShowroom: ShowroomBrand | null;
  exitShowroomMode: () => void;
}

const ShowroomContext = createContext<ShowroomContextType | undefined>(undefined);

export const ShowroomProvider = ({ children }: { children: ReactNode }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeShowroom, setActiveShowroom] = useState<ShowroomBrand | null>(null);

  // On mount: check URL param first, then localStorage
  useEffect(() => {
    const urlShowroomId = searchParams.get("showroom");

    if (urlShowroomId) {
      // URL param takes precedence
      const showroom = showroomBrands.find((s) => s.id === urlShowroomId);
      if (showroom) {
        setActiveShowroom(showroom);
        localStorage.setItem(STORAGE_KEY, showroom.id);
        // Clear URL param for cleaner URL
        searchParams.delete("showroom");
        setSearchParams(searchParams, { replace: true });
      }
    } else {
      // Check localStorage
      const storedId = localStorage.getItem(STORAGE_KEY);
      if (storedId) {
        const showroom = showroomBrands.find((s) => s.id === storedId);
        if (showroom) {
          setActiveShowroom(showroom);
        } else {
          // Invalid stored ID, clean up
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    }
  }, [searchParams, setSearchParams]);

  const exitShowroomMode = () => {
    localStorage.removeItem(STORAGE_KEY);
    setActiveShowroom(null);
  };

  const isShowroomMode = activeShowroom !== null;

  return (
    <ShowroomContext.Provider value={{ isShowroomMode, activeShowroom, exitShowroomMode }}>
      {children}
    </ShowroomContext.Provider>
  );
};

export const useShowroom = () => {
  const context = useContext(ShowroomContext);
  if (!context) {
    throw new Error("useShowroom must be used within a ShowroomProvider");
  }
  return context;
};
