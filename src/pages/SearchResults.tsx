import { useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { SearchBar } from '@/components/SearchBar';
import { BusinessCard } from '@/components/BusinessCard';
import { ReportModal } from '@/components/ReportModal';
import { searchBusinesses, isBusinessOpen } from '@/data/mockData';
import { Business } from '@/data/types';
import { ArrowLeft, Filter } from 'lucide-react';

export default function SearchResults() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const initialQ = params.get('q') || '';
  const [query, setQuery] = useState(initialQ);
  const [openOnly, setOpenOnly] = useState(false);
  const [reportTarget, setReportTarget] = useState<Business | null>(null);

  const results = useMemo(() => {
    let r = searchBusinesses(query);
    if (openOnly) r = r.filter(isBusinessOpen);
    return r;
  }, [query, openOnly]);

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
      </header>

      <main className="max-w-lg mx-auto px-4 pb-8">
        <div className="flex items-center justify-between mt-4 mb-4">
          <h2 className="text-sm font-semibold text-foreground">
            {t('search.results')} ({results.length})
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
            <p className="text-center text-muted-foreground py-12 text-sm">No results found</p>
          )}
        </div>
      </main>

      <ReportModal business={reportTarget} open={!!reportTarget} onClose={() => setReportTarget(null)} />
    </div>
  );
}
