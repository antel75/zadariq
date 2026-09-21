import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useWeather } from '@/hooks/useWeather';
import { LanguageSelector } from '@/components/LanguageSelector';
import { Footer } from '@/components/Footer';
import { PushOptInBanner } from '@/components/PushOptInBanner';
import { OutdoorAdviceBanner } from '@/components/dashboard/OutdoorAdviceBanner';
import { TodayAlerts } from '@/components/dashboard/TodayAlerts';
import { DailyPollCard } from '@/components/dashboard/DailyPollCard';
import {
  ArrowLeft, Sunrise, Pill, CalendarDays, ShoppingCart, Phone,
  MapPin, ChevronRight, Thermometer,
} from 'lucide-react';

// ── helpers ──

function zagrebToday(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Zagreb', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date());
}

function zagrebParts() {
  const fmt = new Intl.DateTimeFormat('hr-HR', {
    timeZone: 'Europe/Zagreb', weekday: 'long', day: 'numeric', month: 'long',
  });
  const hour = Number(
    new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Zagreb', hour: '2-digit', hour12: false }).format(new Date())
  );
  return { label: fmt.format(new Date()), hour };
}

function upcomingSunday(): string {
  const today = zagrebToday();
  const d = new Date(`${today}T12:00:00Z`);
  const dow = d.getUTCDay();
  d.setUTCDate(d.getUTCDate() + (dow === 0 ? 0 : 7 - dow));
  return d.toISOString().split('T')[0];
}

const G = (hr: string, en: string) => ({ hr, en });

// ── data ──

function useBriefData() {
  const today = zagrebToday();
  const sunday = upcomingSunday();

  const pharmacy = useQuery({
    queryKey: ['danas-pharmacy', today],
    queryFn: async () => {
      const { data } = await supabase
        .from('duty_services')
        .select('name, phone, address, notes, type')
        .eq('enabled', true)
        .lte('valid_from', today)
        .gte('valid_until', today)
        .eq('type', 'pharmacy')
        .limit(1);
      return data?.[0] ?? null;
    },
    staleTime: 10 * 60 * 1000,
  });

  const events = useQuery({
    queryKey: ['danas-events', today],
    queryFn: async () => {
      const { data } = await supabase
        .from('city_events')
        .select('id, title, venue, location, category, website_url, event_date_from, event_date_to')
        .lte('event_date_from', today)
        .gte('event_date_to', today)
        .eq('region', 'zadar')
        .limit(4);
      return data ?? [];
    },
    staleTime: 10 * 60 * 1000,
  });

  const sundayShops = useQuery({
    queryKey: ['danas-sunday', sunday],
    queryFn: async () => {
      const { data } = await supabase
        .from('shop_sunday_schedule')
        .select('id, fetched_at')
        .eq('sunday_date', sunday);
      return { count: data?.length ?? 0, sunday };
    },
    staleTime: 30 * 60 * 1000,
  });

  return { pharmacy, events, sundayShops };
}

// ── UI ──

