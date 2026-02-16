import { Link } from 'react-router-dom';

export const Footer = () => (
  <footer className="border-t border-border/50 bg-secondary/30 mt-8">
    <div className="max-w-2xl mx-auto px-4 py-5 flex items-center justify-between text-xs">
      <span className="text-muted-foreground">© {new Date().getFullYear()} ZadarIQ</span>
      <Link
        to="/pravne-informacije"
        className="text-accent font-medium underline underline-offset-2 hover:text-accent/80 transition-colors"
      >
        Pravne informacije
      </Link>
    </div>
  </footer>
);
