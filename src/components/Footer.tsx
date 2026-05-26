import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="container mx-auto px-4 md:px-6 py-8 md:py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <Link 
            to="/" 
            className="font-serif text-lg font-medium text-foreground"
          >
            Dizaino Dialogai
          </Link>
          
          {/* Social Placeholders */}
          <div className="flex items-center gap-6">
            <a
              href="https://www.instagram.com/dizainodialogai/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Instagram
            </a>
            <a
              href="https://www.facebook.com/profile.php?id=61557522695205"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Facebook
            </a>
          </div>
          
          {/* Copyright */}
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Dizaino Dialogai. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
