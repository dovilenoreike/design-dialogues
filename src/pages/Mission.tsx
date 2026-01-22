import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useLanguage } from "@/contexts/LanguageContext";

const Mission = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1">
        {/* Article Content */}
        <article className="py-16 md:py-24">
          <div className="container mx-auto px-4 md:px-6 max-w-2xl">
            <h1 className="font-serif text-4xl md:text-5xl font-medium text-foreground mb-10 leading-tight">
              {t("mission.headline")}
            </h1>

            <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
              <p>{t("mission.paragraph1")}</p>
              <p>{t("mission.paragraph2")}</p>
              <p>{t("mission.paragraph3")}</p>
              <p>{t("mission.paragraph4")}</p>
            </div>

            {/* Founder Note */}
            <div className="mt-16 pt-8 border-t border-border">
              <p className="text-sm text-muted-foreground italic">
                {t("mission.founderNote")}
              </p>
            </div>
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
};

export default Mission;
