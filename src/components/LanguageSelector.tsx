import { useLanguage, Language } from '@/contexts/LanguageContext';

const langLabels: Record<Language, string> = {
  hr: 'HR',
  en: 'EN',
  de: 'DE',
  it: 'IT',
};

export function LanguageSelector() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex gap-1">
      {(Object.keys(langLabels) as Language[]).map((lang) => (
        <button
          key={lang}
          onClick={() => setLanguage(lang)}
          className={`px-2 py-1 text-xs font-semibold rounded-md transition-colors ${
            language === lang
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
          }`}
        >
          {langLabels[lang]}
        </button>
      ))}
    </div>
  );
}
