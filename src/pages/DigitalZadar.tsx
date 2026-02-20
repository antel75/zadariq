import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { digitalServiceCategories } from '@/data/digitalServicesData';
import {
  ArrowLeft, ExternalLink, Lightbulb,
  Recycle, Zap, Receipt, Droplets, Truck,
  Car, Smartphone,
  Landmark, FileText, Map, MapPin, Building2,
  Ship, Bus, Route, Gauge,
  Heart, ShieldCheck, CalendarCheck,
  KeyRound, Package,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Footer } from '@/components/Footer';

const iconMap: Record<string, React.ElementType> = {
  Recycle, Zap, Receipt, Droplets, Truck,
  Car, Smartphone,
  Landmark, FileText, Map, MapPin, Building2,
  Ship, Bus, Route, Gauge,
  Heart, ShieldCheck, CalendarCheck,
  KeyRound, Package,
};

const categoryColors: Record<string, string> = {
  utilities: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  parking: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  government: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  transport: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
  health: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
  finance: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
};

const categoryLabelMap: Record<string, Record<string, string>> = {
  'digital.cat.utilities': { hr: 'Komunalne usluge', en: 'Utilities' },
  'digital.cat.parking': { hr: 'Parking', en: 'Parking' },
  'digital.cat.government': { hr: 'Javna uprava', en: 'Government' },
  'digital.cat.transport': { hr: 'Prijevoz', en: 'Transport' },
  'digital.cat.health': { hr: 'Zdravstvo', en: 'Health' },
  'digital.cat.finance': { hr: 'Financije i pošta', en: 'Finance & Post' },
};

export default function DigitalZadar() {
  const { language } = useLanguage();
  const navigate = useNavigate();

  const getCatLabel = (key: string) => categoryLabelMap[key]?.[language] || categoryLabelMap[key]?.hr || key;

  return (
    <div className="min-h-screen gradient-bg">
      <header className="sticky top-0 z-30 glass border-b border-border/50">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-xl hover:bg-secondary transition-colors">
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <div>
            <h1 className="text-base font-bold text-foreground">
              {language === 'en' ? 'My Digital Zadar' : 'Moj digitalni Zadar'}
            </h1>
            <p className="text-xs text-muted-foreground">
              {language === 'en' ? 'All city services in one place' : 'Svi gradski servisi na jednom mjestu'}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pb-8">
        {/* Intro banner */}
        <motion.div
          className="mt-4 p-4 rounded-2xl bg-primary/5 border border-primary/20"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-primary/10 shrink-0">
              <Lightbulb className="h-4 w-4 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {language === 'en'
                ? 'Quick access to all digital services you need as a Zadar citizen. Tap any card to open the login page directly.'
                : 'Brzi pristup svim digitalnim uslugama koje su ti potrebne kao građaninu Zadra. Klikni na karticu i otvori login stranicu.'}
            </p>
          </div>
        </motion.div>

        {digitalServiceCategories.map((cat, catIdx) => (
          <motion.div
            key={cat.id}
            className="mt-5"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: catIdx * 0.06, duration: 0.35 }}
          >
            <h2 className="text-sm font-bold text-foreground mb-2.5 flex items-center gap-2">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold ${categoryColors[cat.id] || 'bg-secondary text-secondary-foreground'}`}>
                {getCatLabel(cat.labelKey)}
              </span>
            </h2>

            <div className="flex flex-col gap-2">
              {cat.services.map((svc) => {
                const Icon = iconMap[svc.icon] || ExternalLink;
                return (
                  <a
                    key={svc.id}
                    href={svc.loginUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-start gap-3 p-3.5 rounded-xl bg-card border border-border hover:border-primary/30 hover:shadow-sm transition-all"
                  >
                    <div className={`p-2 rounded-lg shrink-0 ${categoryColors[cat.id] || 'bg-secondary text-secondary-foreground'}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                          {svc.name}
                        </span>
                        <ExternalLink className="h-3 w-3 text-muted-foreground/50 shrink-0" />
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{svc.description}</p>
                      {svc.proTip && (
                        <div className="flex items-start gap-1.5 mt-1.5 px-2 py-1.5 rounded-lg bg-amber-500/5 border border-amber-500/10">
                          <Lightbulb className="h-3 w-3 text-amber-500 shrink-0 mt-0.5" />
                          <span className="text-[10px] text-amber-700 dark:text-amber-400 leading-relaxed">{svc.proTip}</span>
                        </div>
                      )}
                    </div>
                  </a>
                );
              })}
            </div>
          </motion.div>
        ))}
      </main>
      <Footer />
    </div>
  );
}
