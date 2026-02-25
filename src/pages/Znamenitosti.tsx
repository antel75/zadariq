import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSelector } from '@/components/LanguageSelector';
import { ArrowLeft, MapPin, Clock, ExternalLink } from 'lucide-react';
import { Footer } from '@/components/Footer';

const ATTRACTIONS = [
  { id: 'sv-donat', emoji: '⛪', name: { hr: 'Crkva sv. Donata', en: 'Church of St. Donat', de: 'Kirche St. Donat', it: 'Chiesa di San Donato' }, description: { hr: 'Najprepoznatljiviji simbol Zadra, predromanička rotonda iz 9. st. izgrađena na rimskom forumu. Poznata po izvrsnoj akustici.', en: 'The most recognizable symbol of Zadar, a pre-Romanesque rotunda from the 9th century built on a Roman forum. Known for excellent acoustics.', de: 'Das bekannteste Symbol Zadars, eine vorromanische Rotunde aus dem 9. Jh. Bekannt für hervorragende Akustik.', it: 'Il simbolo più riconoscibile di Zara, una rotonda preromanica del IX sec. Nota per la sua acustica eccellente.' }, address: 'Trg rimskog foruma, Zadar', hours: { hr: 'Lipanj–rujan: 9:00–21:00', en: 'June–Sept: 9:00–21:00', de: 'Juni–Sept: 9:00–21:00', it: 'Giugno–sett: 9:00–21:00' }, free: false, mapUrl: 'https://maps.google.com/?q=crkva+sv+donat+zadar', category: 'crkva' },
  { id: 'morske-orgulje', emoji: '🌊', name: { hr: 'Morske orgulje', en: 'Sea Organ', de: 'Meeresorgel', it: 'Organo del mare' }, description: { hr: 'Jedinstvena instalacija Nikole Bašića iz 2005. Valovi sviraju glazbu kroz 35 cijevi ispod mramornih stepenica na rivi.', en: 'Unique installation by Nikola Bašić from 2005. Waves play music through 35 pipes beneath marble steps on the waterfront.', de: 'Einzigartige Installation von Nikola Bašić aus 2005. Wellen spielen Musik durch 35 Rohre unter Marmorstufen.', it: 'Installazione unica di Nikola Bašić del 2005. Le onde suonano musica attraverso 35 tubi sotto i gradini di marmo.' }, address: 'Obala kralja Petra Krešimira IV, Zadar', free: true, mapUrl: 'https://maps.google.com/?q=sea+organ+zadar', category: 'kultura' },
  { id: 'pozdrav-suncu', emoji: '☀️', name: { hr: 'Pozdrav Suncu', en: 'Greeting to the Sun', de: 'Gruß an die Sonne', it: 'Saluto al sole' }, description: { hr: 'Instalacija od 300 solarnih panela u tlu koja noću stvara spektakularan svjetlosni show. Hitchcock proglasio zadar zalazak najljepšim na svijetu.', en: '300 solar panels in the ground creating a spectacular light show at night. Hitchcock declared the Zadar sunset the most beautiful in the world.', de: '300 Solarpaneele im Boden mit spektakulärer Lichtshow nachts. Hitchcock nannte den Zadarer Sonnenuntergang den schönsten der Welt.', it: '300 pannelli solari nel terreno con spettacolare show di luci di notte. Hitchcock dichiarò il tramonto di Zara il più bello del mondo.' }, address: 'Obala kralja Petra Krešimira IV, Zadar', free: true, mapUrl: 'https://maps.google.com/?q=greeting+to+the+sun+zadar', category: 'kultura' },
  { id: 'sv-stosija', emoji: '⛪', name: { hr: 'Katedrala sv. Stošije', en: 'Cathedral of St. Anastasia', de: 'Kathedrale St. Anastasia', it: 'Cattedrale di Sant Anastasia' }, description: { hr: 'Najdulja romanička crkva u Dalmaciji iz 12–13. st. Impresivna fasada i zvonik s panoramskim pogledom na stari grad i otoke.', en: 'The longest Romanesque church in Dalmatia, built in the 12th–13th century. Impressive facade and bell tower with panoramic views.', de: 'Die längste romanische Kirche Dalmatiens aus dem 12.–13. Jh. Beeindruckende Fassade und Glockenturm mit Panoramablick.', it: 'La chiesa romanica più lunga della Dalmazia del XII–XIII sec. Imponente facciata e campanile con vista panoramica.' }, address: 'Trg sv. Stošije 1, Zadar', hours: { hr: 'Pon–Sub: 8:00–20:00', en: 'Mon–Sat: 8:00–20:00', de: 'Mo–Sa: 8:00–20:00', it: 'Lun–Sab: 8:00–20:00' }, free: false, mapUrl: 'https://maps.google.com/?q=katedrala+sv+stosije+zadar', category: 'crkva' },
  { id: 'zlato-srebro', emoji: '🏛️', name: { hr: 'Zlato i srebro Zadra', en: 'Gold and Silver of Zadar', de: 'Gold und Silber Zadars', it: 'Oro e argento di Zara' }, description: { hr: 'Stalna izložba sakralnih predmeta i relikvijara zadarskih crkava u samostanu sv. Marije. Jedna od najvrjednijih riznica na Jadranu.', en: 'Permanent exhibition of sacred objects and reliquaries from Zadar churches in St. Marys monastery. One of the most valuable treasuries on the Adriatic.', de: 'Dauerausstellung sakraler Gegenstände aus Zadarer Kirchen im Kloster St. Maria.', it: 'Mostra permanente di oggetti sacri delle chiese di Zara nel monastero di Santa Maria.' }, address: 'Trg opatice Čike 1, Zadar', hours: { hr: 'Uto–Sub: 10:00–13:00, 18:00–20:00', en: 'Tue–Sat: 10:00–13:00, 18:00–20:00', de: 'Di–Sa: 10:00–13:00, 18:00–20:00', it: 'Mar–Sab: 10:00–13:00, 18:00–20:00' }, free: false, mapUrl: 'https://maps.google.com/?q=zlato+i+srebro+zadra', category: 'muzej' },
  { id: 'rimski-forum', emoji: '🏛️', name: { hr: 'Rimski forum', en: 'Roman Forum', de: 'Römisches Forum', it: 'Foro romano' }, description: { hr: 'Najveći rimski forum na istočnoj jadranskoj obali iz 1. st. pr. Kr. Ostaci stupova i popločenja u centru starog grada.', en: 'The largest Roman forum on the eastern Adriatic coast from the 1st century BC. Remains of columns and paving in the old town center.', de: 'Das größte römische Forum an der östlichen Adriaküste aus dem 1. Jh. v. Chr.', it: 'Il più grande foro romano sulla costa adriatica orientale del I sec. a.C.' }, address: 'Trg rimskog foruma, Zadar', free: true, mapUrl: 'https://maps.google.com/?q=rimski+forum+zadar', category: 'kultura' },
  { id: 'kopnena-vrata', emoji: '🏰', name: { hr: 'Kopnena vrata', en: 'Land Gate', de: 'Landtor', it: 'Porta terraferma' }, description: { hr: 'Monumentalna renesansna gradska vrata iz 1543., djelo Michelea Sammichelija. Glavni ulaz u stari grad s lavljim reljefom sv. Marka.', en: 'Monumental Renaissance city gate from 1543 by Michele Sammicheli. Main entrance to the old town with the lion relief of St. Mark.', de: 'Monumentales Renaissance-Stadttor von 1543, Werk von Michele Sammicheli.', it: 'Monumentale porta rinascimentale del 1543 di Michele Sammicheli. Ingresso principale alla città vecchia.' }, address: 'Ulica kralja Dmitra Zvonimira, Zadar', free: true, mapUrl: 'https://maps.google.com/?q=kopnena+vrata+zadar', category: 'kultura' },
  { id: 'narodni-muzej', emoji: '🏺', name: { hr: 'Narodni muzej Zadar', en: 'National Museum Zadar', de: 'Volksmuseum Zadar', it: 'Museo nazionale Zara' }, description: { hr: 'Bogata zbirka arheoloških i etnografskih predmeta. Kronološki prikaz razvoja Zadra od prapovijesti do danas.', en: 'Rich collection of archaeological and ethnographic objects. Chronological overview of Zadar from prehistory to the present.', de: 'Reiche archäologische und ethnographische Sammlung. Chronologischer Überblick über Zadar.', it: 'Ricca collezione di oggetti archeologici ed etnografici. Panoramica cronologica di Zara dalla preistoria ad oggi.' }, address: 'Poljana pape Aleksandra III 1, Zadar', hours: { hr: 'Pon–Pet: 9:00–21:00', en: 'Mon–Fri: 9:00–21:00', de: 'Mo–Fr: 9:00–21:00', it: 'Lun–Ven: 9:00–21:00' }, free: false, mapUrl: 'https://maps.google.com/?q=narodni+muzej+zadar', category: 'muzej' },
];

