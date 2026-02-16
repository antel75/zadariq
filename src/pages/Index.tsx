import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSelector } from '@/components/LanguageSelector';
import { SearchBar } from '@/components/SearchBar';
import { CategoryScroll } from '@/components/CategoryScroll';
import { BusinessCard } from '@/components/BusinessCard';
import { ReportModal } from '@/components/ReportModal';
import { FieldReportButton } from '@/components/FieldReportButton';
import { NowInZadar } from '@/components/dashboard/NowInZadar';
import { ModeIndicator } from '@/components/dashboard/ModeIndicator';
import { ZadarClock } from '@/components/dashboard/ZadarClock';
import { TodayAlerts } from '@/components/dashboard/TodayAlerts';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { ForYouSection } from '@/components/dashboard/ForYouSection';
import { TransportWidget } from '@/components/dashboard/TransportWidget';
import { TodayCard } from '@/components/dashboard/TodayCard';
import { CityPulseSection } from '@/components/dashboard/CityPulseSection';
import { WhatIsHappeningToday } from '@/components/dashboard/WhatIsHappeningToday';
import { FeaturedNearby } from '@/components/FeaturedNearby';
import { ZadarIQLogo } from '@/components/ZadarIQLogo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Footer } from '@/components/Footer';
import { useSituationalMode } from '@/hooks/useSituationalMode';
import { businesses, isBusinessOpen } from '@/data/mockData';
import { Business, CategoryId } from '@/data/types';
import { Sparkles, MapPin, Siren, Briefcase } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

const Index = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [reportTarget, setReportTarget] = useState<Business | null>(null);
  const modeConfig = useSituationalMode();
  const show = modeConfig.showSections;

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
    { label: 'Ljekarna otvorena sada', path: '/category/pharmacy?open=1' },
    { label: 'Parking stari grad', path: '/parking' },
    { label: 'Zubar Zadar', path: '/category/dentist' },
    { label: 'Kafić uz more', path: '/category/cafes' },
  ];

  const nearbyOpen = businesses
    .filter(b => isBusinessOpen(b))
    .slice(0, 4);

  let sectionIndex = 0;

  return (
    <div className="min-h-screen gradient-bg gradient-mesh">
      {/* Header */}
      <header className="sticky top-0 z-30 glass border-b border-border/50">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <ZadarIQLogo />
            <p className="text-[11px] text-muted-foreground mt-0.5">{t('app.subtitle')}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/emergency')}
              className="p-2 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
            >
              <Siren className="h-4 w-4" />
            </button>
            <button
              onClick={() => navigate('/for-business')}
              className="p-2 rounded-xl bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
              title={t('forbiz.title')}
            >
              <Briefcase className="h-4 w-4" />
            </button>
            <ThemeToggle />
            <LanguageSelector />
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pb-8">
        {/* Zadar Clock */}
        <div className="mt-3 mb-1">
          <ZadarClock />
        </div>

        {/* Mode Indicator */}
        <motion.div
          className="mb-2"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={sectionIndex++}
        >
          <ModeIndicator config={modeConfig} />
        </motion.div>

        {/* SADA U ZADRU — contextual smart cards */}
        <motion.section
          className="mb-4"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={sectionIndex++}
        >
          <NowInZadar mode={modeConfig.mode} />
        </motion.section>

        {/* Quick Actions */}
        {show.quickActions && (
          <motion.section
            className="mb-4"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={sectionIndex++}
          >
            <QuickActions />
          </motion.section>
        )}

        {/* Search */}
        {show.search && (
          <motion.div
            className="mb-4"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={sectionIndex++}
          >
            <SearchBar value={query} onChange={setQuery} onSubmit={handleSearch} />
          </motion.div>
        )}

        {/* Alerts */}
        {show.alerts && (
          <motion.section
            className="mb-4"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={sectionIndex++}
          >
            <TodayAlerts />
          </motion.section>
        )}

        {/* Transport Widget */}
        {show.transport && (
          <motion.section
            className="mb-4"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={sectionIndex++}
          >
            <TransportWidget />
          </motion.section>
        )}

        {/* Weather & city metrics */}
        {show.todayCard && (
          <motion.section
            className="mb-4"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={sectionIndex++}
          >
            <TodayCard />
          </motion.section>
        )}

        {/* Categories */}
        {show.categories && (
          <motion.section
            className="mb-6"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={sectionIndex++}
          >
            <CategoryScroll onSelect={handleCategory} />
          </motion.section>
        )}

        {/* Featured nearby */}
        {show.featuredNearby && (
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={sectionIndex++}
          >
            <FeaturedNearby />
          </motion.div>
        )}

        {/* City Pulse */}
        <motion.section
          className="mb-6"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={sectionIndex++}
        >
          <CityPulseSection />
        </motion.section>

        {/* For You Today */}
        {show.forYou && (
          <motion.section
            className="mb-6"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={sectionIndex++}
          >
            <ForYouSection onReport={setReportTarget} />
          </motion.section>
        )}

        {/* Trending */}
        {show.trending && (
          <motion.section
            className="mb-6"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={sectionIndex++}
          >
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-accent" />
              <h2 className="text-sm font-semibold text-foreground">{t('home.trending')}</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {trendingSearches.map((s) => (
                <button
                  key={s.label}
                  onClick={() => navigate(s.path)}
                  className="px-3 py-1.5 rounded-full bg-secondary/80 text-secondary-foreground text-xs font-medium hover:bg-accent/15 hover:text-accent transition-all duration-200"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </motion.section>
        )}

        {/* Nearby open */}
        {show.nearbyOpen && (
          <motion.section
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={sectionIndex++}
          >
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="h-4 w-4 text-accent" />
              <h2 className="text-sm font-semibold text-foreground">{t('home.nearby')}</h2>
            </div>
            <div className="flex flex-col gap-3">
              {nearbyOpen.map((b) => (
                <BusinessCard key={b.id} business={b} onReport={setReportTarget} />
              ))}
            </div>
          </motion.section>
        )}

        {/* ŠTO SE DOGAĐA DANAS — live city radar */}
        <motion.section
          className="mb-6 mt-2"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={sectionIndex++}
        >
          <WhatIsHappeningToday />
        </motion.section>
      </main>

      <ReportModal
        business={reportTarget}
        open={!!reportTarget}
        onClose={() => setReportTarget(null)}
      />
      <FieldReportButton />
      <Footer />
    </div>
  );
};

export default Index;
