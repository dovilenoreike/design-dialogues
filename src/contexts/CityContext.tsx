import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type City = "vilnius" | "kaunas" | "klaipeda";

export const CITIES: City[] = ["vilnius", "kaunas", "klaipeda"];

export const CITY_LABELS: Record<City, string> = {
  vilnius: "Vilnius",
  kaunas: "Kaunas",
  klaipeda: "Klaipėda",
};

interface CityContextType {
  city: City;
  setCity: (city: City) => void;
  cityLabel: string;
}

const CityContext = createContext<CityContextType | undefined>(undefined);

export const CityProvider = ({ children }: { children: ReactNode }) => {
  const [city, setCityState] = useState<City>(() => {
    const saved = localStorage.getItem("selectedCity");
    return (saved as City) || "vilnius";
  });

  useEffect(() => {
    localStorage.setItem("selectedCity", city);
  }, [city]);

  const setCity = (newCity: City) => {
    setCityState(newCity);
  };

  const cityLabel = CITY_LABELS[city];

  return (
    <CityContext.Provider value={{ city, setCity, cityLabel }}>
      {children}
    </CityContext.Provider>
  );
};

export const useCity = () => {
  const context = useContext(CityContext);
  if (!context) {
    throw new Error("useCity must be used within a CityProvider");
  }
  return context;
};
