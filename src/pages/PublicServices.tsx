import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { publicServiceOrgs } from '@/data/publicServicesData';
import { ArrowLeft, Phone, ExternalLink, Building2, ChevronDown, ChevronRight, Mail, User } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.05, duration: 0.35 },
  }),
};

export default function PublicServices() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { orgId } = useParams<{ orgId: string }>();
  const [expandedDept, setExpandedDept] = useState<string | null>(null);

  const org = publicServiceOrgs[orgId || 'grad-zadar'];

  if (!org) {
    navigate('/');
    return null;
  }

  return (
    <div className="min-h-screen gradient-bg">
      {/* Header */}
      <header className="sticky top-0 z-30 glass border-b border-border/50">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-xl hover:bg-secondary transition-colors">
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <div>
            <h1 className="text-base font-bold text-foreground">{t('publicServices.title')}</h1>
            <p className="text-xs text-muted-foreground">{t('publicServices.subtitle')}</p>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pb-8">
        {/* Org header */}
        <motion.div
          className="mt-4 p-4 rounded-2xl bg-card border border-border"
          variants={fadeUp} initial="hidden" animate="visible" custom={0}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-xl bg-primary/10">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="font-bold text-foreground">{org.name}</h2>
              <p className="text-xs text-muted-foreground">{org.address}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {org.centralPhone && (
              <a
                href={`tel:${org.centralPhone.replace(/\s/g, '')}`}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-accent/10 text-accent text-xs font-medium hover:bg-accent/20 transition-colors"
              >
                <Phone className="h-3.5 w-3.5" />
                {t('publicServices.centrala')}: {org.centralPhone}
              </a>
            )}
            <a
              href={org.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-secondary text-secondary-foreground text-xs font-medium hover:bg-secondary/80 transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Web
            </a>
          </div>
        </motion.div>

        {/* Departments */}
        <motion.div
          className="mt-4"
          variants={fadeUp} initial="hidden" animate="visible" custom={1}
        >
          <h3 className="text-sm font-semibold text-foreground mb-2">{t('publicServices.departments')}</h3>
          <div className="flex flex-col gap-2">
            {org.departments.map((dept, i) => {
              const hasExpandable = (dept.contacts && dept.contacts.length > 0) || (dept.subunits && dept.subunits.length > 0);
              const isExpanded = expandedDept === dept.id;

              return (
                <motion.div
                  key={dept.id}
                  className="rounded-xl bg-card border border-border overflow-hidden"
                  variants={fadeUp} initial="hidden" animate="visible" custom={i + 2}
                >
                  <button
                    onClick={() => hasExpandable ? setExpandedDept(isExpanded ? null : dept.id) : undefined}
                    className={`w-full flex items-center gap-3 p-3 text-left ${hasExpandable ? 'cursor-pointer hover:bg-secondary/30' : ''} transition-colors`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground leading-snug">{dept.name}</p>
                      {dept.contacts && dept.contacts.length > 0 && !isExpanded && (
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {dept.contacts[0].name} — {dept.contacts[0].title}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {dept.website && (
                        <a
                          href={dept.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-1.5 rounded-lg hover:bg-accent/10 text-muted-foreground hover:text-accent transition-colors"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                      {hasExpandable && (
                        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      )}
                    </div>
                  </button>

                  {/* Expanded content */}
                  {hasExpandable && isExpanded && (
                    <div className="border-t border-border/50">
                      {/* Contacts */}
                      {dept.contacts && dept.contacts.length > 0 && (
                        <div className="bg-primary/5 px-3 py-2.5">
                          <p className="text-[11px] font-semibold text-primary uppercase tracking-wider mb-1.5">Kontakti</p>
                          <div className="flex flex-col gap-2">
                            {dept.contacts.map((contact, j) => (
                              <div key={j} className="flex items-start gap-2">
                                <User className="h-3.5 w-3.5 text-primary/60 mt-0.5 shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-medium text-foreground">{contact.name}</p>
                                  <p className="text-[11px] text-muted-foreground">{contact.title}</p>
                                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                                    {contact.phone && (
                                      <a href={`tel:${contact.phone.replace(/\s/g, '')}`} className="text-[11px] text-accent hover:underline flex items-center gap-1">
                                        <Phone className="h-2.5 w-2.5" />
                                        {contact.phone}
                                      </a>
                                    )}
                                    {contact.email && (
                                      <a href={`mailto:${contact.email}`} className="text-[11px] text-accent hover:underline flex items-center gap-1 truncate">
                                        <Mail className="h-2.5 w-2.5 shrink-0" />
                                        <span className="truncate">{contact.email}</span>
                                      </a>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Subunits */}
                      {dept.subunits && dept.subunits.length > 0 && (
                        <div className="bg-secondary/20 px-3 py-2">
                          {dept.contacts && dept.contacts.length > 0 && (
                            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Odsjeci</p>
                          )}
                          {dept.subunits.map((sub, j) => (
                            <div key={j} className="flex items-start gap-2 py-1.5">
                              <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" />
                              <div className="min-w-0">
                                <span className="text-xs text-muted-foreground">{sub.name}</span>
                                {(sub.phone || sub.email) && (
                                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                                    {sub.phone && (
                                      <a href={`tel:${sub.phone.replace(/\s/g, '')}`} className="text-[11px] text-accent hover:underline flex items-center gap-1">
                                        <Phone className="h-2.5 w-2.5" />
                                        {sub.phone}
                                      </a>
                                    )}
                                    {sub.email && (
                                      <a href={`mailto:${sub.email}`} className="text-[11px] text-accent hover:underline flex items-center gap-1">
                                        <Mail className="h-2.5 w-2.5" />
                                        {sub.email}
                                      </a>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
