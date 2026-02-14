import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'hr' | 'en' | 'de' | 'it';

type Translations = Record<string, Record<Language, string>>;

const translations: Translations = {
  'app.title': { hr: 'ZadarIQ', en: 'ZadarIQ', de: 'ZadarIQ', it: 'ZadarIQ' },
  'app.subtitle': { hr: 'Pametni gradski asistent', en: 'Smart City Assistant', de: 'Smarter Stadtassistent', it: 'Assistente Città Intelligente' },
  'search.placeholder': { hr: 'Pitaj Zadar bilo što…', en: 'Ask Zadar anything…', de: 'Frag Zadar alles…', it: 'Chiedi qualsiasi cosa a Zara…' },
  'search.results': { hr: 'Rezultati pretrage', en: 'Search Results', de: 'Suchergebnisse', it: 'Risultati della ricerca' },
  'status.open': { hr: 'OTVORENO', en: 'OPEN', de: 'GEÖFFNET', it: 'APERTO' },
  'status.closed': { hr: 'ZATVORENO', en: 'CLOSED', de: 'GESCHLOSSEN', it: 'CHIUSO' },
  'status.verified': { hr: 'Verificirano', en: 'Verified', de: 'Verifiziert', it: 'Verificato' },
  'status.community': { hr: 'Zajednica', en: 'Community', de: 'Gemeinschaft', it: 'Comunità' },
  'status.possiblyIncorrect': { hr: 'Moguće netočno', en: 'Possibly incorrect', de: 'Möglicherweise falsch', it: 'Possibilmente errato' },
  'action.call': { hr: 'Pozovi', en: 'Call', de: 'Anrufen', it: 'Chiama' },
  'action.navigate': { hr: 'Navigiraj', en: 'Navigate', de: 'Navigieren', it: 'Naviga' },
  'action.report': { hr: 'Prijavi netočne podatke', en: 'Report incorrect info', de: 'Falsche Info melden', it: 'Segnala informazioni errate' },
  'action.claimOwner': { hr: 'Ja sam vlasnik', en: 'I am the owner', de: 'Ich bin der Besitzer', it: 'Sono il proprietario' },
  'action.filter.openNow': { hr: 'Otvoreno sada', en: 'Open now', de: 'Jetzt geöffnet', it: 'Aperto ora' },
  'action.back': { hr: 'Natrag', en: 'Back', de: 'Zurück', it: 'Indietro' },
  'category.pharmacy': { hr: 'Ljekarna', en: 'Pharmacy', de: 'Apotheke', it: 'Farmacia' },
  'category.doctor': { hr: 'Doktor / Zubar', en: 'Doctor / Dentist', de: 'Arzt / Zahnarzt', it: 'Medico / Dentista' },
  'category.shops': { hr: 'Trgovine', en: 'Shops', de: 'Geschäfte', it: 'Negozi' },
  'category.restaurants': { hr: 'Restorani', en: 'Restaurants', de: 'Restaurants', it: 'Ristoranti' },
  'category.cafes': { hr: 'Kafići', en: 'Cafes', de: 'Cafés', it: 'Caffè' },
  'category.parking': { hr: 'Parking', en: 'Parking', de: 'Parken', it: 'Parcheggio' },
  'category.transport': { hr: 'Prijevoz', en: 'Transport', de: 'Transport', it: 'Trasporti' },
  'category.emergency': { hr: 'Hitno', en: 'Emergency', de: 'Notfall', it: 'Emergenza' },
  'category.events': { hr: 'Događanja', en: 'Events', de: 'Veranstaltungen', it: 'Eventi' },
  'category.publicServices': { hr: 'Javne službe', en: 'Public Services', de: 'Öffentliche Dienste', it: 'Servizi Pubblici' },
  'detail.workingHours': { hr: 'Radno vrijeme', en: 'Working Hours', de: 'Öffnungszeiten', it: 'Orario di lavoro' },
  'detail.contact': { hr: 'Kontakt', en: 'Contact', de: 'Kontakt', it: 'Contatto' },
  'detail.lastVerified': { hr: 'Zadnja provjera', en: 'Last verified', de: 'Zuletzt überprüft', it: 'Ultima verifica' },
  'report.title': { hr: 'Prijavi problem', en: 'Report Issue', de: 'Problem melden', it: 'Segnala problema' },
  'report.closed': { hr: 'Zatvoreno', en: 'Closed', de: 'Geschlossen', it: 'Chiuso' },
  'report.moved': { hr: 'Preselio', en: 'Moved', de: 'Umgezogen', it: 'Trasferito' },
  'report.wrongHours': { hr: 'Krivo radno vrijeme', en: 'Wrong hours', de: 'Falsche Öffnungszeiten', it: 'Orario errato' },
  'report.phoneIncorrect': { hr: 'Pogrešan telefon', en: 'Phone incorrect', de: 'Telefon falsch', it: 'Telefono errato' },
  'report.thanks': { hr: 'Hvala na prijavi!', en: 'Thanks for reporting!', de: 'Danke für die Meldung!', it: 'Grazie per la segnalazione!' },
  'claim.title': { hr: 'Preuzmi vlasništvo', en: 'Claim Ownership', de: 'Eigentum beanspruchen', it: 'Rivendica proprietà' },
  'claim.email': { hr: 'Vaš email', en: 'Your email', de: 'Ihre E-Mail', it: 'La tua email' },
  'claim.code': { hr: 'Unesite kod', en: 'Enter code', de: 'Code eingeben', it: 'Inserisci codice' },
  'claim.verify': { hr: 'Potvrdi', en: 'Verify', de: 'Bestätigen', it: 'Verifica' },
  'claim.codeSent': { hr: 'Kod poslan na email!', en: 'Code sent to email!', de: 'Code an E-Mail gesendet!', it: 'Codice inviato via email!' },
  'claim.submit': { hr: 'Pošalji zahtjev', en: 'Submit request', de: 'Anfrage senden', it: 'Invia richiesta' },
  'claim.success': { hr: 'Verificirano! Možete uređivati podatke.', en: 'Verified! You can now edit info.', de: 'Verifiziert! Sie können Infos bearbeiten.', it: 'Verificato! Puoi modificare le info.' },
  'emergency.title': { hr: 'Hitni brojevi', en: 'Emergency Numbers', de: 'Notfallnummern', it: 'Numeri di emergenza' },
  'emergency.police': { hr: 'Policija', en: 'Police', de: 'Polizei', it: 'Polizia' },
  'emergency.ambulance': { hr: 'Hitna pomoć', en: 'Ambulance', de: 'Krankenwagen', it: 'Ambulanza' },
  'emergency.fire': { hr: 'Vatrogasci', en: 'Fire Department', de: 'Feuerwehr', it: 'Vigili del fuoco' },
  'emergency.hospital': { hr: 'Bolnica', en: 'Hospital', de: 'Krankenhaus', it: 'Ospedale' },
  'emergency.touristPolice': { hr: 'Turistička policija', en: 'Tourist Police', de: 'Touristenpolizei', it: 'Polizia turistica' },
  'home.trending': { hr: 'Popularno', en: 'Trending', de: 'Beliebt', it: 'Di tendenza' },
  'home.nearby': { hr: 'U blizini', en: 'Nearby', de: 'In der Nähe', it: 'Nelle vicinanze' },
  'days.mon': { hr: 'Pon', en: 'Mon', de: 'Mo', it: 'Lun' },
  'days.tue': { hr: 'Uto', en: 'Tue', de: 'Di', it: 'Mar' },
  'days.wed': { hr: 'Sri', en: 'Wed', de: 'Mi', it: 'Mer' },
  'days.thu': { hr: 'Čet', en: 'Thu', de: 'Do', it: 'Gio' },
  'days.fri': { hr: 'Pet', en: 'Fri', de: 'Fr', it: 'Ven' },
  'days.sat': { hr: 'Sub', en: 'Sat', de: 'Sa', it: 'Sab' },
  'days.sun': { hr: 'Ned', en: 'Sun', de: 'So', it: 'Dom' },
  // Trust layer
  'trust.ownerVerified': { hr: 'Vlasnik verificirao', en: 'Owner verified', de: 'Vom Inhaber verifiziert', it: 'Verificato dal proprietario' },
  'trust.communityConfirmed': { hr: 'Zajednica potvrdila', en: 'Community confirmed', de: 'Gemeinschaft bestätigt', it: 'Confermato dalla comunità' },
  'trust.unverified': { hr: 'Nepotvrđeno', en: 'Unverified', de: 'Nicht verifiziert', it: 'Non verificato' },
  'trust.possiblyIncorrect': { hr: 'Moguće netočno', en: 'Possibly incorrect', de: 'Möglicherweise falsch', it: 'Possibilmente errato' },
  'trust.score': { hr: 'Ocjena pouzdanosti', en: 'Trust score', de: 'Vertrauenswert', it: 'Punteggio di fiducia' },
  'trust.lastOwner': { hr: 'Vlasnik potvrdio', en: 'Owner confirmed', de: 'Inhaber bestätigt', it: 'Proprietario confermato' },
  'trust.lastCommunity': { hr: 'Zajednica potvrdila', en: 'Community confirmed', de: 'Gemeinschaft bestätigt', it: 'Comunità confermata' },
  'trust.autoChecked': { hr: 'Automatski provjereno danas', en: 'Automatically checked today', de: 'Heute automatisch geprüft', it: 'Controllato automaticamente oggi' },
  'trust.dataReliability': { hr: 'Pouzdanost podataka', en: 'Data reliability', de: 'Datenzuverlässigkeit', it: 'Affidabilità dati' },
  'trust.warningHidden': { hr: 'Status skriven — previše prijava', en: 'Status hidden — too many reports', de: 'Status verborgen — zu viele Meldungen', it: 'Stato nascosto — troppe segnalazioni' },
  // Field report
  'field.iAmHere': { hr: 'Ja sam ovdje', en: 'I am here now', de: 'Ich bin hier', it: 'Sono qui ora' },
  'field.title': { hr: 'Potvrdi iz terena', en: 'Report from field', de: 'Vor-Ort-Bericht', it: 'Segnala dal campo' },
  'field.subtitle': { hr: 'Potvrdi je li otvoreno ili zatvoreno', en: 'Confirm if open or closed', de: 'Bestätigen ob geöffnet oder geschlossen', it: 'Conferma se aperto o chiuso' },
  'field.thanks': { hr: 'Hvala!', en: 'Thanks!', de: 'Danke!', it: 'Grazie!' },
  // Dashboard
  'dashboard.today': { hr: 'Danas u Zadru', en: 'Today in Zadar', de: 'Heute in Zadar', it: 'Oggi a Zara' },
  'dashboard.sea': { hr: 'More', en: 'Sea', de: 'Meer', it: 'Mare' },
  'dashboard.sunset': { hr: 'Zalazak', en: 'Sunset', de: 'Sonnenuntergang', it: 'Tramonto' },
  'dashboard.crowd': { hr: 'Stari grad', en: 'Old town', de: 'Altstadt', it: 'Centro storico' },
  'dashboard.parking': { hr: 'Parking', en: 'Parking', de: 'Parken', it: 'Parcheggio' },
  'dashboard.alerts': { hr: 'Obavijesti danas', en: 'Today Alerts', de: 'Meldungen heute', it: 'Avvisi oggi' },
  'dashboard.quickActions': { hr: 'Brze radnje', en: 'Quick Actions', de: 'Schnellaktionen', it: 'Azioni rapide' },
  'weather.sunny': { hr: 'Sunčano', en: 'Sunny', de: 'Sonnig', it: 'Soleggiato' },
  'weather.clear_night': { hr: 'Vedro', en: 'Clear', de: 'Klar', it: 'Sereno' },
  'wind.calm': { hr: 'Mirno', en: 'Calm', de: 'Ruhig', it: 'Calmo' },
  'wind.bura': { hr: 'Bura', en: 'Bura wind', de: 'Bura-Wind', it: 'Bora' },
  'wind.jugo': { hr: 'Jugo', en: 'Jugo wind', de: 'Jugo-Wind', it: 'Scirocco' },
  'crowd.low': { hr: 'Malo', en: 'Low', de: 'Wenig', it: 'Basso' },
  'crowd.medium': { hr: 'Srednje', en: 'Medium', de: 'Mittel', it: 'Medio' },
  'crowd.high': { hr: 'Puno', en: 'Busy', de: 'Voll', it: 'Affollato' },
  'parking.easy': { hr: 'Lako', en: 'Easy', de: 'Einfach', it: 'Facile' },
  'parking.normal': { hr: 'Normalno', en: 'Normal', de: 'Normal', it: 'Normale' },
  'parking.full': { hr: 'Puno', en: 'Full', de: 'Voll', it: 'Pieno' },
  // Alerts
  'alert.dutyPharmacy': { hr: 'Dežurna ljekarna', en: 'Pharmacy on duty', de: 'Dienstapotheke', it: 'Farmacia di turno' },
  'alert.dutyPharmacyDesc': { hr: 'Ljekarna Bili Brig — otvorena do 21:00', en: 'Ljekarna Bili Brig — open until 21:00', de: 'Ljekarna Bili Brig — geöffnet bis 21:00', it: 'Ljekarna Bili Brig — aperta fino alle 21:00' },
  'alert.roadClosed': { hr: 'Cesta zatvorena', en: 'Road closed', de: 'Straße gesperrt', it: 'Strada chiusa' },
  'alert.roadClosedDesc': { hr: 'Široka ulica — radovi do 18h', en: 'Široka ulica — works until 6 PM', de: 'Široka ulica — Bauarbeiten bis 18 Uhr', it: 'Široka ulica — lavori fino alle 18' },
  'alert.eventTonight': { hr: 'Događanje večeras', en: 'Event tonight', de: 'Event heute Abend', it: 'Evento stasera' },
  'alert.eventTonightDesc': { hr: 'Glazbeni večer na Forumu, 20:00', en: 'Music night at Forum, 8 PM', de: 'Musikabend am Forum, 20 Uhr', it: 'Serata musicale al Foro, 20:00' },
  'alert.strongWind': { hr: 'Jak vjetar', en: 'Strong wind', de: 'Starker Wind', it: 'Vento forte' },
  'alert.strongWindDesc': { hr: 'Bura — udari do 55 km/h', en: 'Bura — gusts up to 55 km/h', de: 'Bura — Böen bis 55 km/h', it: 'Bora — raffiche fino a 55 km/h' },
  // Quick actions
  'quick.pharmacyNow': { hr: 'Ljekarna', en: 'Pharmacy', de: 'Apotheke', it: 'Farmacia' },
  'quick.freeParking': { hr: 'Parking', en: 'Parking', de: 'Parken', it: 'Parcheggio' },
  'quick.emergency': { hr: 'Hitno', en: 'Emergency', de: 'Notfall', it: 'Emergenza' },
  'quick.bus': { hr: 'Autobus', en: 'Bus', de: 'Bus', it: 'Autobus' },
  'quick.nightServices': { hr: 'Noćno', en: 'Night', de: 'Nacht', it: 'Notte' },
  // For you
  'foryou.morning': { hr: 'Za tebe ujutro', en: 'For you this morning', de: 'Für dich am Morgen', it: 'Per te stamattina' },
  'foryou.noon': { hr: 'Za ručak u blizini', en: 'Lunch nearby', de: 'Mittagessen in der Nähe', it: 'Pranzo nelle vicinanze' },
  'foryou.evening': { hr: 'Za večeras', en: 'For your evening', de: 'Für deinen Abend', it: 'Per la tua serata' },
  'foryou.night': { hr: 'Noćne usluge', en: 'Night services', de: 'Nachtdienste', it: 'Servizi notturni' },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

function detectLanguage(): Language {
  const browserLang = navigator.language.toLowerCase().slice(0, 2);
  if (browserLang === 'hr') return 'hr';
  if (browserLang === 'de') return 'de';
  if (browserLang === 'it') return 'it';
  if (browserLang === 'en') return 'en';
  return 'hr';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('zadariq-lang');
    return (saved as Language) || detectLanguage();
  });

  useEffect(() => {
    localStorage.setItem('zadariq-lang', language);
  }, [language]);

  const t = (key: string): string => {
    return translations[key]?.[language] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
