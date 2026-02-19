import { useState, useEffect, useMemo } from 'react';
import { Search } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
}

const ROTATE_INTERVAL = 3000;

export function SearchBar({ value, onChange, onSubmit }: SearchBarProps) {
  const { t, language } = useLanguage();
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  const contextualHints = useMemo(() => {
    const hour = new Date().getHours();
    const isWeekend = [0, 6].includes(new Date().getDay());

    const hints: string[] = [];

    if (language === 'hr') {
      // Time-aware hints
      if (hour >= 6 && hour < 10) {
        hints.push('Pekara otvorena sada', 'Kafić za kavu');
      } else if (hour >= 10 && hour < 14) {
        hints.push('Restoran za ručak', 'Ljekarna u blizini');
      } else if (hour >= 14 && hour < 18) {
        hints.push('Zubar Zadar', 'Trgovina otvorena');
      } else if (hour >= 18 && hour < 22) {
        hints.push('Kafić uz more', 'Restoran za večeru');
      } else {
        hints.push('Noćna ljekarna', 'Benzinska 0-24');
      }

      // Always-relevant
      hints.push('Parking centar', 'Ljekarna otvorena sada');
      if (isWeekend) hints.push('Što je otvoreno nedjeljom?');
    } else {
      if (hour >= 6 && hour < 10) {
        hints.push('Bakery open now', 'Coffee shop nearby');
      } else if (hour >= 10 && hour < 14) {
        hints.push('Restaurant for lunch', 'Pharmacy nearby');
      } else if (hour >= 14 && hour < 18) {
        hints.push('Dentist Zadar', 'Shop open now');
      } else if (hour >= 18 && hour < 22) {
        hints.push('Seaside café', 'Dinner restaurant');
      } else {
        hints.push('Night pharmacy', 'Gas station 24h');
      }
      hints.push('Parking center', 'Pharmacy open now');
      if (isWeekend) hints.push('What is open on Sunday?');
    }

    // Deduplicate
    return [...new Set(hints)];
  }, [language]);

  useEffect(() => {
    if (value) return; // Don't rotate when user is typing
    const timer = setInterval(() => {
      setPlaceholderIndex((i) => (i + 1) % contextualHints.length);
    }, ROTATE_INTERVAL);
    return () => clearInterval(timer);
  }, [value, contextualHints.length]);

  const placeholder = value ? '' : contextualHints[placeholderIndex] || t('search.placeholder');

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
        placeholder={placeholder}
        className="w-full h-12 pl-12 pr-4 rounded-2xl bg-card border border-border text-foreground text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
      />
    </form>
  );
}
