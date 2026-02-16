import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { ArrowLeft, Landmark, Building2, Wrench } from 'lucide-react';
import { motion } from 'framer-motion';
import { Footer } from '@/components/Footer';

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.05, duration: 0.35 },
  }),
};

const menuItems = [
  { id: 'grad-zadar', labelKey: 'publicServices.gradZadar', route: '/public-services/grad-zadar', icon: Landmark, desc: 'Narodni trg 1, Zadar' },
  { id: 'zadarska-zupanija', labelKey: 'publicServices.zadarskaZupanija', route: '/public-services/zadarska-zupanija', icon: Building2, desc: 'Božidara Petranovića 8, Zadar' },
  { id: 'komunalne-tvrtke', labelKey: 'utilities.menuLabel', route: '/utility-companies', icon: Wrench, desc: 'Čistoća, Vodovod, HEP...' },
];

export default function PublicServicesMenu() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen gradient-bg">
      <header className="sticky top-0 z-30 glass border-b border-border/50">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-xl hover:bg-secondary transition-colors">
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <h1 className="text-base font-bold text-foreground">{t('publicServices.title')}</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        <div className="flex flex-col gap-3">
          {menuItems.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.button
                key={item.id}
                onClick={() => navigate(item.route)}
                className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border hover:border-accent/50 hover:bg-accent/5 transition-all text-left active:scale-[0.98]"
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={i}
              >
                <div className="p-3 rounded-xl bg-primary/10 shrink-0">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-foreground">{t(item.labelKey)}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                </div>
              </motion.button>
            );
          })}
        </div>
      </main>
      <Footer />
    </div>
  );
}
