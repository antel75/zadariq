import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { ArrowLeft, Database, Building2, Trophy, Film } from 'lucide-react';
import { Footer } from '@/components/Footer';

const sections = {
  hr: [
    {
      title: 'Javni izvori',
      icon: Database,
      items: [
        'DHMZ / Open-Meteo — vremenski podaci',
        'HAK — stanje na cestama',
        'Grad Zadar — komunalne obavijesti',
        'Jadrolinija i prijevoznički servisi — rasporedi',
      ],
    },
    {
      title: 'Poslovni podaci',
      icon: Building2,
      items: [
        'Poslovni subjekti (radna vremena, lokacije)',
        'Podaci zajednice',
      ],
    },
    {
      title: 'Sportski rezultati',
      icon: Trophy,
      items: [
        'Javno dostupni sportski rezultati (rezultati su činjenice, ne autorski sadržaj)',
      ],
    },
    {
      title: 'Kino i događanja',
      icon: Film,
      items: [
        'Prikaz rasporeda uz poveznicu na izvor',
        'Aplikacija ne pohranjuje niti distribuira multimediju',
      ],
    },
  ],
  en: [
    {
      title: 'Public Sources',
      icon: Database,
      items: [
        'DHMZ / Open-Meteo — weather data',
        'HAK — road conditions',
        'City of Zadar — municipal notices',
        'Jadrolinija and transport services — schedules',
      ],
    },
    {
      title: 'Business Data',
      icon: Building2,
      items: [
        'Business entities (working hours, locations)',
        'Community data',
      ],
    },
    {
      title: 'Sports Results',
      icon: Trophy,
      items: [
        'Publicly available sports results (results are facts, not copyrighted content)',
      ],
    },
    {
      title: 'Cinema & Events',
      icon: Film,
      items: [
        'Schedule display with links to source',
        'The application does not store or distribute multimedia',
      ],
    },
  ],
};

export default function DataSources() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const lang = language === 'hr' ? 'hr' : 'en';
  const data = sections[lang];

  return (
    <div className="min-h-screen bg-background pb-8">
      <div className="bg-primary text-primary-foreground px-4 pt-12 pb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold">
            {lang === 'hr' ? '📋 Izvori podataka' : '📋 Data Sources'}
          </h1>
        </div>
      </div>

      <div className="px-4 mt-4 space-y-4 max-w-lg mx-auto">
        {data.map((section) => {
          const Icon = section.icon;
          return (
            <div key={section.title} className="bg-card border border-border rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon className="h-4 w-4 text-accent" />
                <h2 className="text-sm font-semibold text-foreground">{section.title}</h2>
              </div>
              <ul className="space-y-1.5">
                {section.items.map((item) => (
                  <li key={item} className="text-xs text-muted-foreground leading-relaxed pl-6 relative before:content-['•'] before:absolute before:left-2 before:text-accent">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}

        <p className="text-[11px] text-muted-foreground/60 text-center mt-6">
          {lang === 'hr'
            ? 'Ova aplikacija ne predstavlja službenu stranicu nijedne institucije.'
            : 'This application does not represent the official website of any institution.'}
        </p>
      </div>
      <Footer />
    </div>
  );
}
