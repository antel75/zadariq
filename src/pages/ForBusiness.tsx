import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  ArrowLeft, ShieldCheck, BarChart3, Megaphone, Users,
  TrendingUp, Star, Eye, CheckCircle2, ArrowRight,
} from 'lucide-react';

const benefits = [
  { icon: ShieldCheck, titleKey: 'forbiz.benefit1.title', descKey: 'forbiz.benefit1.desc', color: 'text-status-open' },
  { icon: BarChart3, titleKey: 'forbiz.benefit2.title', descKey: 'forbiz.benefit2.desc', color: 'text-accent' },
  { icon: Megaphone, titleKey: 'forbiz.benefit3.title', descKey: 'forbiz.benefit3.desc', color: 'text-primary' },
  { icon: Users, titleKey: 'forbiz.benefit4.title', descKey: 'forbiz.benefit4.desc', color: 'text-accent' },
  { icon: TrendingUp, titleKey: 'forbiz.benefit5.title', descKey: 'forbiz.benefit5.desc', color: 'text-status-open' },
  { icon: Eye, titleKey: 'forbiz.benefit6.title', descKey: 'forbiz.benefit6.desc', color: 'text-primary' },
];

export default function ForBusiness() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-xl hover:bg-muted transition-colors">
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <h1 className="text-base font-semibold text-foreground">{t('forbiz.title')}</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pb-8">
        {/* Hero */}
        <div className="mt-8 mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <Star className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">{t('forbiz.hero.title')}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">{t('forbiz.hero.subtitle')}</p>
        </div>

        {/* Benefits */}
        <div className="space-y-3 mb-8">
          {benefits.map((b, i) => (
            <div key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-card border border-border">
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                <b.icon className={`h-5 w-5 ${b.color}`} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-0.5">{t(b.titleKey)}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{t(b.descKey)}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Trust economy explanation */}
        <div className="mb-8 p-5 rounded-2xl bg-accent/5 border border-accent/20">
          <h3 className="text-sm font-semibold text-accent mb-2 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            {t('forbiz.trustEconomy.title')}
          </h3>
          <ul className="space-y-2">
            {['forbiz.trustEconomy.rule1', 'forbiz.trustEconomy.rule2', 'forbiz.trustEconomy.rule3'].map(key => (
              <li key={key} className="flex items-start gap-2 text-xs text-muted-foreground">
                <CheckCircle2 className="h-3.5 w-3.5 text-accent mt-0.5 flex-shrink-0" />
                {t(key)}
              </li>
            ))}
          </ul>
        </div>

        {/* CTA */}
        <button
          onClick={() => navigate('/search')}
          className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
        >
          {t('forbiz.cta')}
          <ArrowRight className="h-4 w-4" />
        </button>

        <p className="text-center text-xs text-muted-foreground mt-3">{t('forbiz.free')}</p>
      </main>
    </div>
  );
}
