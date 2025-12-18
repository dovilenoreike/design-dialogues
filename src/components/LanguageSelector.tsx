import { useLanguage, Language } from "@/contexts/LanguageContext";
import { Globe } from "lucide-react";

const languages: { code: Language; label: string; shortCode: string }[] = [
  { code: "en", label: "English", shortCode: "EN" },
  { code: "lt", label: "Lietuvių", shortCode: "LT" },
];

// Desktop inline text version
const LanguageSelector = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-2">
      {languages.map((lang, index) => (
        <div key={lang.code} className="flex items-center gap-2">
          {index > 0 && (
            <span className="text-text-muted">|</span>
          )}
          <button
            onClick={() => setLanguage(lang.code)}
            className={`text-sm transition-colors ${
              language === lang.code
                ? "text-text-primary font-medium"
                : "text-text-tertiary hover:text-text-secondary"
            }`}
          >
            {lang.shortCode}
          </button>
        </div>
      ))}
    </div>
  );
};

// Mobile inline version
export const LanguageSelectorInline = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-3">
      <Globe size={18} className="text-text-tertiary" />
      <div className="flex items-center gap-3">
        {languages.map((lang, index) => (
          <div key={lang.code} className="flex items-center gap-3">
            {index > 0 && (
              <span className="text-text-muted">|</span>
            )}
            <button
              onClick={() => setLanguage(lang.code)}
              className={`py-2 transition-colors min-w-[44px] ${
                language === lang.code
                  ? "text-text-primary font-medium"
                  : "text-text-tertiary hover:text-text-secondary"
              }`}
            >
              {lang.label}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LanguageSelector;
