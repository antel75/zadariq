# Karta kao glavna stvar u ZadarIQ-u

Sunday radar prestaje biti "stranica za nedjelju" i postaje **živa karta grada** — glavni ekran na koji se ljudi vraćaju svaki dan. Nedjelja ostaje najjači sloj, ali samo jedan od više.

## Zašto ovako

Nedjelja je vrijedna 4 mjeseca u godini. Karta "što je sad otvoreno oko mene" vrijedna je svaki dan. Isti podaci, isto sučelje — samo širi razlog za dolazak.

## Kako izgleda

Puni ekran karte, bez stranice koja se skrola ispod. Tri sloja sučelja:

```text
┌─────────────────────────────┐
│ [Otvoreno] [Nedjelja] [Gorivo]│ <- trake slojeva (horizontalno)
│                             │
│         K A R T A           │ <- puni ekran, pinovi grupirani
│                             │
│   ┌───────────────────────┐ │
│   │ ▁▁ povuci gore        │ │ <- lista klizi preko karte
│   │ Studenac  07-22  300m │ │
│   │ dm        08-22  1.2km│ │
│   └───────────────────────┘ │
└─────────────────────────────┘
```

1. **Karta** preko cijelog ekrana, pinovi u boji po stanju (otvoreno / zatvara uskoro / zatvoreno), grupiranje kad ih je puno.
2. **Trake slojeva** na vrhu — biraš što gledaš. Više slojeva može biti upaljeno odjednom.
3. **Lista koja klizi** odozdo (tri visine: skrivena, pola, cijeli ekran) — sortirana po udaljenosti, klik na red vodi pin u fokus i obrnuto.

## Slojevi u prvoj verziji

| Sloj | Izvor podataka | Kad se prikazuje |
|---|---|---|
| Otvoreno sada | postojeća baza mjesta + radna vremena | uvijek |
| Radna nedjelja | shop_sunday_schedule | subota-nedjelja, inače na klik |
| Dežurna ljekarna | duty_services | uvijek |
| Gorivo | postojeća baza | uvijek |
| EV punjači | postojeći EV podaci | uvijek |
| Događanja danas | city_events | kad ih ima |
| Parking | postojeće parking zone | uvijek |

Sloj se pamti — kad se vratiš, karta je kakvu si je ostavio.

## Što ostaje isto

Sve što danas radi ostaje: dohvat podataka, automatski scraper za nedjelje, ručno pomicanje pinova u admin preview modu, navigacija na Google Maps, izvor i vrijeme provjere. Mijenja se samo sučelje i način na koji se podaci slažu na kartu.

## Redoslijed rada

1. Nova karta preko cijelog ekrana s klizećom listom i trakama slojeva — prvo samo s nedjeljnim dućanima, da sve nastavi raditi kao sad.
2. Dodati sloj "otvoreno sada" iz opće baze mjesta — to je korak koji kartu čini korisnom svaki dan.
3. Dodati ostale slojeve (ljekarna, gorivo, EV, događanja, parking).
4. Karta postaje glavni ulaz: gumb na početnoj vodi na nju, adresa /radar, stara /sunday-radar i dalje radi.

## Tehnički dio

- Nova stranica `src/pages/CityRadar.tsx` na `/radar`; `/sunday-radar` preusmjerava na `/radar?layer=sunday` da postojeći linkovi i push poruke rade.
- Slojevi kao zasebni moduli u `src/lib/radar/layers/` — svaki vraća `{ id, label, icon, load(): Promise<RadarPin[]> }`. Dodavanje novog sloja = jedan novi file, bez diranja karte.
- Zajednički tip `RadarPin { id, name, address, lat, lng, status, subtitle, layerId, actions }`.
- Leaflet ostaje, uz markercluster koji je već učitan; lista i karta dijele isto stanje odabira.
- Klizeća lista: postojeći shadcn Drawer (vaul) s tri visine, bez nove biblioteke.
- Odabrani slojevi u localStorage (`zadariq_radar_layers`).
- Admin preview i povlačenje pinova prenosi se u sloj za nedjelje, nepromijenjeno.
