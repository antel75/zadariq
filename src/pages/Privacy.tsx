import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function Privacy() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-secondary">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="font-bold">Politika privatnosti</h1>
        </div>
      </header>
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6 text-sm text-muted-foreground">
        <div>
          <p className="text-[10px] text-muted-foreground mb-4">Posljednja izmjena: 1. ožujka 2026.</p>
          <p className="text-foreground leading-relaxed">
            ZadarIQ ozbiljno shvaća zaštitu vaših osobnih podataka. Ova politika opisuje koje podatke prikupljamo, 
            kako ih koristimo i koja su vaša prava.
          </p>
        </div>

        {[
          { title: '1. Voditelj obrade', text: 'Voditelj obrade osobnih podataka je ZadarIQ (zadariq.city). Kontakt za pitanja privatnosti: admin@zadariq.city' },
          { title: '2. Koje podatke prikupljamo', text: 'Prikupljamo: email adresu (obvezno za registraciju), ime i prezime, broj telefona (opcionalno), IP adresu pri registraciji i prijavi, GPS koordinate objekta (samo uz vašu izričitu suglasnost), podatke o korištenju platforme (stranice koje posjećujete, akcije koje poduzimate).' },
          { title: '3. Svrha obrade', text: 'Podatke koristimo isključivo za: pružanje usluge ZadarIQ platforme, verifikaciju identiteta vlasnika objekata, slanje transakcijskih emailova (potvrda registracije, obavijesti o statusu), zaštitu od zlouporabe i prijevare, poboljšanje kvalitete usluge.' },
          { title: '4. Pravna osnova', text: 'Obrada se temelji na: izvršenju ugovora (pružanje usluge koju ste zatražili), legitimnom interesu (zaštita od prijevare, sigurnost platforme), privoli (GPS lokacija, marketinške komunikacije).' },
          { title: '5. Dijeljenje podataka', text: 'Vaše osobne podatke ne prodajemo niti dijelimo s trećim stranama u komercijalne svrhe. Podatke možemo dijeliti s: pružateljima tehničkih usluga (Supabase za bazu podataka, Resend za email), nadležnim tijelima isključivo na temelju zakonske obveze.' },
          { title: '6. Pohrana i sigurnost', text: 'Podaci se pohranjuju na serverima unutar EU (Supabase Frankfurt). Koristimo enkripciju u prijenosu (HTTPS/TLS) i pohrani. Lozinke se nikada ne pohranjuju u čitljivom obliku.' },
          { title: '7. Rok čuvanja', text: 'Podatke čuvamo dok god imate aktivan račun. Nakon brisanja računa, osobne podatke brišemo u roku od 30 dana, osim podataka koje smo zakonski obvezni čuvati dulje (npr. računovodstveni podaci — 11 godina).' },
          { title: '8. Vaša prava', text: 'Imate pravo na: pristup vašim podacima, ispravak netočnih podataka, brisanje podataka ("pravo na zaborav"), prenosivost podataka, prigovor na obradu, povlačenje privole u svakom trenutku. Za ostvarivanje prava obratite se na admin@zadariq.city.' },
          { title: '9. Kolačići', text: 'ZadarIQ koristi isključivo funkcionalne kolačiće nužne za rad platforme (autentifikacija, postavke). Ne koristimo kolačiće za praćenje ili oglašavanje.' },
          { title: '10. Pritužbe', text: 'Ako smatrate da se vaši podaci obrađuju nezakonito, imate pravo podnijeti pritužbu Agenciji za zaštitu osobnih podataka (AZOP), Martićeva 14, 10000 Zagreb, azop@azop.hr.' },
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
