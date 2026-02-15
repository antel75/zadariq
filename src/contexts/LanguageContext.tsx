import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'hr' | 'en' | 'de' | 'it';

type Translations = Record<string, Record<Language, string>>;

const translations: Translations = {
  'app.title': { hr: 'ZadarIQ', en: 'ZadarIQ', de: 'ZadarIQ', it: 'ZadarIQ' },
  'app.subtitle': { hr: 'Pametni gradski asistent', en: 'Smart City Assistant', de: 'Smarter Stadtassistent', it: 'Assistente Città Intelligente' },
  'search.placeholder': { hr: 'Brzo pronađi…', en: 'Quick find…', de: 'Schnell finden…', it: 'Trova veloce…' },
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
  'category.dentist': { hr: 'Dentalna medicina', en: 'Dental', de: 'Zahnmedizin', it: 'Odontoiatria' },
  'category.medicine': { hr: 'Medicina', en: 'Medicine', de: 'Medizin', it: 'Medicina' },
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
  'weather.partly_cloudy': { hr: 'Djelomično oblačno', en: 'Partly cloudy', de: 'Teilweise bewölkt', it: 'Parzialmente nuvoloso' },
  'weather.foggy': { hr: 'Maglovito', en: 'Foggy', de: 'Nebelig', it: 'Nebbioso' },
  'weather.rainy': { hr: 'Kišovito', en: 'Rainy', de: 'Regnerisch', it: 'Piovoso' },
  'weather.snowy': { hr: 'Snježno', en: 'Snowy', de: 'Schnee', it: 'Nevoso' },
  'weather.stormy': { hr: 'Olujno', en: 'Stormy', de: 'Stürmisch', it: 'Tempestoso' },
  'wind.calm': { hr: 'Mirno', en: 'Calm', de: 'Ruhig', it: 'Calmo' },
  'wind.moderate': { hr: 'Umjereno', en: 'Moderate', de: 'Mäßig', it: 'Moderato' },
  'wind.bura': { hr: 'Bura', en: 'Bura wind', de: 'Bura-Wind', it: 'Bora' },
  'wind.jugo': { hr: 'Jugo', en: 'Jugo wind', de: 'Jugo-Wind', it: 'Scirocco' },
  'crowd.low': { hr: 'Malo', en: 'Low', de: 'Wenig', it: 'Basso' },
  'crowd.medium': { hr: 'Srednje', en: 'Medium', de: 'Mittel', it: 'Medio' },
  'crowd.high': { hr: 'Puno', en: 'Busy', de: 'Voll', it: 'Affollato' },
  'parking.easy': { hr: 'Lako', en: 'Easy', de: 'Einfach', it: 'Facile' },
  'parking.normal': { hr: 'Normalno', en: 'Normal', de: 'Normal', it: 'Normale' },
  'parking.full': { hr: 'Puno', en: 'Full', de: 'Voll', it: 'Pieno' },
  'parking.free': { hr: 'Besplatno', en: 'Free', de: 'Kostenlos', it: 'Gratuito' },
  'parking.paid': { hr: 'Naplata', en: 'Paid', de: 'Gebühr', it: 'A pagamento' },
  // Alerts
  'alert.dutyPharmacy': { hr: 'Dežurna ljekarna', en: 'Pharmacy on duty', de: 'Dienstapotheke', it: 'Farmacia di turno' },
  'alert.dutyPharmacyDesc': { hr: 'Ljekarna Centar - Jadran, Put Murvice 2', en: 'Ljekarna Centar - Jadran, Put Murvice 2', de: 'Ljekarna Centar - Jadran, Put Murvice 2', it: 'Ljekarna Centar - Jadran, Put Murvice 2' },
  'alert.roadClosed': { hr: 'Cesta zatvorena', en: 'Road closed', de: 'Straße gesperrt', it: 'Strada chiusa' },
  'alert.roadClosedDesc': { hr: 'Široka ulica — radovi do 18h', en: 'Široka ulica — works until 6 PM', de: 'Široka ulica — Bauarbeiten bis 18 Uhr', it: 'Široka ulica — lavori fino alle 18' },
  'alert.eventTonight': { hr: 'Događanje večeras', en: 'Event tonight', de: 'Event heute Abend', it: 'Evento stasera' },
  'alert.eventTonightDesc': { hr: 'Glazbeni večer na Forumu, 20:00', en: 'Music night at Forum, 8 PM', de: 'Musikabend am Forum, 20 Uhr', it: 'Serata musicale al Foro, 20:00' },
  'alert.strongWind': { hr: 'Jak vjetar', en: 'Strong wind', de: 'Starker Wind', it: 'Vento forte' },
  'alert.strongWindDesc': { hr: 'Bura — udari do 55 km/h', en: 'Bura — gusts up to 55 km/h', de: 'Bura — Böen bis 55 km/h', it: 'Bora — raffiche fino a 55 km/h' },
  'alert.powerOutage': { hr: 'Nestanak struje', en: 'Power outage', de: 'Stromausfall', it: 'Interruzione di corrente' },
  'alert.powerOutageDesc': { hr: '{area} — {time}', en: '{area} — {time}', de: '{area} — {time}', it: '{area} — {time}' },
  'alert.powerOutageMultiple': { hr: '{count} područja bez struje danas', en: '{count} areas without power today', de: '{count} Gebiete ohne Strom heute', it: '{count} aree senza corrente oggi' },
  'alert.waterOutage': { hr: 'Bez vode', en: 'Water outage', de: 'Wasserausfall', it: 'Interruzione idrica' },
  'alert.waterOutageMultiple': { hr: '{count} područja bez vode danas', en: '{count} areas without water today', de: '{count} Gebiete ohne Wasser heute', it: '{count} aree senza acqua oggi' },
  // Quick actions
  'quick.pharmacyNow': { hr: 'Ljekarna', en: 'Pharmacy', de: 'Apotheke', it: 'Farmacia' },
  'quick.freeParking': { hr: 'Parking', en: 'Parking', de: 'Parken', it: 'Parcheggio' },
  'quick.emergency': { hr: 'Hitno', en: 'Emergency', de: 'Notfall', it: 'Emergenza' },
  'quick.bus': { hr: 'Autobus', en: 'Bus', de: 'Bus', it: 'Autobus' },
  'quick.cinema': { hr: 'Kino', en: 'Cinema', de: 'Kino', it: 'Cinema' },
  // For you
  'foryou.morning': { hr: 'Za tebe ujutro', en: 'For you this morning', de: 'Für dich am Morgen', it: 'Per te stamattina' },
  'foryou.noon': { hr: 'Za ručak u blizini', en: 'Lunch nearby', de: 'Mittagessen in der Nähe', it: 'Pranzo nelle vicinanze' },
  'foryou.evening': { hr: 'Za večeras', en: 'For your evening', de: 'Für deinen Abend', it: 'Per la tua serata' },
  'foryou.night': { hr: 'Noćne usluge', en: 'Night services', de: 'Nachtdienste', it: 'Servizi notturni' },
  // Business side
  'biz.panel': { hr: 'Panel vlasnika', en: 'Owner Panel', de: 'Inhaberbereich', it: 'Pannello proprietario' },
  'biz.analytics': { hr: 'Statistika danas', en: 'Today\'s analytics', de: 'Heutige Statistik', it: 'Statistiche di oggi' },
  'biz.views': { hr: 'Pregledi', en: 'Views', de: 'Aufrufe', it: 'Visualizzazioni' },
  'biz.calls': { hr: 'Pozivi', en: 'Calls', de: 'Anrufe', it: 'Chiamate' },
  'biz.navClicks': { hr: 'Navigacija', en: 'Navigate', de: 'Navigation', it: 'Navigazione' },
  'biz.setOccupancy': { hr: 'Postavite zauzetost', en: 'Set occupancy', de: 'Auslastung einstellen', it: 'Imposta occupazione' },
  'biz.occupancy.quiet': { hr: 'Mirno', en: 'Quiet', de: 'Ruhig', it: 'Tranquillo' },
  'biz.occupancy.normal': { hr: 'Normalno', en: 'Normal', de: 'Normal', it: 'Normale' },
  'biz.occupancy.busy': { hr: 'Gužva', en: 'Busy', de: 'Voll', it: 'Affollato' },
  'biz.dailyOffer': { hr: 'Dnevna ponuda', en: 'Daily offer', de: 'Tagesangebot', it: 'Offerta del giorno' },
  'biz.dailyOfferPlaceholder': { hr: 'npr. 20% popusta na kavu', en: 'e.g. 20% off coffee', de: 'z.B. 20% Rabatt auf Kaffee', it: 'es. 20% di sconto sul caffè' },
  'biz.announcement': { hr: 'Obavijest', en: 'Announcement', de: 'Ankündigung', it: 'Annuncio' },
  'biz.announcementPlaceholder': { hr: 'Napišite poruku za korisnike…', en: 'Write a message for customers…', de: 'Nachricht für Kunden…', it: 'Scrivi un messaggio per i clienti…' },
  'biz.corrections': { hr: 'Korekture zajednice', en: 'Community corrections', de: 'Gemeinschafts-Korrekturen', it: 'Correzioni della comunità' },
  'biz.reportsReceived': { hr: 'prijava primljeno', en: 'reports received', de: 'Meldungen erhalten', it: 'segnalazioni ricevute' },
  'biz.respondToReports': { hr: 'Odgovori na prijave', en: 'Respond to reports', de: 'Auf Meldungen antworten', it: 'Rispondi alle segnalazioni' },
  'biz.noReports': { hr: 'Nema prijava — sve je u redu!', en: 'No reports — all good!', de: 'Keine Meldungen — alles gut!', it: 'Nessuna segnalazione — tutto bene!' },
  'biz.saveChanges': { hr: 'Spremi promjene', en: 'Save changes', de: 'Änderungen speichern', it: 'Salva modifiche' },
  'biz.saved': { hr: 'Spremljeno!', en: 'Saved!', de: 'Gespeichert!', it: 'Salvato!' },
  'biz.trustExplain.title': { hr: 'Kako radi vidljivost?', en: 'How does visibility work?', de: 'Wie funktioniert die Sichtbarkeit?', it: 'Come funziona la visibilità?' },
  'biz.trustExplain.body': { hr: 'Verificirani i aktivni profili pojavljuju se više u rezultatima. Neaktivni profili padaju niže. Nema plaćenog rangiranja — samo aktivnost.', en: 'Verified and active profiles appear higher in results. Inactive profiles rank lower. No paid ranking — only activity matters.', de: 'Verifizierte und aktive Profile erscheinen höher. Inaktive Profile sinken. Kein bezahltes Ranking — nur Aktivität zählt.', it: 'I profili verificati e attivi appaiono più in alto. I profili inattivi scendono. Nessun posizionamento a pagamento — conta solo l\'attività.' },
  'biz.forCustomers': { hr: 'Za korisnike danas', en: 'For customers today', de: 'Für Kunden heute', it: 'Per i clienti oggi' },
  'biz.liveOccupancy': { hr: 'Zauzetost', en: 'Live occupancy', de: 'Aktuelle Auslastung', it: 'Occupazione live' },
  'biz.waitTime': { hr: 'Vrijeme čekanja', en: 'Wait time', de: 'Wartezeit', it: 'Tempo di attesa' },
  'biz.nextAppt': { hr: 'Sljedeći termin', en: 'Next available', de: 'Nächster Termin', it: 'Prossimo disponibile' },
  // Featured
  'featured.title': { hr: 'Istaknuto u blizini', en: 'Featured today nearby', de: 'Empfohlen in der Nähe', it: 'In evidenza oggi vicino' },
  // Follow/notify
  'follow.notify': { hr: 'Obavijesti me', en: 'Notify me', de: 'Benachrichtigen', it: 'Avvisami' },
  'follow.following': { hr: 'Pratim', en: 'Following', de: 'Folge ich', it: 'Seguo' },
  'follow.options': { hr: 'Kada te obavijestiti?', en: 'When to notify you?', de: 'Wann benachrichtigen?', it: 'Quando avvisarti?' },
  'follow.whenOpens': { hr: 'Kad se otvori', en: 'When it opens', de: 'Wenn es öffnet', it: 'Quando apre' },
  'follow.whenQuiet': { hr: 'Kad bude mirno', en: 'When not crowded', de: 'Wenn nicht voll', it: 'Quando non è affollato' },
  'follow.newOffer': { hr: 'Nova ponuda', en: 'New offer', de: 'Neues Angebot', it: 'Nuova offerta' },
  // For business page
  'forbiz.title': { hr: 'Za tvrtke', en: 'For Businesses', de: 'Für Unternehmen', it: 'Per le aziende' },
  'forbiz.hero.title': { hr: 'Pridružite se ZadarIQ', en: 'Join ZadarIQ', de: 'Treten Sie ZadarIQ bei', it: 'Unisciti a ZadarIQ' },
  'forbiz.hero.subtitle': { hr: 'Besplatno upravljajte profilom, povećajte vidljivost i izgradite povjerenje.', en: 'Manage your profile for free, increase visibility, and build trust.', de: 'Verwalten Sie Ihr Profil kostenlos, erhöhen Sie die Sichtbarkeit und bauen Sie Vertrauen auf.', it: 'Gestisci il tuo profilo gratuitamente, aumenta la visibilità e costruisci fiducia.' },
  'forbiz.benefit1.title': { hr: 'Verificirani profil', en: 'Verified profile', de: 'Verifiziertes Profil', it: 'Profilo verificato' },
  'forbiz.benefit1.desc': { hr: 'Zelena oznaka — korisnici znaju da su podaci točni.', en: 'Green badge — users know your data is accurate.', de: 'Grünes Abzeichen — Nutzer wissen, dass Ihre Daten korrekt sind.', it: 'Badge verde — gli utenti sanno che i dati sono accurati.' },
  'forbiz.benefit2.title': { hr: 'Statistika u stvarnom vremenu', en: 'Real-time analytics', de: 'Echtzeit-Statistiken', it: 'Statistiche in tempo reale' },
  'forbiz.benefit2.desc': { hr: 'Vidite koliko korisnika vas gleda, zove i navigira svaki dan.', en: 'See how many users view, call, and navigate to you daily.', de: 'Sehen Sie, wie viele Nutzer Sie täglich aufrufen, anrufen und zu Ihnen navigieren.', it: 'Scopri quanti utenti ti visualizzano, chiamano e navigano ogni giorno.' },
  'forbiz.benefit3.title': { hr: 'Objavite ponude', en: 'Publish offers', de: 'Angebote veröffentlichen', it: 'Pubblica offerte' },
  'forbiz.benefit3.desc': { hr: 'Dnevne ponude i obavijesti vidljive svim korisnicima.', en: 'Daily offers and announcements visible to all users.', de: 'Tagesangebote und Ankündigungen für alle Nutzer sichtbar.', it: 'Offerte giornaliere e annunci visibili a tutti gli utenti.' },
  'forbiz.benefit4.title': { hr: 'Odgovorite na korekcije', en: 'Respond to corrections', de: 'Auf Korrekturen antworten', it: 'Rispondi alle correzioni' },
  'forbiz.benefit4.desc': { hr: 'Vidite prijave korisnika i brzo ispravite podatke.', en: 'See user reports and quickly fix your data.', de: 'Sehen Sie Nutzermeldungen und korrigieren Sie Ihre Daten schnell.', it: 'Vedi le segnalazioni degli utenti e correggi rapidamente i dati.' },
  'forbiz.benefit5.title': { hr: 'Viša pozicija', en: 'Higher ranking', de: 'Höheres Ranking', it: 'Posizionamento migliore' },
  'forbiz.benefit5.desc': { hr: 'Aktivni profili pojavljuju se više — bez plaćenog oglašavanja.', en: 'Active profiles appear higher — no paid advertising needed.', de: 'Aktive Profile erscheinen höher — keine bezahlte Werbung nötig.', it: 'I profili attivi appaiono più in alto — nessuna pubblicità a pagamento.' },
  'forbiz.benefit6.title': { hr: 'Više od Google Mapsa', en: 'Better than Google Maps', de: 'Besser als Google Maps', it: 'Meglio di Google Maps' },
  'forbiz.benefit6.desc': { hr: 'Korisnici ovdje dobivaju ažurne, provjerene podatke — a ne zastarjele.', en: 'Users here get up-to-date, verified data — not outdated info.', de: 'Nutzer erhalten hier aktuelle, verifizierte Daten — keine veralteten Infos.', it: 'Gli utenti qui trovano dati aggiornati e verificati — non informazioni obsolete.' },
  'forbiz.trustEconomy.title': { hr: 'Ekonomija povjerenja', en: 'Trust + Visibility Economy', de: 'Vertrauens-Ökonomie', it: 'Economia della fiducia' },
  'forbiz.trustEconomy.rule1': { hr: 'Verificirani profili pojavljuju se više u rezultatima.', en: 'Verified profiles appear higher in results.', de: 'Verifizierte Profile erscheinen höher in den Ergebnissen.', it: 'I profili verificati appaiono più in alto nei risultati.' },
  'forbiz.trustEconomy.rule2': { hr: 'Neaktivni profili padaju niže.', en: 'Inactive profiles rank lower.', de: 'Inaktive Profile sinken in den Ergebnissen.', it: 'I profili inattivi scendono nei risultati.' },
  'forbiz.trustEconomy.rule3': { hr: 'Nema plaćenog rangiranja — samo aktivnost i pouzdanost.', en: 'No paid ranking — only activity and reliability.', de: 'Kein bezahltes Ranking — nur Aktivität und Zuverlässigkeit.', it: 'Nessun posizionamento a pagamento — solo attività e affidabilità.' },
  'forbiz.cta': { hr: 'Preuzmi svoj profil', en: 'Claim your profile', de: 'Profil beanspruchen', it: 'Rivendica il tuo profilo' },
  'forbiz.free': { hr: 'Potpuno besplatno. Zauvijek.', en: 'Completely free. Forever.', de: 'Komplett kostenlos. Für immer.', it: 'Completamente gratuito. Per sempre.' },
  // Public services
  'publicServices.title': { hr: 'Javne službe', en: 'Public Services', de: 'Öffentliche Dienste', it: 'Servizi Pubblici' },
  'publicServices.subtitle': { hr: 'Gradske institucije i službe', en: 'City institutions & services', de: 'Städtische Institutionen & Dienste', it: 'Istituzioni e servizi comunali' },
  'publicServices.gradZadar': { hr: 'Grad Zadar', en: 'City of Zadar', de: 'Stadt Zadar', it: 'Città di Zara' },
  'publicServices.zadarskaZupanija': { hr: 'Zadarska županija', en: 'Zadar County', de: 'Gespanschaft Zadar', it: 'Contea di Zara' },
  'publicServices.centrala': { hr: 'Centrala', en: 'Switchboard', de: 'Zentrale', it: 'Centralino' },
  'publicServices.departments': { hr: 'Upravni odjeli i stručne službe', en: 'Administrative departments', de: 'Verwaltungsabteilungen', it: 'Dipartimenti amministrativi' },
  // Utility companies
  'utilities.menuLabel': { hr: 'Komunalne tvrtke', en: 'Utility Companies', de: 'Versorgungsunternehmen', it: 'Aziende di servizi' },
  'utilities.title': { hr: 'Komunalne tvrtke', en: 'Utility Companies', de: 'Versorgungsunternehmen', it: 'Aziende di servizi' },
  'utilities.subtitle': { hr: 'Čistoća, Vodovod, HEP', en: 'Waste, Water, Electricity', de: 'Abfall, Wasser, Strom', it: 'Rifiuti, Acqua, Elettricità' },
  'utilities.emergency': { hr: 'Hitno', en: 'Emergency', de: 'Notfall', it: 'Emergenza' },
  'utilities.services': { hr: 'Usluge', en: 'Services', de: 'Dienste', it: 'Servizi' },
  // Transport
  'quick.transport': { hr: 'Prijevoz', en: 'Transport', de: 'Transport', it: 'Trasporti' },
  'transport.title': { hr: 'Prijevoz', en: 'Transport', de: 'Transport', it: 'Trasporti' },
  'transport.subtitle': { hr: 'Trajekti, autobusi i više', en: 'Ferries, buses & more', de: 'Fähren, Busse & mehr', it: 'Traghetti, autobus e altro' },
  'transport.ferries': { hr: 'Trajekti', en: 'Ferries', de: 'Fähren', it: 'Traghetti' },
  'transport.catamarans': { hr: 'Katamarani', en: 'Catamarans', de: 'Katamarane', it: 'Catamarani' },
  'transport.cityBus': { hr: 'Gradski bus', en: 'City Bus', de: 'Stadtbus', it: 'Bus urbano' },
  'transport.intercity': { hr: 'Međugradski', en: 'Intercity', de: 'Überlandbus', it: 'Intercity' },
  'transport.boarding': { hr: 'Ukrcaj', en: 'Boarding', de: 'Einstieg', it: 'Imbarco' },
  'transport.scheduled': { hr: 'Planirano', en: 'Scheduled', de: 'Geplant', it: 'Pianificato' },
  'transport.delayed': { hr: 'Kasni', en: 'Delayed', de: 'Verspätet', it: 'In ritardo' },
  'transport.closed': { hr: 'Zatvoren', en: 'Closed', de: 'Geschlossen', it: 'Chiuso' },
  'transport.nextFrom': { hr: 'Sljedeći polasci iz', en: 'Next departures from', de: 'Nächste Abfahrten von', it: 'Prossime partenze da' },
  'transport.fastLines': { hr: 'Brze linije', en: 'Fast lines', de: 'Schnelllinien', it: 'Linee veloci' },
  'transport.selectLine': { hr: 'Odaberi liniju', en: 'Select line', de: 'Linie wählen', it: 'Seleziona linea' },
  'transport.useLocation': { hr: 'Moja lokacija', en: 'My location', de: 'Mein Standort', it: 'La mia posizione' },
  'transport.nearestStop': { hr: 'Najbliža stanica', en: 'Nearest stop', de: 'Nächste Haltestelle', it: 'Fermata più vicina' },
  'transport.nextDepartures': { hr: 'Sljedeći polasci', en: 'Next departures', de: 'Nächste Abfahrten', it: 'Prossime partenze' },
  'transport.noMore': { hr: 'Nema više polazaka danas', en: 'No more departures today', de: 'Keine Abfahrten mehr heute', it: 'Nessuna partenza oggi' },
  'transport.searchDestination': { hr: 'Pretraži destinaciju…', en: 'Search destination…', de: 'Ziel suchen…', it: 'Cerca destinazione…' },
  'transport.platform': { hr: 'Peron', en: 'Platform', de: 'Gleis', it: 'Banchina' },
  'transport.noResults': { hr: 'Nema rezultata', en: 'No results', de: 'Keine Ergebnisse', it: 'Nessun risultato' },
  'transport.line': { hr: 'Linija', en: 'Line', de: 'Linie', it: 'Linea' },
  'transport.widget': { hr: 'Prijevoz uskoro', en: 'Transport soon', de: 'Transport bald', it: 'Trasporti a breve' },
  'transport.cachedToday': { hr: 'Offline spremno', en: 'Cached today', de: 'Heute gespeichert', it: 'Salvato oggi' },
  // Clock
  'clock.zadarTime': { hr: 'Zadar', en: 'Zadar time', de: 'Zadar-Zeit', it: 'Ora di Zara' },
  // Now in Zadar
  'now.title': { hr: 'Sada u Zadru', en: 'Now in Zadar', de: 'Jetzt in Zadar', it: 'Ora a Zara' },
  'now.pharmacy': { hr: 'Dežurna ljekarna', en: 'Duty pharmacy', de: 'Dienstapotheke', it: 'Farmacia di turno' },
  'now.emergencyMedical': { hr: 'Hitna pomoć', en: 'Emergency', de: 'Notfall', it: 'Emergenza' },
  'now.emergencyMedicalAnswer': { hr: '112 · Hitna medicinska pomoć', en: '112 · Emergency medical', de: '112 · Notarzt', it: '112 · Emergenza medica' },
  'now.nextFerry': { hr: 'Sljedeći trajekt', en: 'Next ferry', de: 'Nächste Fähre', it: 'Prossimo traghetto' },
  'now.noFerry': { hr: 'Nema polazaka danas', en: 'No departures today', de: 'Keine Abfahrten heute', it: 'Nessuna partenza oggi' },
  'now.parking': { hr: 'Parking poluotok', en: 'Peninsula parking', de: 'Halbinsel Parken', it: 'Parcheggio penisola' },
  'now.parkingFree': { hr: 'Besplatno sada', en: 'Free now', de: 'Jetzt kostenlos', it: 'Gratuito ora' },
  'now.parkingPaid': { hr: 'Naplata aktivna', en: 'Paid now', de: 'Gebührenpflichtig', it: 'A pagamento' },
  'now.weather': { hr: 'Vrijeme sada', en: 'Weather now', de: 'Wetter jetzt', it: 'Meteo ora' },
  'now.sunset': { hr: 'Zalazak sunca', en: 'Sunset', de: 'Sonnenuntergang', it: 'Tramonto' },
  'now.powerOutage': { hr: 'Nestanak struje', en: 'Power outage', de: 'Stromausfall', it: 'Interruzione corrente' },
  'now.waterOutage': { hr: 'Bez vode', en: 'Water outage', de: 'Wasserausfall', it: 'Interruzione idrica' },
  'now.areasAffected': { hr: 'područja', en: 'areas', de: 'Gebiete', it: 'aree' },
  'now.sunrise': { hr: 'Izlazak sunca', en: 'Sunrise', de: 'Sonnenaufgang', it: 'Alba' },
  'now.meteoAlert': { hr: 'Meteo upozorenje', en: 'Weather alert', de: 'Wetterwarnung', it: 'Allerta meteo' },
  'meteo.type.wind': { hr: 'Jak vjetar', en: 'Strong wind', de: 'Starker Wind', it: 'Vento forte' },
  'meteo.type.rain': { hr: 'Obilna kiša', en: 'Heavy rain', de: 'Starkregen', it: 'Pioggia intensa' },
  'meteo.type.thunderstorm': { hr: 'Grmljavina', en: 'Thunderstorm', de: 'Gewitter', it: 'Temporale' },
  'meteo.type.snow': { hr: 'Snijeg', en: 'Snow', de: 'Schnee', it: 'Neve' },
  'meteo.type.fog': { hr: 'Magla', en: 'Fog', de: 'Nebel', it: 'Nebbia' },
  'meteo.type.extreme_heat': { hr: 'Toplinski val', en: 'Heat wave', de: 'Hitzewelle', it: 'Ondata di calore' },
  'meteo.type.extreme_cold': { hr: 'Jak mraz', en: 'Extreme cold', de: 'Extreme Kälte', it: 'Freddo estremo' },
  'meteo.type.ice': { hr: 'Poledica', en: 'Ice', de: 'Glatteis', it: 'Ghiaccio' },
  'meteo.type.flood': { hr: 'Poplava', en: 'Flood', de: 'Hochwasser', it: 'Alluvione' },
  'meteo.type.coastal': { hr: 'Obalni valovi', en: 'Coastal waves', de: 'Küstenwellen', it: 'Onde costiere' },
  // Contextual weather advice
  'advice.rainUmbrella': { hr: 'Kiša — ponesi kišobran ☂️', en: 'Rain — bring umbrella ☂️', de: 'Regen — Schirm mitnehmen ☂️', it: 'Pioggia — porta ombrello ☂️' },
  'advice.stormStayIn': { hr: 'Oluja — izbjegavaj otvoreno ⛈️', en: 'Storm — stay indoors ⛈️', de: 'Sturm — drinnen bleiben ⛈️', it: 'Temporale — resta al chiuso ⛈️' },
  'advice.hotSunscreen': { hr: 'Vrućina — krema i voda 🧴', en: 'Hot — sunscreen & water 🧴', de: 'Heiß — Sonnencreme & Wasser 🧴', it: 'Caldo — crema solare e acqua 🧴' },
  'advice.warmNoJacket': { hr: 'Toplo jutro — bez jakne 😎', en: 'Warm morning — no jacket 😎', de: 'Warmer Morgen — keine Jacke 😎', it: 'Mattina calda — niente giacca 😎' },
  'advice.coldJacket': { hr: 'Hladno — uzmi jaknu 🧥', en: 'Cold — bring a jacket 🧥', de: 'Kalt — Jacke mitnehmen 🧥', it: 'Freddo — porta una giacca 🧥' },
  'advice.fogCareful': { hr: 'Magla — oprez u vožnji 🌫️', en: 'Fog — careful driving 🌫️', de: 'Nebel — vorsichtig fahren 🌫️', it: 'Nebbia — guida con cautela 🌫️' },
  'advice.buraWind': { hr: 'Bura puše — pazi na mostove 💨', en: 'Bura wind — watch bridges 💨', de: 'Bura — Brücken beachten 💨', it: 'Bora — attenzione ai ponti 💨' },
  'advice.niceDay': { hr: 'Lijepo vrijeme — uživaj vani ☀️', en: 'Nice day — enjoy outside ☀️', de: 'Schönes Wetter — draußen genießen ☀️', it: 'Bel tempo — goditi all\'aperto ☀️' },
  'advice.coldMorning': { hr: 'Ujutro bura — hladno 🌬️', en: 'Morning bura — cold 🌬️', de: 'Morgens Bura — kalt 🌬️', it: 'Mattina bora — freddo 🌬️' },
  // Time-slot card labels
  'now.firstFerry': { hr: 'Prvi trajekt', en: 'First ferry', de: 'Erste Fähre', it: 'Primo traghetto' },
  'now.lastFerry': { hr: 'Zadnji trajekt', en: 'Last ferry', de: 'Letzte Fähre', it: 'Ultimo traghetto' },
  'now.open247': { hr: 'Otvoreno 0-24', en: 'Open 24h', de: '24h geöffnet', it: 'Aperto 24h' },
  'now.weatherAdvice': { hr: 'Savjet za danas', en: 'Today\'s advice', de: 'Tageshinweis', it: 'Consiglio di oggi' },
  'now.taxi': { hr: 'Taxi', en: 'Taxi', de: 'Taxi', it: 'Taxi' },
  'now.taxiAvailable': { hr: 'Taxi Zadar — Google pretraga', en: 'Taxi Zadar — Google search', de: 'Taxi Zadar — Google-Suche', it: 'Taxi Zadar — Ricerca Google' },
  'now.taxiGoogleSearch': { hr: 'Taxi Zadar — Google pretraga', en: 'Taxi Zadar — Google search', de: 'Taxi Zadar — Google-Suche', it: 'Taxi Zadar — Ricerca Google' },
  'now.oldTown': { hr: 'Stari grad', en: 'Old Town', de: 'Altstadt', it: 'Centro storico' },
  'now.oldTownQuiet': { hr: 'Mirno — dobro za šetnju', en: 'Quiet — good for a walk', de: 'Ruhig — gut für Spaziergang', it: 'Tranquillo — bello per passeggiare' },
  'now.oldTownBusy': { hr: 'Gužva — očekuj čekanje', en: 'Busy — expect crowds', de: 'Voll — Wartezeiten', it: 'Affollato — aspettati coda' },
  'now.openFood': { hr: 'Otvorena hrana', en: 'Open food', de: 'Essen offen', it: 'Cibo aperto' },
  'now.bakery24': { hr: 'Pekara Ražnjević — 0-24', en: 'Bakery Ražnjević — 24h', de: 'Bäckerei Ražnjević — 24h', it: 'Panificio Ražnjević — 24h' },
  'now.gasStation': { hr: 'Benzinska — INA Put Murvice', en: 'Gas station — INA Put Murvice', de: 'Tankstelle — INA Put Murvice', it: 'Distributore — INA Put Murvice' },
  'now.morningAdvice': { hr: 'Jutarnji savjet', en: 'Morning advice', de: 'Morgenhinweis', it: 'Consiglio mattutino' },
  'now.pharmacyNoData': { hr: 'Podatak nije unesen — nazovi 112', en: 'No data — call 112', de: 'Keine Daten — 112 anrufen', it: 'Nessun dato — chiama 112' },
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
