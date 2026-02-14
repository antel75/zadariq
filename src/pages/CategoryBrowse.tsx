import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { businesses, isBusinessOpen, categories } from '@/data/mockData';
import { BusinessCard } from '@/components/BusinessCard';
import { ReportModal } from '@/components/ReportModal';
import { Business, CategoryId } from '@/data/types';
import { ArrowLeft, Filter } from 'lucide-react';

export default function CategoryBrowse() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [openOnly, setOpenOnly] = useState(false);
  const [reportTarget, setReportTarget] = useState<Business | null>(null);

  const category = categories.find(c => c.id === categoryId);

  const results = useMemo(() => {
    let r = businesses.filter(b => {
      if (categoryId === 'doctor') {
        return b.category === 'doctor' || b.category === 'dentist' || b.category === 'medicine';
      }
      return b.category === categoryId;
    });
    if (openOnly) r = r.filter(isBusinessOpen);
    return r;
  }, [categoryId, openOnly]);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-xl hover:bg-muted transition-colors">
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <h1 className="text-base font-semibold text-foreground">
            {category ? t(category.labelKey) : categoryId}
          </h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pb-8">
        <div className="flex items-center justify-between mt-4 mb-4">
          <span className="text-sm text-muted-foreground">{results.length} results</span>
          <button
            onClick={() => setOpenOnly(!openOnly)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              openOnly ? 'bg-status-open text-status-open-foreground' : 'bg-secondary text-secondary-foreground'
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
            <p className="text-center text-muted-foreground py-12 text-sm">No businesses found</p>
          )}
        </div>
      </main>

      <ReportModal business={reportTarget} open={!!reportTarget} onClose={() => setReportTarget(null)} />
    </div>
  );
}
