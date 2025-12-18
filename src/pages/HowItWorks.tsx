import { Link } from "react-router-dom";
import { Upload, SlidersHorizontal, Calculator } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";

const steps = [
  {
    icon: Upload,
    title: "Upload",
    description: "Share your floorplan or photo. Our AI analyzes the geometry.",
  },
  {
    icon: SlidersHorizontal,
    title: "Define",
    description: "Choose your aesthetic and define the scope. From quick refresh to full renovation.",
  },
  {
    icon: Calculator,
    title: "Calculate",
    description: "Get an instant Financial Passport. Real market rates, material specs, and contractor-ready plans.",
  },
];

const HowItWorks = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4 md:px-6 max-w-4xl text-center">
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-medium text-foreground mb-6">
              From Chaos to Clarity.
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Professional interior planning in three simple steps.
            </p>
          </div>
        </section>
        
        {/* 3-Step Process */}
        <section className="py-12 md:py-20 bg-muted/30">
          <div className="container mx-auto px-4 md:px-6 max-w-5xl">
            <div className="grid md:grid-cols-3 gap-8 md:gap-12">
              {steps.map((step, index) => (
                <div key={step.title} className="text-center">
                  <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-background border border-border flex items-center justify-center">
                    <step.icon className="w-7 h-7 text-foreground" />
                  </div>
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-2">
                    Step {index + 1}
                  </div>
                  <h3 className="font-serif text-2xl font-medium text-foreground mb-3">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
        
        {/* CTA Section */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4 md:px-6 text-center">
            <Button asChild size="lg" className="h-12 px-8">
              <Link to="/">Start Your Project</Link>
            </Button>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default HowItWorks;
