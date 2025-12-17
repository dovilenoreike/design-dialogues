import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const NAV_ITEMS = [
  { label: "How it Works", href: "#how-it-works" },
  { label: "The Mission", href: "#mission" },
  { label: "Partner with Us", href: "#partner" },
];

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 md:px-6 py-3 md:py-4">
        <div className="flex items-center justify-between">
          {/* Mobile: Hamburger Menu */}
          <div className="md:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <button className="p-2 -ml-2 text-foreground hover:bg-muted rounded-lg transition-colors">
                  <Menu size={22} />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px]">
                <SheetHeader className="text-left">
                  <SheetTitle className="font-serif text-xl">Menu</SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-6 mt-8">
                  {NAV_ITEMS.map((item) => (
                    <a
                      key={item.label}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className="font-serif text-lg text-foreground hover:text-primary transition-colors"
                    >
                      {item.label}
                    </a>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
          
          {/* Logo - centered on mobile */}
          <Link 
            to="/" 
            className="text-xl md:text-2xl font-serif font-medium tracking-tight text-foreground md:flex-none absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0"
          >
            Design Dialogues
          </Link>
          
          {/* Mobile: Credit Pill */}
          <div className="md:hidden">
            <div className="px-3 py-1.5 bg-muted rounded-full text-xs font-medium text-muted-foreground">
              3 Credits
            </div>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.label}
              </a>
            ))}
            <div className="px-3 py-1.5 bg-muted rounded-full text-xs font-medium text-muted-foreground">
              3 Credits
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
