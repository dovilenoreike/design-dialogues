import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { CreditsProvider } from "@/contexts/CreditsContext";
import { CityProvider } from "@/contexts/CityContext";
import Index from "./pages/Index";
import Calculator from "./pages/Calculator";
import HowItWorks from "./pages/HowItWorks";
import Mission from "./pages/Mission";
import Partner from "./pages/Partner";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <CreditsProvider>
        <CityProvider>
          <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/calculator" element={<Calculator />} />
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
);

export default App;
