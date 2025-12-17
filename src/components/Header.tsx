import { Link } from "react-router-dom";
import { Menu } from "lucide-react";

const Header = () => {
  return (
    <header className="sticky top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 md:px-6 py-3 md:py-4">
        <div className="flex items-center justify-between">
          {/* Mobile: Hamburger | Desktop: Logo */}
          <div className="md:hidden">
            <button className="p-2 -ml-2 text-foreground hover:bg-muted rounded-lg transition-colors">
              <Menu size={22} />
            </button>
          </div>
          
          {/* Logo - centered on mobile */}
          <Link 
            to="/" 
            className="text-xl md:text-2xl font-serif font-medium tracking-tight text-foreground md:flex-none absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0"
          >
            Design Dialogues
          </Link>
          
          {/* Mobile: Credit Pill | Desktop: Navigation */}
          <div className="md:hidden">
            <div className="px-3 py-1.5 bg-surface-muted rounded-full text-xs font-medium text-text-secondary">
              3 Credits
            </div>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
              How it Works
            </span>
            <span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
              Portfolio
            </span>
            <Link to="/calculator" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Calculator
            </Link>
            <span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
              About
            </span>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
