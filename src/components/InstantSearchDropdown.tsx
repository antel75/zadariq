import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Clock, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { searchBusinesses, isBusinessOpen, categories } from '@/data/mockData';
import { useApprovedPlaces } from '@/hooks/useApprovedPlaces';
import { Business, CategoryId } from '@/data/types';
import { ScrollArea } from '@/components/ui/scroll-area';

interface InstantSearchDropdownProps {
  query: string;
  onSelect: () => void;
}

const CATEGORY_ICONS: Record<string, string> = {
  pharmacy: '💊', doctor: '🩺', dentist: '🦷', medicine: '🩺',
  shops: '🛍️', restaurants: '🍽️', cafes: '☕', gas: '⛽',
  parking: '🅿️', transport: '🚌', emergency: '🚨', events: '📅',
  publicServices: '🏛️',
};

export function InstantSearchDropdown({ query, onSelect }: InstantSearchDropdownProps) {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { data: approvedPlaces } = useApprovedPlaces();

  const trimmed = query.trim();

  // Match categories
  const matchedCategories = useMemo(() => {
    if (!trimmed || trimmed.length < 2) return [];
    const q = trimmed.toLowerCase();
    return categories
      .filter(c => {
        const label = t(c.labelKey).toLowerCase();
        return label.includes(q) || c.id.includes(q);
      })
      .slice(0, 3);
  }, [trimmed, t]);

  // Match businesses
  const matchedBusinesses = useMemo(() => {
    if (!trimmed || trimmed.length < 2) return [];
    return searchBusinesses(trimmed, undefined, approvedPlaces).slice(0, 5);
  }, [trimmed, approvedPlaces]);

  if (!trimmed || trimmed.length < 2) return null;
  if (matchedCategories.length === 0 && matchedBusinesses.length === 0) {
    return (
      <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-popover border border-border rounded-2xl shadow-lg overflow-hidden">
        <div className="px-4 py-6 text-center">
          <p className="text-sm text-muted-foreground">
            {{ hr: 'Nema rezultata za', en: 'No results for', de: 'Keine Ergebnisse für', it: 'Nessun risultato per' }[language] || 'No results for'} "{trimmed}"
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-popover border border-border rounded-2xl shadow-lg overflow-hidden">
      <ScrollArea className="max-h-[360px]">
        {/* Category matches */}
        {matchedCategories.length > 0 && (
          <div className="px-3 pt-3 pb-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-1 mb-1">
              {{ hr: 'Kategorije', en: 'Categories', de: 'Kategorien', it: 'Categorie' }[language] || 'Categories'}
            </p>
            {matchedCategories.map(cat => (
              <button
                key={cat.id}
                onClick={() => {
                  onSelect();
                  if (cat.id === 'emergency') navigate('/emergency');
                  else navigate(`/category/${cat.id}`);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-accent/10 transition-colors text-left group"
              >
                <span className="text-lg">{CATEGORY_ICONS[cat.id] || '📂'}</span>
                <span className="flex-1 text-sm font-medium text-foreground">{t(cat.labelKey)}</span>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>
        )}

        {/* Business matches */}
        {matchedBusinesses.length > 0 && (
          <div className="px-3 pt-2 pb-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-1 mb-1">
              {{ hr: 'Mjesta', en: 'Places', de: 'Orte', it: 'Luoghi' }[language] || 'Places'}
            </p>
            {matchedBusinesses.map(b => {
              const open = isBusinessOpen(b);
              return (
                <button
                  key={b.id}
                  onClick={() => {
                    onSelect();
                    navigate(`/business/${b.id}`);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-accent/10 transition-colors text-left group"
                >
                  <span className="text-lg">{CATEGORY_ICONS[b.category] || '📍'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground truncate">{b.name}</span>
                      {open !== null && (
                        <span className={`flex-shrink-0 w-1.5 h-1.5 rounded-full ${open ? 'bg-[hsl(var(--status-open))]' : 'bg-muted-foreground/40'}`} />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                      <MapPin className="h-3 w-3 flex-shrink-0" />
                      {b.address}
                    </p>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                </button>
              );
            })}
          </div>
        )}

        {/* Search all link */}
        <div className="border-t border-border px-3 py-2">
          <button
            onClick={() => {
              onSelect();
              navigate(`/search?q=${encodeURIComponent(trimmed)}`);
            }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-accent/10 transition-colors text-left"
          >
            <Search className="h-4 w-4 text-accent" />
            <span className="text-sm text-accent font-medium">
              {{ hr: `Pretraži sve za "${trimmed}"`, en: `Search all for "${trimmed}"`, de: `Alle Ergebnisse für "${trimmed}"`, it: `Cerca tutto per "${trimmed}"` }[language] || `Search all for "${trimmed}"`}
            </span>
          </button>
        </div>
      </ScrollArea>
    </div>
  );
}
