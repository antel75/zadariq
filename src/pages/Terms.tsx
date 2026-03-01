import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function Terms() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-secondary">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="font-bold">Uvjeti korištenja</h1>
        </div>
      </header>
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6 text-sm text-muted-foreground">
        <div>
          <p className="text-[10px] text-muted-foreground mb-4">Posljednja izmjena: 1. ožujka 2026.</p>
          <p className="text-foreground leading-relaxed">
            ZadarIQ je besplatni informativni gradski imenik koji agregira javno dostupne podatke o poslovnim objektima, 
            događanjima i uslugama na području Zadra i okolice.
          </p>
        </div>

        {[
          { title: '1. Prihvaćanje uvjeta', text: 'Korištenjem ZadarIQ platforme potvrđujete da ste pročitali, razumjeli i prihvatili ove uvjete korištenja. Ako se ne slažete s uvjetima, molimo prestanite koristiti platformu.' },
          { title: '2. Opis usluge', text: 'ZadarIQ je informativni agregator koji pruža podatke iz javnih izvora i zajednice. Podaci mogu kasniti ili odstupati od stvarnog stanja. Za službene i pravno važeće informacije uvijek provjerite izvorni servis ili nadležno tijelo.' },
          { title: '3. Odgovornost korisnika', text: 'Korisnici su isključivo odgovorni za točnost podataka koje unose. Zabranjeno je lažno predstavljanje, unos netočnih podataka, zlouporaba tuđih profila ili bilo kakvo djelovanje suprotno zakonima Republike Hrvatske.' },
          { title: '4. Preuzimanje profila', text: 'Preuzimanjem profila poslovnog objekta pod materijalnom i krivičnom odgovornošću potvrđujete da ste zakoniti vlasnik ili ovlašteni predstavnik navedenog objekta. Lažno predstavljanje kazneno je djelo prema čl. 294. Kaznenog zakona Republike Hrvatske.' },
          { title: '5. Prava ZadarIQ-a', text: 'ZadarIQ zadržava pravo suspendirati ili trajno ukinuti pristup profilu ili platformi u slučaju kršenja ovih uvjeta, bez prethodne najave i bez odgovornosti za eventualnu štetu. ZadarIQ također zadržava pravo izmjene, uklanjanja ili dopune podataka u javnom interesu.' },
          { title: '6. Intelektualno vlasništvo', text: 'Sadržaj platforme ZadarIQ, uključujući dizajn, logotip, kod i strukturu podataka, zaštićen je autorskim pravima. Zabranjeno je kopiranje, distribucija ili komercijalna uporaba bez pisanog odobrenja.' },
          { title: '7. Pohrana podataka i GDPR', text: 'ZadarIQ prikuplja i obrađuje osobne podatke u skladu s Općom uredbom o zaštiti podataka (GDPR, EU 2016/679) i Zakonom o provedbi Opće uredbe o zaštiti podataka (NN 42/2018). Detalji su dostupni u Politici privatnosti.' },
          { title: '8. Ograničenje odgovornosti', text: 'ZadarIQ ne jamči točnost, potpunost ni ažurnost prikazanih informacija. Platforma se pruža "kakva jest" bez ikakvih jamstava. ZadarIQ nije odgovoran za štetu nastalu korištenjem ili nemogućnošću korištenja platforme.' },
          { title: '9. Mjerodavno pravo', text: 'Na ove uvjete primjenjuje se pravo Republike Hrvatske. Za sve sporove nadležan je stvarno nadležan sud u Zadru.' },
          { title: '10. Kontakt', text: 'Za pitanja vezana uz uvjete korištenja obratite se na: admin@zadariq.city' },
        ].map(({ title, text }) => (
          <div key={title}>
            <h3 className="font-semibold text-foreground mb-2">{title}</h3>
            <p className="leading-relaxed">{text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
