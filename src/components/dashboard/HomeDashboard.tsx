import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUserMode, UserMode } from '@/hooks/useUserMode';
import { useSituationalMode } from '@/hooks/useSituationalMode';
import { useAppMode } from '@/hooks/useAppMode';
import { businesses, isBusinessOpen } from '@/data/mockData';
import { Business, CategoryId } from '@/data/types';
import { Sparkles, MapPin } from 'lucide-react';

// Existing components — no changes to any of them
import { ModePillSwitch } from './ModePillSwitch';
import { NowInZadar } from './NowInZadar';
import { MatchModeHeader } from './MatchModeHeader';
import { ModeIndicator } from './ModeIndicator';
import { ZadarClock } from './ZadarClock';
import { TodayAlerts } from './TodayAlerts';
import { QuickActions } from './QuickActions';
import { TouristQuickActions } from './TouristQuickActions';
import { ForYouSection } from './ForYouSection';
import { TransportWidget } from './TransportWidget';
import { EvChargerWidget } from './EvChargerWidget';
import { TodayCard } from './TodayCard';
import { CityPulseSection } from './CityPulseSection';
import { DailyPollCard } from './DailyPollCard';
import { WhatIsHappeningToday } from './WhatIsHappeningToday';
import { FeaturedNearby } from '@/components/FeaturedNearby';
import { SearchBar } from '@/components/SearchBar';
import { CategoryScroll } from '@/components/CategoryScroll';
import { BusinessCard } from '@/components/BusinessCard';
import { ReportModal } from '@/components/ReportModal';

// Feature flag
const residentTouristModeEnabled = true;

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

interface HomeDashboardProps {
  onReportTarget: (b: Business | null) => void;
  reportTarget: Business | null;
}

