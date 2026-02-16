import { useState, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { businesses, isBusinessOpen, categories } from '@/data/mockData';
import { BusinessCard } from '@/components/BusinessCard';
import { ReportModal } from '@/components/ReportModal';
import { Business, CategoryId } from '@/data/types';
import { ArrowLeft, Filter, Plus } from 'lucide-react';
import { Footer } from '@/components/Footer';

// Extract the meaningful sort key from a business name
function getSortKey(name: string): string {
  let n = name;
  // Remove common prefixes
  const prefixes = [
    'Ordinacija dentalne medicine ', 'Ord. dentalne medicine ',
    'Stomatološka ordinacija ', 'Stom. ordinacija ',
    'Stomatološka poliklinika ', 'Dentalna poliklinika ',
    'Dental Practice ', 'Dental Center ', 'Ordinacija dr. ',
    'Ordinacija ', 'Dr. sc. ', 'Dr. ',
  ];
  for (const p of prefixes) {
    if (n.startsWith(p)) { n = n.slice(p.length); break; }
  }
  // Remove trailing titles after comma: ", dr. med. dent." etc.
  n = n.replace(/,\s*dr\..*$/i, '').trim();
  // If it looks like "FirstName LastName" (2+ words, no "Dental/Centar/Clinic" etc.), use last word (surname)
  const words = n.split(/\s+/);
  const brandWords = ['dental', 'dent', 'centar', 'center', 'clinic', 'medical', 'd.o.o.', 'poliklinika'];
  const isPersonName = words.length >= 2 && !brandWords.some(bw => n.toLowerCase().includes(bw));
  if (isPersonName) {
    // Last word is surname
    return words[words.length - 1].toLowerCase();
  }
  // For brand names, strip generic suffixes like "Dental", "Centar", "Clinic" from the front
  const significantWords = words.filter(w => !brandWords.includes(w.toLowerCase()) && w !== '—' && w !== '-');
  return (significantWords[0] || words[0]).toLowerCase();
}

export default function CategoryBrowse() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [openOnly, setOpenOnly] = useState(searchParams.get('open') === '1');
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
    // Sort alphabetically by meaningful sort key
    r.sort((a, b) => getSortKey(a.name).localeCompare(getSortKey(b.name), 'hr'));
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
          <div className="flex items-center gap-2">
            {categoryId === 'cafes' && (
              <button
                onClick={() => navigate('/add-cafe')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Plus className="h-3 w-3" />
                {t('addCafe.addButton')}
              </button>
            )}
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
      <Footer />
      <ReportModal business={reportTarget} open={!!reportTarget} onClose={() => setReportTarget(null)} />
    </div>
  );
}
