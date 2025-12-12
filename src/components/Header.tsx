const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-panel">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-serif font-medium tracking-tight text-foreground">
            Design Dialogues
          </h1>
          <nav className="hidden md:flex items-center gap-8">
            <span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
              How it Works
            </span>
            <span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
              Portfolio
            </span>
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
