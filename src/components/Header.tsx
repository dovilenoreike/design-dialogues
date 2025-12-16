import { Link } from "react-router-dom";

const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-panel">
      <div className="container mx-auto px-4 md:px-6 py-3 md:py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="text-xl md:text-2xl font-serif font-medium tracking-tight text-foreground">
            Design Dialogues
          </Link>
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
