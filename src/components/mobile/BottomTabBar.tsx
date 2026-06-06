import { Palette, Image, List } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDesign } from "@/contexts/DesignContext";
import { useLanguage } from "@/contexts/LanguageContext";

type NavTab = "konceptas" | "vizualas" | "specs";

interface NavTabItem {
  id: NavTab;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  path: string;
}

const navTabs: NavTabItem[] = [
  { id: "konceptas", icon: Palette, path: "/design" },
  { id: "vizualas", icon: Image, path: "/design/visual" },
  { id: "specs", icon: List, path: "/design/specs" },
];

export default function BottomTabBar() {
  const { activeTab, setActiveTab } = useDesign();
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();

  const activeNavTab: NavTab | null = (() => {
    if (activeTab === "budget" || activeTab === "plan") return null;
    if (location.pathname === "/design/visual") return "vizualas";
    if (location.pathname === "/design/specs") return "specs";
    return "konceptas";
  })();

  const handleTabClick = (tab: NavTabItem) => {
    setActiveTab("design");
    navigate(tab.path);
  };

  return (
    <nav className="flex-shrink-0 bg-background border-t border-border pb-safe md:hidden">
      <div className="w-full max-w-2xl mx-auto">
        <div className="flex items-center justify-around h-14">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeNavTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab)}
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
