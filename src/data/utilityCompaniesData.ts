export interface UtilityContact {
  name?: string;
  title?: string;
  phone?: string;
  email?: string;
}

export interface UtilityService {
  name: string;
  phone?: string;
  email?: string;
  description?: string;
  link?: string;
}

export interface UtilityCompany {
  id: string;
  name: string;
  centralPhone: string;
  emergencyPhone?: string;
  email?: string;
  website: string;
  address: string;
  workingHours?: string;
  fax?: string;
  complaintsInfo?: string;
  services: UtilityService[];
  contacts?: UtilityContact[];
  branches?: { name: string; address: string; phone?: string }[];
}

export const utilityCompanies: UtilityCompany[] = [
  {
    id: 'cistoca',
    name: 'Čistoća d.o.o. Zadar',
    centralPhone: '023 234 045',
    email: 'cistoca@cistoca-zadar.hr',
    website: 'https://www.cistoca-zadar.hr',
    address: 'Put Murvice 14, 23000 Zadar',
    workingHours: 'Pon-Pet 07:00-15:00',
    complaintsInfo: 'Pisani prigovor: osobno, poštom na adresu Put Murvice 14 ili e-mailom na cistoca@cistoca-zadar.hr. Odgovor u roku 15 dana.',
    services: [
      { name: 'Odvoz miješanog komunalnog otpada', phone: '023 234 045' },
      { name: 'Odvoz glomaznog otpada — online zahtjev', phone: '023 234 045', link: 'https://www.cistoca-zadar.hr/usluge-2/zahtjevi-za-odvoz-glomaznog-otpada-68/' },
      { name: 'Reciklažno dvorište', phone: '023 234 045' },
      { name: 'Čišćenje javnih površina' },
      { name: 'Moja Čistoća (e-račun, e-usluge)', description: 'moja.cistoca-zadar.hr', link: 'https://moja.cistoca-zadar.hr/login' },
      { name: 'Interaktivna karta (spremnici, zeleni otoci)', link: 'https://www.cistoca-zadar.hr/interaktivna-karta/' },
      { name: 'Kalendar odvoza otpada', description: 'Unesite šifru objekta s uplatnice', link: 'https://www.cistoca-zadar.hr' },
    ],
  },
  {
    id: 'vodovod',
    name: 'Vodovod d.o.o. Zadar',
    centralPhone: '023 234 500',
    emergencyPhone: '023 234 555',
    email: 'vodovod1@vodovod-zadar.hr',
    website: 'https://www.vodovod-zadar.hr',
    address: 'Špire Brusine 17, 23000 Zadar',
    workingHours: 'Pon-Pet 07:00-15:00',
    complaintsInfo: 'Pisani prigovor: osobno u poslovnom prostoru, poštom na adresu Špire Brusine 17, 23000 Zadar, ili e-mailom na vodovod1@vodovod-zadar.hr. Odgovor u roku 15 dana. Prigovor na odgovor: Povjerenstvu za reklamacije, istim kanalima.',
    services: [
      { name: 'Vodoopskrba', phone: '023 234 500' },
      { name: 'Odvodnja', phone: '023 234 500' },
      { name: 'Prijava kvara (0-24)', phone: '023 234 555' },
      { name: 'Priključci na vodoopskrbnu mrežu', phone: '023 234 500', email: 'vodovod1@vodovod-zadar.hr' },
      { name: 'Laboratorij za kvalitetu vode' },
      { name: 'Služba pročišćavanja otpadnih voda' },
      { name: 'Dostava vode otočanima', phone: '023 208 009', description: 'Grad Zadar: narudžbe za otoke Molat, Ist, Iž, Olib, Premuda, Silba, Rava', email: 'voda@grad-zadar.hr' },
      { name: 'Prigovori i reklamacije', email: 'vodovod1@vodovod-zadar.hr', description: 'Pisano ili osobno — odgovor u 15 dana' },
      { name: 'Karta planiranih radova', link: 'https://www.vodovod-zadar.hr/karta-planiranih-radova' },
    ],
  },
  {
    id: 'hep',
    name: 'HEP ODS — Elektra Zadar',
    centralPhone: '023 290 500',
    emergencyPhone: '0800 300 401',
    email: 'info.dpzadar@hep.hr',
    fax: '023 311 824',
    website: 'https://www.hep.hr/ods/',
    address: 'Kralja Dmitra Zvonimira 8, 23000 Zadar',
    workingHours: 'Šalter za korisnike: 7:30-14:00',
    complaintsInfo: 'Prigovor na postupanje ODS-a: pisano ili osobno na šalteru Elektre Zadar. Odgovor u roku 15 dana. Nezadovoljni odgovorom? Obratite se Povjerenstvu za reklamacije potrošača.',
    services: [
      { name: 'Besplatni info telefon', phone: '0800 300 414' },
      { name: 'Prijava kvara (0-24, besplatno)', phone: '0800 300 401' },
      { name: 'Pozivi iz inozemstva', phone: '+385 1 469 02 99' },
      { name: 'Novi priključak na mrežu', phone: '023 290 500', email: 'info.dpzadar@hep.hr' },
      { name: 'Dostava očitanja (Moja mreža)', description: 'mojamreza.hep.hr', link: 'https://mojamreza.hep.hr/index.html' },
      { name: 'Informacije o isključenjima', description: 'hep.hr/ods — Bez struje', link: 'https://www.hep.hr/ods/bez-struje/6' },
      { name: 'Prigovori i reklamacije', email: 'info.dpzadar@hep.hr', description: 'Pisano ili na šalteru — odgovor u 15 dana', link: 'https://www.hep.hr/ods/prigovori-i-reklamacije/628' },
      { name: 'Promjena tarifnog modela / kategorije', email: 'info.dpzadar@hep.hr' },
    ],
    branches: [
      { name: 'Terenska jedinica Biograd na Moru', address: 'Zrmanjska ulica 2, 23210 Biograd na Moru' },
      { name: 'Terenska jedinica Nin', address: 'Put Grgura Ninskog 57, 23232 Nin' },
      { name: 'Terenska jedinica Benkovac', address: 'Kralja Dmitra Zvonimira 19, 23420 Benkovac' },
      { name: 'Terenska jedinica Otoci', address: 'Zadarski prilaz 7, 23273 Otoci' },
    ],
  },
];
