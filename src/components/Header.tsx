import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Menu, Plus, Loader2, Share2, Sparkles } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import LanguageSelector, { LanguageSelectorInline } from "./LanguageSelector";
import { useLanguage } from "@/contexts/LanguageContext";
import { useShowroom } from "@/contexts/ShowroomContext";
import FeedbackDialog, { FeedbackTrigger, FeedbackMobileItem } from "./FeedbackDialog";
import { useCredits } from "@/contexts/CreditsContext";
import { useDesignOptional } from "@/contexts/DesignContext";
import { useToast } from "@/hooks/use-toast";
import { toast } from "sonner";
import { trackEvent, AnalyticsEvents } from "@/lib/analytics";

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [buyingCredits, setBuyingCredits] = useState(false);
  const { t } = useLanguage();
  const { isShowroomMode, activeShowroom } = useShowroom();
  const { credits, loading, buyCredits, refetchCredits } = useCredits();
  const designContext = useDesignOptional();
  const shareSession = designContext?.shareSession;
  const isSharing = designContext?.isSharing ?? false;
  const { toast: toastUI } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  // Handle payment return
  useEffect(() => {
    const payment = searchParams.get("payment");
    if (payment === "success") {
      toastUI({
        title: t("credits.purchaseSuccess"),
        description: t("credits.creditsAdded"),
      });
      refetchCredits();
      setSearchParams({});

      // Track credits purchased
      trackEvent(AnalyticsEvents.CREDITS_PURCHASED, {
        // Amount/credits info not available client-side, tracked by Stripe webhook
        source: "stripe_redirect",
      });
    } else if (payment === "cancelled") {
      toastUI({
        title: t("credits.purchaseCancelled"),
        variant: "destructive",
      });
      setSearchParams({});
    }
  }, [searchParams, setSearchParams, toastUI, t, refetchCredits]);

  const handleBuyCredits = async () => {
    try {
      setBuyingCredits(true);
      await buyCredits();
    } catch (err) {
      toastUI({
        title: t("credits.purchaseError"),
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
      setBuyingCredits(false);
    }
  };

  // Share handler - native share on mobile, clipboard fallback on desktop
  const handleShare = async () => {
    if (!shareSession) return;
    const shareId = await shareSession();
    if (shareId) {
      const shareUrl = `${window.location.origin}/share/${shareId}`;

      // Try native share API on mobile first
      if (navigator.share) {
        try {
          await navigator.share({
            title: t("share.title") || "My Design",
            text: t("share.text") || "Check out my interior design",
            url: shareUrl,
          });
        } catch (err) {
          // User cancelled or share failed, fall back to clipboard
          if ((err as Error).name !== "AbortError") {
            await navigator.clipboard.writeText(shareUrl);
            toast.success(t("share.copied") || "Link copied to clipboard!");
          }
        }
      } else {
        // Desktop: copy to clipboard
        await navigator.clipboard.writeText(shareUrl);
        toast.success(t("share.copied") || "Link copied to clipboard!");
      }
    }
  };

  const NAV_ITEMS = [
    { label: t("nav.howItWorks"), href: "/how-it-works" },
    { label: t("nav.mission"), href: "/mission" },
    { label: t("nav.partner"), href: "/partner" },
  ];

  const handleMobileFeedback = () => {
    setIsOpen(false);
    setFeedbackOpen(true);
  };

  return (
    <>
      <header className="sticky top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 md:px-6 py-3 md:py-4">
          {/* Mobile Layout */}
          <div className="flex md:hidden items-center gap-2">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <button className="p-2 -ml-2 text-foreground hover:bg-muted rounded-lg transition-colors shrink-0">
                  <Menu size={22} />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] flex flex-col" aria-describedby={undefined}>
                <SheetHeader className="text-left">
                  <SheetTitle className="font-serif text-xl">Menu</SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-6 mt-8 flex-1">
                  {NAV_ITEMS.map((item) => (
                    <Link
                      key={item.href}
                      to={item.href}
                      onClick={() => setIsOpen(false)}
                      className="font-serif text-lg text-foreground hover:text-primary transition-colors"
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>

                {/* Mobile drawer footer */}
                <div className="mt-auto pt-6 border-t border-border space-y-4">
                  <FeedbackMobileItem onClick={handleMobileFeedback} />
                  <LanguageSelectorInline />
                </div>
              </SheetContent>
            </Sheet>

            {isShowroomMode && activeShowroom ? (
              <div className="flex-1 text-center px-2 truncate">
                <span className="text-xl font-serif font-medium tracking-tight text-foreground">
                  {activeShowroom.name}
                </span>
                <span className="block text-[10px] text-muted-foreground tracking-wide">
                  {t("showroom.poweredBy")}
                </span>
              </div>
            ) : (
              <Link
                to="/"
                className="flex-1 text-center text-xl font-serif font-medium tracking-tight text-foreground truncate px-2"
              >
                Dizaino Dialogai
              </Link>
            )}

            {designContext && (
              <button
                onClick={handleShare}
                disabled={isSharing}
                className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors disabled:opacity-50 shrink-0"
              >
                {isSharing ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Share2 size={18} />
                )}
              </button>
            )}

            <button
              onClick={handleBuyCredits}
              disabled={buyingCredits || loading}
              className="flex items-center gap-1 px-2 py-1.5 bg-muted hover:bg-muted/80 rounded-full text-xs font-medium text-muted-foreground transition-colors disabled:opacity-50 shrink-0"
            >
              {loading || buyingCredits ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <>
                  <Sparkles size={14} />
                  <span>{credits ?? 0}</span>
                  <Plus size={10} />
                </>
              )}
            </button>
          </div>
          
          {/* Desktop Layout - 3-part grid */}
          <div className="hidden md:grid grid-cols-3 items-center">
            {/* Left: Logo / Co-branding */}
            <div className="justify-self-start">
              {isShowroomMode && activeShowroom ? (
                <div>
                  <span className="text-2xl font-serif font-medium tracking-tight text-foreground">
                    {activeShowroom.name}
                  </span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {t("showroom.poweredBy")}
                  </span>
                </div>
              ) : (
                <Link
                  to="/"
                  className="text-2xl font-serif font-medium tracking-tight text-foreground"
                >
                  Dizaino Dialogai
                </Link>
              )}
            </div>
            
            {/* Center: Navigation */}
            <nav className="justify-self-center flex items-center gap-8">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            
            {/* Right: Utilities */}
            <div className="justify-self-end flex items-center gap-4">
              <LanguageSelector />
              <FeedbackTrigger onClick={() => setFeedbackOpen(true)} />
              {designContext && (
                <button
                  onClick={handleShare}
                  disabled={isSharing}
                  className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors disabled:opacity-50"
                >
                  {isSharing ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Share2 size={16} />
                  )}
                </button>
              )}
              <button
                onClick={handleBuyCredits}
                disabled={buyingCredits || loading}
                className="flex items-center gap-1 px-2 py-1.5 bg-muted hover:bg-muted/80 rounded-full text-xs font-medium text-muted-foreground transition-colors disabled:opacity-50"
              >
                {loading || buyingCredits ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <>
                    <Sparkles size={14} />
                    <span>{credits ?? 0}</span>
                    <Plus size={10} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>
      
      <FeedbackDialog open={feedbackOpen} onOpenChange={setFeedbackOpen} />
    </>
  );
};

export default Header;
