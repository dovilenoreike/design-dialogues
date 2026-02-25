import { useState, useRef } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
} from "@/components/ui/drawer";
import { LayoutGrid, PenLine, Camera, Check, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { joinFeatureWaitlist } from "@/lib/feature-waitlist";
import type { UploadType } from "@/types/design-state";

interface UploadMenuSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (type: UploadType) => void;
}

export default function UploadMenuSheet({
  open,
  onOpenChange,
  onSelect,
}: UploadMenuSheetProps) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'creative' | 'photorealism'>('creative');
  const [waitlistState, setWaitlistState] = useState<'idle' | 'form' | 'submitting' | 'success' | 'error'>('idle');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const resetTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const options: { icon: typeof LayoutGrid; label: string; tip: string; type: UploadType }[] = [
    {
      icon: LayoutGrid,
      label: t("mobile.uploadMenu.2dPlan"),
      tip: t("mobile.uploadMenu.2dPlanTip"),
      type: "floorplan",
    },
    {
      icon: PenLine,
      label: t("mobile.uploadMenu.sketch"),
      tip: t("mobile.uploadMenu.sketchTip"),
      type: "sketch",
    },
    {
      icon: Camera,
      label: t("mobile.uploadMenu.photo"),
      tip: t("mobile.uploadMenu.photoTip"),
      type: "photo",
    },
  ];

  const handleSelect = (type: UploadType) => {
    onOpenChange(false);
    onSelect(type);
  };

  const handleWaitlistSubmit = async () => {
    if (!email.trim()) return;

    setWaitlistState('submitting');
    const result = await joinFeatureWaitlist("photorealism", email.trim(), name.trim() || undefined);

    if (result.success) {
      setWaitlistState('success');
      resetTimerRef.current = setTimeout(() => {
        setWaitlistState('idle');
        setEmail('');
        setName('');
      }, 2000);
    } else {
      setWaitlistState('error');
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
      setWaitlistState('idle');
      setEmail('');
      setName('');
    }
    onOpenChange(open);
  };

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <DrawerContent>
        <DrawerTitle className="sr-only">
          {t("mobile.uploadMenu.title")}
        </DrawerTitle>
        <div className="px-6 pt-3 pb-10 bg-white">
          <p className="text-[10px] tracking-[0.2em] uppercase text-neutral-400 mb-5 text-center">
            {t("mobile.uploadMenu.sectionHeader")}
          </p>

          {/* Segmented control */}
          <div className="bg-neutral-100 rounded-full p-1 flex mb-5">
            <button
              onClick={() => setActiveTab('creative')}
              className={`flex-1 rounded-full py-2 text-[11px] tracking-[0.15em] uppercase font-medium text-center transition-colors ${
                activeTab === 'creative'
                  ? 'bg-neutral-900 text-white'
                  : 'text-neutral-500'
              }`}
            >
              {t("mobile.uploadMenu.tabCreative")}
            </button>
            <button
              onClick={() => setActiveTab('photorealism')}
              className={`flex-1 rounded-full py-2 text-[11px] tracking-[0.15em] uppercase font-medium text-center transition-colors ${
                activeTab === 'photorealism'
                  ? 'bg-neutral-900 text-white'
                  : 'text-neutral-500'
              }`}
            >
              {t("mobile.uploadMenu.tabPhotorealism")}
            </button>
          </div>

          {activeTab === 'creative' ? (
            <div className="divide-y divide-neutral-200">
              {options.map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => handleSelect(opt.type)}
                  className="flex items-center gap-4 w-full py-6 text-left transition-colors active:bg-neutral-50"
                >
                  <opt.icon
                    className="w-5 h-5 text-neutral-900 flex-shrink-0"
                    strokeWidth={1.5}
                  />
                  <div className="flex flex-col gap-1">
                    <span className="font-serif text-[15px] text-neutral-900">
                      {opt.label}
                    </span>
                    <span className="text-[12px] text-neutral-500 leading-relaxed">
                      {opt.tip}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center py-10 gap-4">
              <h3 className="font-serif text-xl text-neutral-900">{t("mobile.uploadMenu.comingSoonTitle")}</h3>
              <p className="text-[13px] text-neutral-500 text-center max-w-[260px] leading-relaxed">
                {t("mobile.uploadMenu.comingSoonDescription")}
              </p>

              {waitlistState === 'idle' && (
                <button
                  onClick={() => setWaitlistState('form')}
                  className="bg-neutral-900 text-white rounded-full px-6 py-3 text-sm"
                >
                  {t("mobile.uploadMenu.comingSoonCta")}
                </button>
              )}

              {(waitlistState === 'form' || waitlistState === 'submitting' || waitlistState === 'error') && (
                <div className="w-full max-w-[280px] flex flex-col gap-3">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t("mobile.uploadMenu.emailPlaceholder")}
                    className="w-full border border-neutral-200 rounded-lg px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-400"
                    disabled={waitlistState === 'submitting'}
                    autoFocus
                  />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t("mobile.uploadMenu.namePlaceholder")}
                    className="w-full border border-neutral-200 rounded-lg px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-400"
                    disabled={waitlistState === 'submitting'}
                  />
                  <button
                    onClick={handleWaitlistSubmit}
                    disabled={!email.trim() || waitlistState === 'submitting'}
                    className="bg-neutral-900 text-white rounded-full px-6 py-3 text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {waitlistState === 'submitting' && <Loader2 className="w-4 h-4 animate-spin" />}
                    {t("mobile.uploadMenu.submitWaitlist")}
                  </button>
                  {waitlistState === 'error' && (
                    <p className="text-xs text-center" style={{ color: '#9a3412' }}>{t("mobile.uploadMenu.waitlistError")}</p>
                  )}
                </div>
              )}

              {waitlistState === 'success' && (
                <div className="flex items-center gap-2 text-sm text-neutral-700">
                  <Check className="w-4 h-4" style={{ color: '#647d75' }} />
                  {t("mobile.uploadMenu.waitlistSuccess")}
                </div>
              )}
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
