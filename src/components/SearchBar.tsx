import { Search } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
}

export function SearchBar({ value, onChange, onSubmit }: SearchBarProps) {
  const { t } = useLanguage();

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); onSubmit(); }}
      className="relative w-full"
    >
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t('search.placeholder')}
        className="w-full h-14 pl-12 pr-4 rounded-2xl bg-card border border-border text-foreground text-base shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
      />
    </form>
  );
}
