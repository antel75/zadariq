import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { businesses, getTodayHours } from '@/data/mockData';
import { OccupancyLevel } from '@/data/types';
import { TrustBadge } from '@/components/TrustBadge';
import {
  ArrowLeft, Save, Eye, Phone, Navigation, Clock, Megaphone,
  Users, Tag, Activity, BarChart3, CheckCircle2,
} from 'lucide-react';

export default function BusinessOwnerPanel() {
  const { id } = useParams();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const business = businesses.find(b => b.id === id);

  const [hours, setHours] = useState(business?.workingHours || { mon: '', tue: '', wed: '', thu: '', fri: '', sat: '', sun: '' });
  const [phone, setPhone] = useState(business?.phone || '');
  const [occupancy, setOccupancy] = useState<OccupancyLevel>(business?.occupancy || 'normal');
  const [dailyOffer, setDailyOffer] = useState(business?.dailyOffer || '');
  const [announcement, setAnnouncement] = useState(business?.announcement || '');
  const [saved, setSaved] = useState(false);

  if (!business) return <div className="p-8 text-center text-muted-foreground">Not found</div>;

  const analytics = business.analytics || { viewsToday: 0, callsClicked: 0, navigationClicks: 0 };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const dayLabels = [
    { key: 'mon', label: t('days.mon') },
    { key: 'tue', label: t('days.tue') },
    { key: 'wed', label: t('days.wed') },
    { key: 'thu', label: t('days.thu') },
    { key: 'fri', label: t('days.fri') },
    { key: 'sat', label: t('days.sat') },
    { key: 'sun', label: t('days.sun') },
  ];

  const occupancyOptions: { value: OccupancyLevel; label: string; color: string }[] = [
    { value: 'quiet', label: t('biz.occupancy.quiet'), color: 'bg-status-open text-status-open-foreground' },
    { value: 'normal', label: t('biz.occupancy.normal'), color: 'bg-accent/20 text-accent' },
    { value: 'busy', label: t('biz.occupancy.busy'), color: 'bg-destructive/20 text-destructive' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-xl hover:bg-muted transition-colors">
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-semibold text-foreground truncate">{t('biz.panel')}</h1>
            <p className="text-xs text-muted-foreground truncate">{business.name}</p>
          </div>
          <TrustBadge status={business.verificationStatus} size="md" />
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pb-8">
        {/* Analytics */}
        <section className="mt-6 mb-6 p-4 rounded-2xl bg-card border border-border">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-4 w-4 text-accent" />
            <h2 className="text-sm font-semibold text-foreground">{t('biz.analytics')}</h2>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 rounded-xl bg-muted">
              <Eye className="h-4 w-4 mx-auto mb-1 text-accent" />
              <p className="text-lg font-bold text-foreground">{analytics.viewsToday}</p>
              <p className="text-[10px] text-muted-foreground">{t('biz.views')}</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-muted">
              <Phone className="h-4 w-4 mx-auto mb-1 text-accent" />
              <p className="text-lg font-bold text-foreground">{analytics.callsClicked}</p>
              <p className="text-[10px] text-muted-foreground">{t('biz.calls')}</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-muted">
              <Navigation className="h-4 w-4 mx-auto mb-1 text-accent" />
              <p className="text-lg font-bold text-foreground">{analytics.navigationClicks}</p>
              <p className="text-[10px] text-muted-foreground">{t('biz.navClicks')}</p>
            </div>
          </div>
        </section>

        {/* Occupancy */}
        <section className="mb-6 p-4 rounded-2xl bg-card border border-border">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="h-4 w-4 text-accent" />
            <h2 className="text-sm font-semibold text-foreground">{t('biz.setOccupancy')}</h2>
          </div>
          <div className="flex gap-2">
            {occupancyOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => setOccupancy(opt.value)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  occupancy === opt.value ? opt.color + ' ring-2 ring-offset-2 ring-accent' : 'bg-muted text-muted-foreground'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </section>

        {/* Daily offer */}
        <section className="mb-6 p-4 rounded-2xl bg-card border border-border">
          <div className="flex items-center gap-2 mb-3">
            <Tag className="h-4 w-4 text-accent" />
            <h2 className="text-sm font-semibold text-foreground">{t('biz.dailyOffer')}</h2>
          </div>
          <input
            type="text"
            value={dailyOffer}
            onChange={e => setDailyOffer(e.target.value)}
            placeholder={t('biz.dailyOfferPlaceholder')}
            className="w-full h-11 px-4 rounded-xl bg-muted border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </section>

        {/* Announcement */}
        <section className="mb-6 p-4 rounded-2xl bg-card border border-border">
          <div className="flex items-center gap-2 mb-3">
            <Megaphone className="h-4 w-4 text-accent" />
            <h2 className="text-sm font-semibold text-foreground">{t('biz.announcement')}</h2>
          </div>
          <textarea
            value={announcement}
            onChange={e => setAnnouncement(e.target.value)}
            placeholder={t('biz.announcementPlaceholder')}
            rows={3}
            className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent resize-none"
          />
        </section>

        {/* Phone */}
        <section className="mb-6 p-4 rounded-2xl bg-card border border-border">
          <div className="flex items-center gap-2 mb-3">
            <Phone className="h-4 w-4 text-accent" />
            <h2 className="text-sm font-semibold text-foreground">{t('detail.contact')}</h2>
          </div>
          <input
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            className="w-full h-11 px-4 rounded-xl bg-muted border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </section>

        {/* Working hours */}
        <section className="mb-6 p-4 rounded-2xl bg-card border border-border">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4 text-accent" />
            <h2 className="text-sm font-semibold text-foreground">{t('detail.workingHours')}</h2>
          </div>
          <div className="space-y-2">
            {dayLabels.map(d => (
              <div key={d.key} className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground font-medium w-10">{d.label}</span>
                <input
                  type="text"
                  value={(hours as any)[d.key]}
                  onChange={e => setHours({ ...hours, [d.key]: e.target.value })}
                  className="flex-1 h-9 px-3 rounded-lg bg-muted border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            ))}
          </div>
        </section>

        {/* Community corrections */}
        <section className="mb-6 p-4 rounded-2xl bg-card border border-border">
          <div className="flex items-center gap-2 mb-3">
            <Users className="h-4 w-4 text-accent" />
            <h2 className="text-sm font-semibold text-foreground">{t('biz.corrections')}</h2>
          </div>
          {business.reportCount > 0 ? (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                {business.reportCount} {t('biz.reportsReceived')}
              </p>
              <button className="w-full py-2.5 rounded-xl bg-accent/10 text-accent text-sm font-medium hover:bg-accent/20 transition-colors">
                {t('biz.respondToReports')}
              </button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t('biz.noReports')}</p>
          )}
        </section>

        {/* Save button */}
        <button
          onClick={handleSave}
          className={`w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
            saved
              ? 'bg-status-open text-status-open-foreground'
              : 'bg-primary text-primary-foreground hover:bg-primary/90'
          }`}
        >
          {saved ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {saved ? t('biz.saved') : t('biz.saveChanges')}
        </button>

        {/* Trust explanation */}
        <div className="mt-6 p-4 rounded-2xl bg-accent/5 border border-accent/20">
          <p className="text-xs text-accent font-medium mb-1">{t('biz.trustExplain.title')}</p>
          <p className="text-xs text-muted-foreground leading-relaxed">{t('biz.trustExplain.body')}</p>
        </div>
      </main>
    </div>
  );
}
