import { useState, useEffect, useMemo, useRef } from 'react';
import { Search } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { InstantSearchDropdown } from './InstantSearchDropdown';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
}

const ROTATE_INTERVAL = 3000;

export function SearchBar({ value, onChange, onSubmit }: SearchBarProps) {
  const { t, language } = useLanguage();
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const contextualHints = useMemo(() => {
    const hour = new Date().getHours();
    const isWeekend = [0, 6].includes(new Date().getDay());
    const hints: string[] = [];

    if (language === 'hr') {
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
      hints.push('Parking centar', 'Ljekarna otvorena sada');
      if (isWeekend) hints.push('Što je otvoreno nedjeljom?');
    } else if (language === 'de') {
      if (hour >= 6 && hour < 10) {
        hints.push('Bäckerei jetzt geöffnet', 'Café für Kaffee');
      } else if (hour >= 10 && hour < 14) {
        hints.push('Restaurant zum Mittagessen', 'Apotheke in der Nähe');
      } else if (hour >= 14 && hour < 18) {
        hints.push('Zahnarzt Zadar', 'Geschäft geöffnet');
      } else if (hour >= 18 && hour < 22) {
        hints.push('Café am Meer', 'Restaurant zum Abendessen');
      } else {
        hints.push('Nachtapotheke', 'Tankstelle 0-24');
      }
      hints.push('Parkplatz Zentrum', 'Apotheke jetzt geöffnet');
      if (isWeekend) hints.push('Was hat sonntags geöffnet?');
    } else if (language === 'it') {
      if (hour >= 6 && hour < 10) {
        hints.push('Panetteria aperta ora', 'Caffè per il caffè');
      } else if (hour >= 10 && hour < 14) {
        hints.push('Ristorante per pranzo', 'Farmacia vicina');
      } else if (hour >= 14 && hour < 18) {
        hints.push('Dentista Zadar', 'Negozio aperto');
      } else if (hour >= 18 && hour < 22) {
        hints.push('Caffè sul mare', 'Ristorante per cena');
      } else {
        hints.push('Farmacia notturna', 'Distributore 0-24');
      }
      hints.push('Parcheggio centro', 'Farmacia aperta ora');
      if (isWeekend) hints.push('Cosa è aperto la domenica?');
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

    return [...new Set(hints)];
  }, [language]);

  useEffect(() => {
    if (value) return;
    const timer = setInterval(() => {
      setPlaceholderIndex((i) => (i + 1) % contextualHints.length);
    }, ROTATE_INTERVAL);
    return () => clearInterval(timer);
  }, [value, contextualHints.length]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const placeholder = value ? '' : contextualHints[placeholderIndex] || t('search.placeholder');
  const showDropdown = isFocused && value.trim().length >= 2;

  return (
    <div ref={wrapperRef} className="relative w-full">
      <form
        onSubmit={(e) => { e.preventDefault(); onSubmit(); setIsFocused(false); }}
        className="relative w-full"
      >
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          placeholder={placeholder}
          className="w-full h-12 pl-12 pr-4 rounded-2xl bg-card border border-border text-foreground text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
        />
      </form>

      {showDropdown && (
        <InstantSearchDropdown
          query={value}
          onSelect={() => { setIsFocused(false); onChange(''); }}
        />
      )}
    </div>
  );
}
