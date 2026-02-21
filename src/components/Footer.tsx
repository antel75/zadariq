import { Link } from 'react-router-dom';

export const Footer = () => (
  <footer className="border-t border-border/50 bg-secondary/30 mt-8">
    <div className="max-w-2xl mx-auto px-4 py-5 flex flex-col gap-1.5 text-xs">
      <Link
        to="/pravne-informacije"
        className="text-accent font-medium underline underline-offset-2 hover:text-accent/80 transition-colors"
      >
        Pravne informacije
      </Link>
      <Link
        to="/data-sources"
        className="text-accent font-medium underline underline-offset-2 hover:text-accent/80 transition-colors"
      >
        Izvori podataka
      </Link>
      <p className="text-[10px] text-muted-foreground/60 leading-relaxed mt-1">
        ZadarIQ je nezavisni informativni projekt čiji je cilj objediniti javno dostupne gradske informacije na jednom mjestu radi lakšeg snalaženja građana i posjetitelja.
      </p>
      <span className="text-muted-foreground">© {new Date().getFullYear()} ZadarIQ</span>
    </div>
  </footer>
);