const CATEGORY_COLORS = { crkva: "bg-amber-500/10 text-amber-400 border-amber-500/20", kultura: "bg-purple-500/10 text-purple-400 border-purple-500/20", priroda: "bg-green-500/10 text-green-400 border-green-500/20", muzej: "bg-blue-500/10 text-blue-400 border-blue-500/20" };
const CATEGORY_LABELS = { crkva: { hr: "Crkva", en: "Church", de: "Kirche", it: "Chiesa" }, kultura: { hr: "Kultura", en: "Culture", de: "Kultur", it: "Cultura" }, priroda: { hr: "Priroda", en: "Nature", de: "Natur", it: "Natura" }, muzej: { hr: "Muzej", en: "Museum", de: "Museum", it: "Museo" } };

const Znamenitosti = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const lang = language as string;
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors"><ArrowLeft className="h-5 w-5 text-foreground" /></button>
            <div>
              <h1 className="text-lg font-bold text-foreground">{{ hr: "Znamenitosti", en: "Attractions", de: "Sehenswürdigkeiten", it: "Attrazioni" }[lang] || "Znamenitosti"}</h1>
              <p className="text-[11px] text-muted-foreground">{{ hr: "Što posjetiti u Zadru", en: "What to visit in Zadar", de: "Was in Zadar besuchen", it: "Cosa visitare a Zara" }[lang] || "Što posjetiti u Zadru"}</p>
            </div>
          </div>
          <LanguageSelector />
        </div>
      </header>
      <main className="max-w-lg mx-auto px-4 pb-8 pt-4">
        <div className="flex flex-col gap-3">
          {ATTRACTIONS.map(a => (
            <div key={a.id} className="rounded-2xl bg-card border border-border p-4">
              <div className="flex items-start gap-3">
                <span className="text-3xl mt-0.5">{a.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="text-sm font-bold text-foreground leading-tight">{a.name[lang] || a.name.hr}</h3>
                    <span className={"text-[10px] px-2 py-0.5 rounded-full border shrink-0 " + CATEGORY_COLORS[a.category]}>{CATEGORY_LABELS[a.category]?.[lang] || CATEGORY_LABELS[a.category]?.hr}</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-2">{a.description[lang] || a.description.hr}</p>
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{a.address}</span>
                    {a.hours && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{a.hours[lang] || a.hours.hr}</span>}
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    {a.free && <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 font-medium">{lang === "hr" ? "Besplatan ulaz" : "Free entry"}</span>}
                    <a href={a.mapUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-primary font-medium hover:underline ml-auto"><ExternalLink className="h-3 w-3" />{lang === "hr" ? "Otvori kartu" : "Open map"}</a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Znamenitosti;
