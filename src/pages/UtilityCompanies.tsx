import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { utilityCompanies } from '@/data/utilityCompaniesData';
import { ArrowLeft, Phone, ExternalLink, Building2, Wrench, AlertTriangle, Mail, Clock, MapPin, MessageSquareWarning, Link } from 'lucide-react';
import { motion } from 'framer-motion';

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.05, duration: 0.35 },
  }),
};

export default function UtilityCompanies() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen gradient-bg">
      <header className="sticky top-0 z-30 glass border-b border-border/50">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-xl hover:bg-secondary transition-colors">
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <div>
            <h1 className="text-base font-bold text-foreground">{t('utilities.title')}</h1>
            <p className="text-xs text-muted-foreground">{t('utilities.subtitle')}</p>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pb-8">
        {utilityCompanies.map((company, idx) => (
          <motion.div
            key={company.id}
            className="mt-4 rounded-2xl bg-card border border-border overflow-hidden"
            variants={fadeUp} initial="hidden" animate="visible" custom={idx}
          >
            {/* Company header */}
            <div className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 rounded-xl bg-primary/10">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-bold text-foreground text-sm">{company.name}</h2>
                  <p className="text-xs text-muted-foreground">{company.address}</p>
                </div>
              </div>

              {/* Contact buttons */}
              <div className="flex flex-wrap gap-2 mb-3">
                <a
                  href={`tel:${company.centralPhone.replace(/\s/g, '')}`}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-accent/10 text-accent text-xs font-medium hover:bg-accent/20 transition-colors"
                >
                  <Phone className="h-3.5 w-3.5" />
                  {company.centralPhone}
                </a>
                {company.emergencyPhone && (
                  <a
                    href={`tel:${company.emergencyPhone.replace(/\s/g, '')}`}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-destructive/10 text-destructive text-xs font-medium hover:bg-destructive/20 transition-colors"
                  >
                    <AlertTriangle className="h-3.5 w-3.5" />
                    {t('utilities.emergency')}: {company.emergencyPhone}
                  </a>
                )}
                <a
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-secondary text-secondary-foreground text-xs font-medium hover:bg-secondary/80 transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Web
                </a>
                {company.email && (
                  <a
                    href={`mailto:${company.email}`}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-secondary text-secondary-foreground text-xs font-medium hover:bg-secondary/80 transition-colors"
                  >
                    <Mail className="h-3.5 w-3.5" />
                    Email
                  </a>
                )}
              </div>

              {company.workingHours && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  {company.workingHours}
                </div>
              )}
            </div>

            {/* Services */}
            <div className="border-t border-border/50 bg-secondary/20 px-4 py-3">
              <p className="text-xs font-semibold text-foreground mb-2">{t('utilities.services')}</p>
              <div className="flex flex-col gap-1.5">
                {company.services.map((svc, j) => (
                  <div key={j} className="flex items-start justify-between gap-2 py-1.5">
                    <div className="flex items-start gap-2 min-w-0 flex-1">
                      <Wrench className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        {svc.link ? (
                          <a href={svc.link} target="_blank" rel="noopener noreferrer" className="text-xs text-accent font-medium hover:underline">
                            {svc.name}
                          </a>
                        ) : (
                          <span className="text-xs text-muted-foreground">{svc.name}</span>
                        )}
                        {svc.description && (
                          <p className="text-[10px] text-muted-foreground/70 mt-0.5">{svc.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {svc.email && (
                        <a href={`mailto:${svc.email}`} className="text-[10px] text-accent hover:underline">
                          <Mail className="h-3 w-3" />
                        </a>
                      )}
                      {svc.phone && (
                        <a
                          href={`tel:${svc.phone.replace(/\s/g, '')}`}
                          className="text-xs text-accent font-medium hover:underline"
                        >
                          {svc.phone}
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Complaints info */}
            {company.complaintsInfo && (
              <div className="border-t border-border/50 px-4 py-3">
                <div className="flex items-start gap-2">
                  <MessageSquareWarning className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-foreground mb-1">Prigovori i reklamacije</p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">{company.complaintsInfo}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Branches */}
            {company.branches && company.branches.length > 0 && (
              <div className="border-t border-border/50 bg-secondary/10 px-4 py-3">
                <p className="text-xs font-semibold text-foreground mb-2">Ispostave</p>
                <div className="flex flex-col gap-2">
                  {company.branches.map((branch, k) => (
                    <div key={k} className="flex items-start gap-2">
                      <MapPin className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-medium text-foreground">{branch.name}</p>
                        <p className="text-[10px] text-muted-foreground">{branch.address}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </main>
    </div>
  );
}