export function HomeDashboard({ onReportTarget, reportTarget }: HomeDashboardProps) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const userMode = useUserMode();
  const modeConfig = useSituationalMode();
  const appMode = useAppMode();
  const show = modeConfig.showSections;
  const isMatchActive = appMode.mode !== 'normal';

  const [query, setQuery] = useState('');

  const handleSearch = () => {
    if (query.trim()) navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  const handleCategory = (id: CategoryId) => {
    if (id === 'emergency') navigate('/emergency');
    else navigate(`/category/${id}`);
  };

  const trendingSearches = [
    { label: 'Ljekarna otvorena sada', path: '/category/pharmacy?open=1' },
    { label: 'Parking stari grad', path: '/parking' },
    { label: 'Zubar Zadar', path: '/category/dentist' },
    { label: 'Kafić uz more', path: '/category/cafes' },
  ];

  const nearbyOpen = businesses.filter(b => isBusinessOpen(b)).slice(0, 4);

  // If feature flag disabled, render original order (fallback)
  if (!residentTouristModeEnabled) {
    return <OriginalLayout
      modeConfig={modeConfig} appMode={appMode} show={show} isMatchActive={isMatchActive}
      query={query} setQuery={setQuery} handleSearch={handleSearch} handleCategory={handleCategory}
      trendingSearches={trendingSearches} nearbyOpen={nearbyOpen}
      onReportTarget={onReportTarget} t={t} navigate={navigate}
    />;
  }

  const mode = userMode.mode;

  let sectionIndex = 0;

  const Section = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
    <motion.section
      className={className}
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      custom={sectionIndex++}
    >
      {children}
    </motion.section>
  );

  // Common blocks
  const clockBlock = (
    <div className="mt-3 mb-1">
      <ZadarClock />
    </div>
  );

  const pillSwitch = (
    <Section className="mb-2">
      <ModePillSwitch mode={mode} onToggle={(m) => userMode.setManualMode(m)} />
    </Section>
  );

  const modeIndicatorBlock = (
    <Section className="mb-2">
      <ModeIndicator config={modeConfig} />
    </Section>
  );

  const matchOrNow = (
    <Section className="mb-4">
      {isMatchActive && appMode.match ? (
        <MatchModeHeader mode={appMode.mode} match={appMode.match} />
      ) : null}
      <NowInZadar mode={modeConfig.mode} appMode={appMode.mode} />
    </Section>
  );

  const searchBlock = show.search ? (
    <Section className="mb-4">
      <SearchBar value={query} onChange={setQuery} onSubmit={handleSearch} />
    </Section>
  ) : null;

  const quickActionsBlock = show.quickActions ? (
    <Section className="mb-4">{mode === 'tourist' ? <TouristQuickActions /> : <QuickActions />}</Section>
  ) : null;

  const alertsBlock = show.alerts ? (
    <Section className="mb-4"><TodayAlerts /></Section>
  ) : null;

  const transportBlock = show.transport ? (
    <Section className="mb-4"><TransportWidget /></Section>
  ) : null;

  const evChargerBlock = (
    <Section className="mb-4"><EvChargerWidget /></Section>
  );

  const todayCardBlock = show.todayCard ? (
    <Section className="mb-4"><TodayCard /></Section>
  ) : null;

  const categoriesBlock = show.categories ? (
    <Section className="mb-6"><CategoryScroll onSelect={handleCategory} /></Section>
  ) : null;

  const featuredBlock = show.featuredNearby ? (
    <Section><FeaturedNearby /></Section>
  ) : null;

  const dailyPollBlock = (
    <Section className="mb-6"><DailyPollCard /></Section>
  );

  const cityPulseBlock = (
    <Section className="mb-6"><CityPulseSection /></Section>
  );

  const forYouBlock = show.forYou ? (
    <Section className="mb-6"><ForYouSection onReport={onReportTarget} /></Section>
  ) : null;

  const trendingBlock = show.trending ? (
    <Section className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-4 w-4 text-accent" />
        <h2 className="text-sm font-semibold text-foreground">{t('home.trending')}</h2>
      </div>
      <div className="flex flex-wrap gap-2">
        {trendingSearches.map(s => (
          <button key={s.label} onClick={() => navigate(s.path)}
            className="px-3 py-1.5 rounded-full bg-secondary/80 text-secondary-foreground text-xs font-medium hover:bg-accent/15 hover:text-accent transition-all duration-200"
          >{s.label}</button>
        ))}
      </div>
    </Section>
  ) : null;

  const nearbyBlock = show.nearbyOpen ? (
    <Section>
      <div className="flex items-center gap-2 mb-3">
        <MapPin className="h-4 w-4 text-accent" />
        <h2 className="text-sm font-semibold text-foreground">{t('home.nearby')}</h2>
      </div>
      <div className="flex flex-col gap-3">
        {nearbyOpen.map(b => (
          <BusinessCard key={b.id} business={b} onReport={onReportTarget} />
        ))}
      </div>
    </Section>
  ) : null;

  const whatIsHappeningBlock = (
    <Section className="mb-6 mt-2"><WhatIsHappeningToday /></Section>
  );

  // =============================================
  // RESIDENT layout
  // =============================================
  if (mode === 'resident') {
    return (
      <>
        {clockBlock}
        {pillSwitch}
        {modeIndicatorBlock}
        {matchOrNow}
        {quickActionsBlock}
        {searchBlock}
        {forYouBlock}
        {evChargerBlock}
        {alertsBlock}
        {todayCardBlock}
        {transportBlock}
        {categoriesBlock}
        {whatIsHappeningBlock}
        {dailyPollBlock}
        {cityPulseBlock}
        {featuredBlock}
        {trendingBlock}
        {nearbyBlock}
      </>
    );
  }

  // =============================================
  // TOURIST layout
  // =============================================
  return (
    <>
      {clockBlock}
      {pillSwitch}
      {modeIndicatorBlock}
      {todayCardBlock}
      {matchOrNow}
      {searchBlock}
      {whatIsHappeningBlock}
      {categoriesBlock}
      {featuredBlock}
      {transportBlock}
      {alertsBlock}
      {evChargerBlock}
      {quickActionsBlock}
      {dailyPollBlock}
      {cityPulseBlock}
      {forYouBlock}
      {trendingBlock}
      {nearbyBlock}
    </>
  );
}