function Card({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  const Tag: any = onClick ? 'button' : 'div';
  return (
    <Tag
      onClick={onClick}
      className={`w-full text-left rounded-2xl border border-border bg-card/80 backdrop-blur-sm p-4 ${
        onClick ? 'hover:border-accent/40 transition-colors' : ''
      }`}
    >
      {children}
    </Tag>
  );
}

function Row({ icon, title, children, action }: {
  icon: React.ReactNode; title: string; children?: React.ReactNode; action?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 text-accent shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">{title}</p>
        {children}
      </div>
      {action && <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />}
    </div>
  );
}

export default function ZadarDanas() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const lang = language === 'hr' ? 'hr' : 'en';
  const weather = useWeather();
  const { pharmacy, events, sundayShops } = useBriefData();
  const { label: dateLabel, hour } = zagrebParts();

  const greeting =
    hour < 11 ? G('Dobro jutro', 'Good morning')
    : hour < 18 ? G('Dobar dan', 'Good afternoon')
    : G('Dobra večer', 'Good evening');

  const sundayCount = sundayShops.data?.count ?? 0;

  return (
    <div className="min-h-screen bg-background pb-24">
      <Helmet>
        <title>Zadar danas — vrijeme, dežurna ljekarna, događanja | ZadarIQ</title>
        <meta
          name="description"
          content="Svako jutro sve što trebaš znati o Zadru: vrijeme i savjet za van, dežurna ljekarna, današnja događanja i što radi nedjeljom."
        />
      </Helmet>

      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/90 backdrop-blur-md border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate('/')} className="p-1.5 rounded-lg hover:bg-muted transition-colors" aria-label="Natrag">
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-foreground leading-tight">Zadar danas</h1>
            <p className="text-[11px] text-muted-foreground capitalize truncate">{dateLabel}</p>
          </div>
          <LanguageSelector />
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-4 space-y-4">
        {/* Greeting + temperature */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Sunrise className="h-4 w-4 text-accent" />
                  <span className="text-sm font-semibold text-foreground">{greeting[lang]}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {lang === 'hr' ? 'Sve što ti danas treba, na jednom mjestu.' : 'Everything you need today, in one place.'}
                </p>
              </div>
              {weather.data && (
                <div className="flex items-center gap-1.5 text-foreground">
                  <Thermometer className="h-4 w-4 text-accent" />
                  <span className="text-2xl font-bold tabular-nums">{weather.data.tempC}°</span>
                </div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Outdoor advice */}
        <OutdoorAdviceBanner />

        {/* City alerts */}
        <TodayAlerts />

        {/* Duty pharmacy */}
        <Card>
          <Row icon={<Pill className="h-4 w-4" />} title={lang === 'hr' ? 'Dežurna ljekarna' : 'Duty pharmacy'}>
            {pharmacy.data ? (
              <>
                <p className="text-sm font-semibold text-foreground">{pharmacy.data.name}</p>
                {pharmacy.data.address && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <MapPin className="h-3 w-3" /> {pharmacy.data.address}
                  </p>
                )}
                {pharmacy.data.phone && (
                  <a href={`tel:${pharmacy.data.phone}`} className="text-xs text-accent flex items-center gap-1 mt-1">
                    <Phone className="h-3 w-3" /> {pharmacy.data.phone}
                  </a>
                )}
              </>
            ) : (
              <button onClick={() => navigate('/category/pharmacy?open=1')} className="text-sm text-accent">
                {lang === 'hr' ? 'Pogledaj otvorene ljekarne →' : 'See open pharmacies →'}
              </button>
            )}
          </Row>
        </Card>

        {/* Today's events */}
        <Card onClick={() => navigate('/events')}>
          <Row icon={<CalendarDays className="h-4 w-4" />} title={lang === 'hr' ? 'Danas u gradu' : 'Today in town'} action>
            {events.data && events.data.length > 0 ? (
              <ul className="space-y-1">
                {events.data.map(e => (
                  <li key={e.id} className="text-sm text-foreground truncate">
                    • {e.title}
                    {e.venue && <span className="text-muted-foreground"> — {e.venue}</span>}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                {lang === 'hr' ? 'Nema zabilježenih događanja za danas.' : 'No events listed for today.'}
              </p>
            )}
          </Row>
        </Card>

        {/* Sunday */}
        <Card onClick={() => navigate('/radar?layer=sunday')}>
          <Row icon={<ShoppingCart className="h-4 w-4" />} title={lang === 'hr' ? 'Radna nedjelja' : 'Sunday shopping'} action>
            <p className="text-sm text-foreground">
              {sundayCount > 0
                ? lang === 'hr'
                  ? `${sundayCount} trgovina radi u nedjelju`
                  : `${sundayCount} shops open on Sunday`
                : lang === 'hr'
                  ? 'Popis za nedjelju još nije objavljen'
                  : 'Sunday list not published yet'}
            </p>
          </Row>
        </Card>

        {/* Daily poll */}
        <DailyPollCard />
      </main>

      <PushOptInBanner />
      <Footer />
    </div>
  );
}
