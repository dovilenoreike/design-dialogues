import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Locale } from "date-fns";
import { enUS, lt } from "date-fns/locale";
import enTranslations from "@/locales/en.json";
import ltTranslations from "@/locales/lt.json";

export type Language = "en" | "lt";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  dateLocale: Locale;
}

const dateLocales: Record<Language, Locale> = {
  en: enUS,
  lt: lt,
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Flatten nested translation objects to dot notation
function flattenTranslations(obj: Record<string, unknown>, prefix = ""): Record<string, string> {
  const result: Record<string, string> = {};

  for (const key in obj) {
    const value = obj[key];
    const newKey = prefix ? `${prefix}.${key}` : key;

    if (typeof value === "object" && value !== null) {
      Object.assign(result, flattenTranslations(value as Record<string, unknown>, newKey));
    } else if (typeof value === "string") {
      result[newKey] = value;
    }
  }

  return result;
}

// Pre-flatten translations for efficient lookup
const translations: Record<Language, Record<string, string>> = {
  en: flattenTranslations(enTranslations),
  lt: flattenTranslations(ltTranslations),
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem("language");
    return (saved as Language) || "en";
  });

  useEffect(() => {
    localStorage.setItem("language", language);
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  const dateLocale = dateLocales[language];

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, dateLocale }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
