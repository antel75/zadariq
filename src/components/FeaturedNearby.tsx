import { businesses, isBusinessOpen, getTodayHours } from '@/data/mockData';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { Star, Tag, Users as UsersIcon } from 'lucide-react';

export function FeaturedNearby() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  // Max 3 featured businesses that are open
  const featured = businesses
    .filter(b => b.featured && isBusinessOpen(b) !== false)
    .slice(0, 3);

  if (featured.length === 0) return null;

  return (
    <section className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Star className="h-4 w-4 text-accent" />
        <h2 className="text-sm font-semibold text-foreground">{t('featured.title')}</h2>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
        {featured.map(b => (
          <div
            key={b.id}
            onClick={() => navigate(`/business/${b.id}`)}
            className="flex-shrink-0 w-56 p-3 rounded-2xl bg-card border border-accent/20 cursor-pointer hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 rounded-full bg-status-open text-status-open-foreground text-[10px] font-bold">
                {t('status.open')}
              </span>
              {b.occupancy && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  b.occupancy === 'quiet' ? 'bg-status-open/20 text-status-open' :
                  b.occupancy === 'busy' ? 'bg-destructive/20 text-destructive' :
                  'bg-accent/20 text-accent'
                }`}>
                  {t(`biz.occupancy.${b.occupancy}`)}
                </span>
              )}
            </div>
            <h3 className="text-sm font-semibold text-foreground truncate mb-0.5">{b.name}</h3>
            <p className="text-[11px] text-muted-foreground truncate mb-2">{b.address}</p>
            {b.dailyOffer && (
              <div className="flex items-center gap-1 text-[11px] text-accent">
                <Tag className="h-3 w-3" />
                <span className="truncate">{b.dailyOffer}</span>
              </div>
            )}
            {b.announcement && !b.dailyOffer && (
              <p className="text-[11px] text-muted-foreground truncate">{b.announcement}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
