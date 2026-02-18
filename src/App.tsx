import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { CreditsProvider } from "@/contexts/CreditsContext";
import { CityProvider } from "@/contexts/CityContext";
import { AppErrorBoundary } from "@/components/ErrorBoundary";
import { trackPageView } from "@/lib/analytics";
import Index from "./pages/Index";
import SharedSession from "./pages/SharedSession";
import HowItWorks from "./pages/HowItWorks";
import Mission from "./pages/Mission";
import Partner from "./pages/Partner";
import NotFound from "./pages/NotFound";

// Track page views on route changes
function PageViewTracker() {
  const location = useLocation();

  useEffect(() => {
    trackPageView(location.pathname + location.search);
  }, [location]);

  return null;
}

const queryClient = new QueryClient();

const App = () => (
  <AppErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <CreditsProvider>
          <CityProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <PageViewTracker />
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/thread" element={<Index />} />
                  <Route path="/design" element={<Index />} />
                  <Route path="/specs" element={<Index />} />
                  <Route path="/budget" element={<Index />} />
                  <Route path="/plan" element={<Index />} />
                  <Route path="/share/:shareId" element={<SharedSession />} />
                  <Route path="/how-it-works" element={<HowItWorks />} />
                  <Route path="/mission" element={<Mission />} />
                  <Route path="/partner" element={<Partner />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
              <Analytics />
              <SpeedInsights />
            </TooltipProvider>
          </CityProvider>
        </CreditsProvider>
      </LanguageProvider>
    </QueryClientProvider>
  </AppErrorBoundary>
);

export default App;
