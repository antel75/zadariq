import { Link } from 'react-router-dom';

export const Footer = () => (
  <footer className="border-t border-border/50 bg-secondary/30 mt-8">
    <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between text-xs text-muted-foreground">
      <span>© {new Date().getFullYear()} ZadarIQ</span>
      <Link to="/pravne-informacije" className="hover:text-accent transition-colors">
        Pravne informacije
      </Link>
    </div>
  </footer>
);
