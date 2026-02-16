import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Footer } from '@/components/Footer';

const PravneInformacije = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen gradient-bg gradient-mesh">
      <header className="sticky top-0 z-30 glass border-b border-border/50">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-secondary/80 transition-colors">
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <h1 className="text-lg font-bold text-foreground">Pravne informacije</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 prose prose-sm dark:prose-invert">
        <h1 className="text-2xl font-bold text-foreground mb-6">Pravne informacije – ZadarIQ</h1>

        <h2 className="text-lg font-semibold text-foreground mt-8 mb-3">1. Opće informacije</h2>
        <p className="text-muted-foreground leading-relaxed">
          ZadarIQ je nekomercijalni informativni projekt čija je svrha olakšati snalaženje u gradu Zadru pružanjem preglednih javno dostupnih informacija na jednom mjestu.
        </p>
        <p className="text-muted-foreground leading-relaxed">
          Projekt nije trgovačka platforma, oglasnik niti pružatelj usluga rezervacije ili posredovanja.<br />
          ZadarIQ ne naplaćuje prikaz podataka, ne promovira poslovne subjekte i ne ostvaruje prihod putem oglasa, partnerstava ili sponzorstava.
        </p>

        <h2 className="text-lg font-semibold text-foreground mt-8 mb-3">2. Priroda podataka</h2>
        <p className="text-muted-foreground leading-relaxed">
          Svi prikazani podaci predstavljaju informativni pregled javno dostupnih informacija, uključujući ali ne ograničavajući se na:
        </p>
        <ul className="text-muted-foreground list-disc pl-6 space-y-1">
          <li>radna vremena</li>
          <li>lokacije</li>
          <li>kontakt podatke</li>
          <li>rasporede</li>
          <li>dostupnost usluga</li>
          <li>javne obavijesti</li>
        </ul>
        <p className="text-muted-foreground leading-relaxed">
          Podaci se prikupljaju iz javnih izvora ili na zahtjev samih subjekata radi ispravka informacija.
        </p>
        <p className="text-muted-foreground leading-relaxed">
          ZadarIQ ne jamči potpunu točnost podataka niti preuzima odgovornost za eventualne razlike između prikazanog i stvarnog stanja.
        </p>
        <p className="text-muted-foreground leading-relaxed">
          Za službene i konačne informacije uvijek se obratite samom pružatelju usluge.
        </p>

        <h2 className="text-lg font-semibold text-foreground mt-8 mb-3">3. Neovisnost i neutralnost</h2>
        <p className="text-muted-foreground leading-relaxed">
          Redoslijed i prikaz subjekata temelje se na tehničkim kriterijima (kategorija, udaljenost, dostupnost, vrijeme) i nikada na plaćanju, oglašavanju ili preporuci.
        </p>
        <p className="text-muted-foreground leading-relaxed">
          ZadarIQ ne daje ocjene, preporuke niti promotivne opise poslovnih subjekata.
        </p>
        <p className="text-muted-foreground leading-relaxed">
          Nazivi, znakovi i reference koriste se isključivo u svrhu identifikacije lokacije i informiranja korisnika.
        </p>

        <h2 className="text-lg font-semibold text-foreground mt-8 mb-3">4. Zahtjev za ispravak ili uklanjanje</h2>
        <p className="text-muted-foreground leading-relaxed">
          Svaki poslovni subjekt ili osoba ima pravo zatražiti:
        </p>
        <ul className="text-muted-foreground list-disc pl-6 space-y-1">
          <li>ispravak podataka</li>
          <li>dopunu podataka</li>
          <li>uklanjanje podataka</li>
        </ul>
        <p className="text-muted-foreground leading-relaxed">
          Zahtjev se može poslati na: <a href="mailto:kontakt@zadariq.city" className="text-accent hover:underline">kontakt@zadariq.city</a>
        </p>
        <p className="text-muted-foreground leading-relaxed">
          Zahtjevi se obrađuju u najkraćem mogućem roku bez potrebe za dodatnim obrazloženjem.
        </p>

        <h2 className="text-lg font-semibold text-foreground mt-8 mb-3">5. Korisnički računi i potvrda podataka</h2>
        <p className="text-muted-foreground leading-relaxed">
          Mogućnost potvrde profila služi isključivo za ispravak javno prikazanih informacija.<br />
          Potvrda ne predstavlja poslovni odnos, partnerstvo niti prijenos vlasništva nad sadržajem.
        </p>

        <h2 className="text-lg font-semibold text-foreground mt-8 mb-3">6. Odgovornost</h2>
        <p className="text-muted-foreground leading-relaxed">
          Korištenjem stranice prihvaćate da:
        </p>
        <ul className="text-muted-foreground list-disc pl-6 space-y-1">
          <li>ZadarIQ služi isključivo informativnoj svrsi</li>
          <li>ne donosite odluke oslanjajući se isključivo na prikazane podatke</li>
          <li>ZadarIQ ne odgovara za štetu nastalu korištenjem informacija</li>
        </ul>

        <h2 className="text-lg font-semibold text-foreground mt-8 mb-3">7. Privatnost</h2>
        <p className="text-muted-foreground leading-relaxed">
          Stranica ne prikuplja osobne podatke posjetitelja osim onih koje korisnik dobrovoljno unese radi kontakta ili ispravka informacija.
        </p>
        <p className="text-muted-foreground leading-relaxed">
          Podaci se koriste isključivo za komunikaciju i ne dijele se trećim stranama.
        </p>

        <h2 className="text-lg font-semibold text-foreground mt-8 mb-3">8. Kontakt</h2>
        <p className="text-muted-foreground leading-relaxed">
          <a href="mailto:kontakt@zadariq.city" className="text-accent hover:underline">kontakt@zadariq.city</a>
        </p>
      </main>

      <Footer />
    </div>
  );
};

export default PravneInformacije;
