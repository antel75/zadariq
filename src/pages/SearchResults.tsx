import { useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { SearchBar } from '@/components/SearchBar';
import { BusinessCard } from '@/components/BusinessCard';
import { ReportModal } from '@/components/ReportModal';
import { searchBusinesses, isBusinessOpen, categories } from '@/data/mockData';
import { Business, CategoryId } from '@/data/types';
import { ArrowLeft, Filter, X } from 'lucide-react';
import { Footer } from '@/components/Footer';

export default function SearchResults() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const initialQ = params.get('q') || '';
  const [query, setQuery] = useState(initialQ);
  const [openOnly, setOpenOnly] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | null>(null);
  const [reportTarget, setReportTarget] = useState<Business | null>(null);

  const results = useMemo(() => {
    let r = searchBusinesses(query, selectedCategory ?? undefined);
    if (openOnly) r = r.filter(isBusinessOpen);
    return r;
  }, [query, openOnly, selectedCategory]);

  const openCount = useMemo(() => results.filter(isBusinessOpen).length, [results]);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-xl hover:bg-muted transition-colors">
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <div className="flex-1">
            <SearchBar value={query} onChange={setQuery} onSubmit={() => {}} />
          </div>
        </div>

        {/* Category filter chips */}
        <div className="max-w-lg mx-auto px-4 pb-3">
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {categories
              .filter(c => c.id !== 'emergency' && c.id !== 'transport')
              .map((cat) => {
                const isActive = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(isActive ? null : cat.id)}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                    }`}
                  >
                    {t(cat.labelKey)}
                    {isActive && <X className="inline ml-1 h-3 w-3" />}
                  </button>
                );
              })}
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pb-8">
        <div className="flex items-center justify-between mt-4 mb-4">
          <h2 className="text-sm font-semibold text-foreground">
            {t('search.results')} ({results.length})
            {openOnly && (
              <span className="ml-1 text-[hsl(var(--status-open))]">
                · {openCount} {t('status.open').toLowerCase()}
              </span>
            )}
          </h2>
          <button
            onClick={() => setOpenOnly(!openOnly)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              openOnly
                ? 'bg-status-open text-status-open-foreground'
                : 'bg-secondary text-secondary-foreground'
            }`}
          >
            <Filter className="h-3 w-3" />
            {t('action.filter.openNow')}
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {results.map((b) => (
            <BusinessCard key={b.id} business={b} onReport={setReportTarget} />
          ))}
          {results.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-sm mb-2">
                {query.trim()
                  ? t('search.noResults') || 'Nema rezultata za ovu pretragu'
                  : t('search.noResults') || 'Nema rezultata'}
              </p>
              {selectedCategory && (
                <button
                  onClick={() => setSelectedCategory(null)}
                  className="text-xs text-primary underline underline-offset-2"
                >
                  {t('search.clearFilter') || 'Ukloni filter kategorije'}
                </button>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
      <ReportModal business={reportTarget} open={!!reportTarget} onClose={() => setReportTarget(null)} />
    </div>
  );
}
