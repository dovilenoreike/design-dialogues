import { Palette, ClipboardList, Calculator, Calendar } from "lucide-react";
import { useDesign, BottomTab } from "@/contexts/DesignContext";
import { useLanguage } from "@/contexts/LanguageContext";

interface TabItem {
  id: BottomTab;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}

const tabs: TabItem[] = [
  { id: "design", icon: Palette },
  { id: "specs", icon: ClipboardList },
  { id: "budget", icon: Calculator },
  { id: "plan", icon: Calendar },
];

export default function BottomTabBar() {
  const { activeTab, setActiveTab } = useDesign();
  const { t } = useLanguage();

  return (
    <nav className="flex-shrink-0 bg-background border-t border-border pb-safe">
      <div className="w-full max-w-2xl mx-auto">
        <div className="flex items-center justify-around h-14">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center justify-center flex-1 h-full min-h-[44px] transition-colors ${
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground/70"
                }`}
              >
                <Icon className="w-5 h-5 mb-0.5" strokeWidth={1.5} />
                <span className="text-[10px] font-medium">{t(`tabs.${tab.id}`)}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
