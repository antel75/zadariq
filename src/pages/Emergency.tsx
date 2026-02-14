import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { emergencyContacts } from '@/data/mockData';
import { ArrowLeft, Phone, Siren } from 'lucide-react';

export default function Emergency() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-xl hover:bg-muted transition-colors">
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <Siren className="h-5 w-5 text-destructive" />
          <h1 className="text-base font-semibold text-foreground">{t('emergency.title')}</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pb-8 mt-6">
        <div className="flex flex-col gap-3">
          {emergencyContacts.map((contact) => (
            <div key={contact.id} className="p-4 rounded-2xl bg-card border border-border">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-foreground">{t(contact.nameKey)}</h3>
                  {contact.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">{contact.description}</p>
                  )}
                </div>
                <span className="text-2xl font-bold text-primary tabular-nums">{contact.number}</span>
              </div>
              <a
                href={`tel:${contact.number}`}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-destructive text-destructive-foreground font-semibold text-sm hover:bg-destructive/90 transition-colors"
              >
                <Phone className="h-4 w-4" />
                {t('action.call')}
              </a>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
