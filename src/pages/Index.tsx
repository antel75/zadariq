import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSelector } from '@/components/LanguageSelector';
import { SearchBar } from '@/components/SearchBar';
import { CategoryScroll } from '@/components/CategoryScroll';
import { BusinessCard } from '@/components/BusinessCard';
import { ReportModal } from '@/components/ReportModal';
import { FieldReportButton } from '@/components/FieldReportButton';
import { TodayCard } from '@/components/dashboard/TodayCard';
import { TodayAlerts } from '@/components/dashboard/TodayAlerts';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { ForYouSection } from '@/components/dashboard/ForYouSection';
import { businesses, isBusinessOpen } from '@/data/mockData';
import { Business, CategoryId } from '@/data/types';
import { Sparkles, MapPin, Siren } from 'lucide-react';

const Index = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [reportTarget, setReportTarget] = useState<Business | null>(null);

  const handleSearch = () => {
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  const handleCategory = (id: CategoryId) => {
    if (id === 'emergency') {
      navigate('/emergency');
    } else {
      navigate(`/category/${id}`);
    }
  };

  const trendingSearches = [
    'Ljekarna otvorena sada',
    'Parking stari grad',
    'Zubar Zadar',
    'Kafić uz more',
  ];

  const nearbyOpen = businesses
    .filter(b => isBusinessOpen(b))
    .slice(0, 4);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">ZadarIQ</h1>
            <p className="text-[11px] text-muted-foreground">{t('app.subtitle')}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/emergency')}
              className="p-2 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
            >
              <Siren className="h-4 w-4" />
            </button>
            <LanguageSelector />
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pb-8">
        {/* Dashboard: Today in Zadar */}
        <section className="mt-4 mb-4">
          <TodayCard />
        </section>

        {/* Dashboard: Alerts */}
        <section className="mb-4">
          <TodayAlerts />
        </section>

        {/* Dashboard: Quick Actions */}
        <section className="mb-5">
          <QuickActions />
        </section>

        {/* Search */}
        <div className="mb-5">
          <SearchBar value={query} onChange={setQuery} onSubmit={handleSearch} />
        </div>

        {/* Categories */}
        <section className="mb-6">
          <CategoryScroll onSelect={handleCategory} />
        </section>

        {/* For You Today */}
        <section className="mb-6">
          <ForYouSection onReport={setReportTarget} />
        </section>

        {/* Trending */}
        <section className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-accent" />
            <h2 className="text-sm font-semibold text-foreground">{t('home.trending')}</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {trendingSearches.map((s) => (
              <button
                key={s}
                onClick={() => { setQuery(s); navigate(`/search?q=${encodeURIComponent(s)}`); }}
                className="px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-xs font-medium hover:bg-secondary/80 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </section>

        {/* Nearby open */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="h-4 w-4 text-accent" />
            <h2 className="text-sm font-semibold text-foreground">{t('home.nearby')}</h2>
          </div>
          <div className="flex flex-col gap-3">
            {nearbyOpen.map((b) => (
              <BusinessCard key={b.id} business={b} onReport={setReportTarget} />
            ))}
          </div>
        </section>
      </main>

      <ReportModal
        business={reportTarget}
        open={!!reportTarget}
        onClose={() => setReportTarget(null)}
      />
      <FieldReportButton />
    </div>
  );
};

export default Index;
