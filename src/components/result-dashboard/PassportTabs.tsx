import { useState, ReactNode, isValidElement } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

interface PassportTabsProps {
  children: ReactNode;
  defaultTab?: "financial" | "timeline";
}

export const PassportTabs = ({
  children,
  defaultTab = "financial"
}: PassportTabsProps) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<"financial" | "timeline">(defaultTab);

  return (
    <div>
      {/* Tab Header */}
      <div className="flex gap-6 border-b border-ds-border-default mb-6">
        <button
          onClick={() => setActiveTab("financial")}
          className={`pb-3 text-sm font-medium transition-colors relative ${
            activeTab === "financial"
              ? "text-foreground"
              : "text-text-muted hover:text-text-secondary"
          }`}
        >
          {t("timeline.tabFinancial")}
          {activeTab === "financial" && (
            <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-foreground" />
          )}
        </button>

        <button
          onClick={() => setActiveTab("timeline")}
          className={`pb-3 text-sm font-medium transition-colors relative ${
            activeTab === "timeline"
              ? "text-foreground"
              : "text-text-muted hover:text-text-secondary"
          }`}
        >
          {t("timeline.tabTimeline")}
          {activeTab === "timeline" && (
            <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-foreground" />
          )}
        </button>
      </div>

      {/* Tab Content */}
      <div>
        {Array.isArray(children)
          ? children.map((child, index) => {
              if (isValidElement<{ value: string }>(child) && child.props.value === activeTab) {
                return <div key={child.props.value || index}>{child}</div>;
              }
              return null;
            })
          : isValidElement<{ value: string }>(children) && children.props.value === activeTab
          ? children
          : null}
      </div>
    </div>
  );
};

export const PassportTabPanel = ({
  value,
  children
}: {
  value: "financial" | "timeline";
  children: ReactNode;
}) => {
  return <div className="fade-in">{children}</div>;
};