// Fallback: exact original layout when feature flag is off
function OriginalLayout({ modeConfig, appMode, show, isMatchActive, query, setQuery, handleSearch, handleCategory, trendingSearches, nearbyOpen, onReportTarget, t, navigate }: any) {
  let sectionIndex = 0;
  return (
    <>
      <div className="mt-3 mb-1"><ZadarClock /></div>
      <motion.div className="mb-2" variants={fadeUp} initial="hidden" animate="visible" custom={sectionIndex++}>
        <ModeIndicator config={modeConfig} />
      </motion.div>
      <motion.section className="mb-4" variants={fadeUp} initial="hidden" animate="visible" custom={sectionIndex++}>
        {isMatchActive && appMode.match ? <MatchModeHeader mode={appMode.mode} match={appMode.match} /> : null}
        <NowInZadar mode={modeConfig.mode} appMode={appMode.mode} />
      </motion.section>
      {show.quickActions && <motion.section className="mb-4" variants={fadeUp} initial="hidden" animate="visible" custom={sectionIndex++}><QuickActions /></motion.section>}
      {show.search && <motion.div className="mb-4" variants={fadeUp} initial="hidden" animate="visible" custom={sectionIndex++}><SearchBar value={query} onChange={setQuery} onSubmit={handleSearch} /></motion.div>}
      {show.alerts && <motion.section className="mb-4" variants={fadeUp} initial="hidden" animate="visible" custom={sectionIndex++}><TodayAlerts /></motion.section>}
      {show.transport && <motion.section className="mb-4" variants={fadeUp} initial="hidden" animate="visible" custom={sectionIndex++}><TransportWidget /></motion.section>}
      <motion.section className="mb-4" variants={fadeUp} initial="hidden" animate="visible" custom={sectionIndex++}><EvChargerWidget /></motion.section>
      {show.todayCard && <motion.section className="mb-4" variants={fadeUp} initial="hidden" animate="visible" custom={sectionIndex++}><TodayCard /></motion.section>}
      {show.categories && <motion.section className="mb-6" variants={fadeUp} initial="hidden" animate="visible" custom={sectionIndex++}><CategoryScroll onSelect={handleCategory} /></motion.section>}
      {show.featuredNearby && <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={sectionIndex++}><FeaturedNearby /></motion.div>}
      <motion.section className="mb-6" variants={fadeUp} initial="hidden" animate="visible" custom={sectionIndex++}><DailyPollCard /></motion.section>
      <motion.section className="mb-6" variants={fadeUp} initial="hidden" animate="visible" custom={sectionIndex++}><CityPulseSection /></motion.section>
      {show.forYou && <motion.section className="mb-6" variants={fadeUp} initial="hidden" animate="visible" custom={sectionIndex++}><ForYouSection onReport={onReportTarget} /></motion.section>}
      {show.trending && (
        <motion.section className="mb-6" variants={fadeUp} initial="hidden" animate="visible" custom={sectionIndex++}>
          <div className="flex items-center gap-2 mb-3"><Sparkles className="h-4 w-4 text-accent" /><h2 className="text-sm font-semibold text-foreground">{t('home.trending')}</h2></div>
          <div className="flex flex-wrap gap-2">{trendingSearches.map((s: any) => <button key={s.label} onClick={() => navigate(s.path)} className="px-3 py-1.5 rounded-full bg-secondary/80 text-secondary-foreground text-xs font-medium hover:bg-accent/15 hover:text-accent transition-all duration-200">{s.label}</button>)}</div>
        </motion.section>
      )}
      {show.nearbyOpen && (
        <motion.section variants={fadeUp} initial="hidden" animate="visible" custom={sectionIndex++}>
          <div className="flex items-center gap-2 mb-3"><MapPin className="h-4 w-4 text-accent" /><h2 className="text-sm font-semibold text-foreground">{t('home.nearby')}</h2></div>
          <div className="flex flex-col gap-3">{nearbyOpen.map((b: any) => <BusinessCard key={b.id} business={b} onReport={onReportTarget} />)}</div>
        </motion.section>
      )}
      <motion.section className="mb-6 mt-2" variants={fadeUp} initial="hidden" animate="visible" custom={sectionIndex++}><WhatIsHappeningToday /></motion.section>
    </>
  );
}
