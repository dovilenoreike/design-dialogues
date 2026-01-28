import { Link } from "react-router-dom";
import { Home, Compass } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

const NotFound = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 flex items-center justify-center">
        <div className="container mx-auto px-4 md:px-6 max-w-2xl text-center py-16 md:py-24">
          {/* Icon */}
          <div className="w-20 h-20 mx-auto mb-8 rounded-full bg-muted/50 border border-border flex items-center justify-center">
            <Compass className="w-10 h-10 text-muted-foreground" />
          </div>

          {/* 404 Number */}
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-4">
            404
          </p>

          {/* Headline */}
          <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-medium text-foreground mb-4">
            {t("error.pageNotFound")}
          </h1>

          {/* Description */}
          <p className="text-lg text-muted-foreground max-w-md mx-auto mb-8">
            {t("error.pageNotFoundDescription")}
          </p>

          {/* CTA Button */}
          <Button asChild size="lg" className="h-12 px-8">
            <Link to="/">
              <Home className="w-4 h-4 mr-2" />
              {t("error.returnHome")}
            </Link>
          </Button>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default NotFound;
