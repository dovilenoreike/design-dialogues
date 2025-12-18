import Header from "@/components/Header";
import Footer from "@/components/Footer";

const Mission = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1">
        {/* Article Content */}
        <article className="py-16 md:py-24">
          <div className="container mx-auto px-4 md:px-6 max-w-2xl">
            <h1 className="font-serif text-4xl md:text-5xl font-medium text-foreground mb-10 leading-tight">
              Democratizing Professional Design.
            </h1>
            
            <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
              <p>
                Home renovation is one of the most significant investments a person makes—yet 
                the process remains frustratingly opaque. Budgets spiral without warning. 
                Contractors quote wildly different numbers. Homeowners feel lost before 
                they've even begun.
              </p>
              
              <p>
                We believe technology can change this. By analyzing thousands of completed 
                projects, material costs, and market rates, we've built a system that brings 
                transparency to what has always been a guessing game.
              </p>
              
              <p>
                Our tool doesn't replace architects or designers—it empowers homeowners to 
                approach professionals with realistic expectations, clear budgets, and a 
                visual language for what they want. It levels the playing field.
              </p>
              
              <p>
                This is professional-grade planning, accessible to everyone. No more fear. 
                No more surprises. Just clarity from day one.
              </p>
            </div>
            
            {/* Founder Note */}
            <div className="mt-16 pt-8 border-t border-border">
              <p className="text-sm text-muted-foreground italic">
                Built by a tech founder obsessed with design.
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
