import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSelector } from '@/components/LanguageSelector';
import { FieldReportButton } from '@/components/FieldReportButton';
import { ZadarIQLogo } from '@/components/ZadarIQLogo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Footer } from '@/components/Footer';
import { ReportModal } from '@/components/ReportModal';
import { HomeDashboard } from '@/components/dashboard/HomeDashboard';
import { Business } from '@/data/types';
import { Siren, Briefcase } from 'lucide-react';

const Index = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [reportTarget, setReportTarget] = useState<Business | null>(null);

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
              className="px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Briefcase className="h-3.5 w-3.5" />
              Za tvrtke
            </button>
            <ThemeToggle />
            <LanguageSelector />
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pb-8">
        <HomeDashboard onReportTarget={setReportTarget} reportTarget={reportTarget} />
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
