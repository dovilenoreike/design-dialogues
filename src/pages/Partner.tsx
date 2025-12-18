import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const valueProps = [
  "Receive briefs with verified budgets.",
  "Skip the education phase—clients come with technical plans ready.",
  "Showcase your materials in our digital palette.",
];

const Partner = () => {
  const [formData, setFormData] = useState({
    name: "",
    website: "",
    profession: "",
    email: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate submission
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast.success("Partnership request submitted! We'll be in touch soon.", {
      position: "top-center",
    });
    
    setFormData({ name: "", website: "", profession: "", email: "" });
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4 md:px-6 max-w-4xl text-center">
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-medium text-foreground mb-6">
              Connect with Prepared Clients.
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Join our network of architects, designers, and material suppliers.
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
              Request Partnership
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Your name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="website">Company Website</Label>
                <Input
                  id="website"
                  type="url"
                  required
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://yourcompany.com"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="profession">Profession</Label>
                <Select
                  value={formData.profession}
                  onValueChange={(value) => setFormData({ ...formData, profession: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your profession" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="architect">Architect</SelectItem>
                    <SelectItem value="designer">Interior Designer</SelectItem>
                    <SelectItem value="supplier">Material Supplier</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="you@company.com"
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full h-12"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Request Partnership"}
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
