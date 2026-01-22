import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { sendEmail } from "@/lib/send-email";

const Partner = () => {
  const { t } = useLanguage();

  const valueProps = [
    t("partner.valueProp1"),
    t("partner.valueProp2"),
    t("partner.valueProp3"),
  ];
  const [formData, setFormData] = useState({
    name: "",
    website: "",
    profession: "",
    email: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await sendEmail("partner", formData);
      toast.success(t("partner.successMessage"), {
        position: "top-center",
      });
      setFormData({ name: "", website: "", profession: "", email: "", message: "" });
    } catch (error) {
      toast.error("Failed to send. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4 md:px-6 max-w-4xl text-center">
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-medium text-foreground mb-6">
              {t("partner.headline")}
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              {t("partner.heroSubtitle")}
            </p>
          </div>
        </section>
        
        {/* Value Props */}
        <section className="py-12 bg-muted/30">
          <div className="container mx-auto px-4 md:px-6 max-w-3xl">
            <div className="space-y-4">
              {valueProps.map((prop) => (
                <div key={prop} className="flex items-start gap-4">
                  <CheckCircle2 className="w-5 h-5 text-foreground mt-0.5 flex-shrink-0" />
                  <p className="text-foreground">{prop}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        
        {/* Contact Form */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4 md:px-6 max-w-md">
            <h2 className="font-serif text-2xl font-medium text-foreground mb-8 text-center">
              {t("partner.formTitle")}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">{t("partner.name")}</Label>
                <Input
                  id="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={t("partner.namePlaceholder")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">{t("partner.website")}</Label>
                <Input
                  id="website"
                  type="url"
                  required
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder={t("partner.websitePlaceholder")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="profession">{t("partner.profession")}</Label>
                <Select
                  value={formData.profession}
                  onValueChange={(value) => setFormData({ ...formData, profession: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("partner.professionPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="designer">{t("partner.designer")}</SelectItem>
                    <SelectItem value="supplier">{t("partner.supplier")}</SelectItem>
                    <SelectItem value="contractor">{t("partner.contractor")}</SelectItem>
                    <SelectItem value="carpenter">{t("partner.carpenter")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{t("partner.email")}</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder={t("partner.emailPlaceholder")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">{t("partner.message")}</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder={t("partner.messagePlaceholder")}
                  rows={4}
                />
              </div>

              <Button
                type="submit"
                className="w-full h-12"
                disabled={isSubmitting}
              >
                {isSubmitting ? t("partner.submitting") : t("partner.submit")}
              </Button>
            </form>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Partner;
