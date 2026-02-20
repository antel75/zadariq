export interface DigitalService {
  id: string;
  name: string;
  description: string;
  loginUrl: string;
  icon: string;
  proTip?: string;
}

export interface DigitalServiceCategory {
  id: string;
  labelKey: string;
  services: DigitalService[];
}

export const digitalServiceCategories: DigitalServiceCategory[] = [
  {
    id: 'utilities',
    labelKey: 'digital.cat.utilities',
    services: [
      {
        id: 'moja-cistoca',
        name: 'Moja Čistoća',
        description: 'Stanje računa, raspored odvoza, e-račun, reklamacije',
        loginUrl: 'https://moja.cistoca-zadar.hr/',
        icon: 'Recycle',
        proTip: 'Za registraciju treba OIB i šifra kupca s uplatnice',
      },
      {
        id: 'hep-moja-mreza',
        name: 'HEP Moja mreža',
        description: 'Očitanje brojila, računi za struju, potrošnja, e-račun',
        loginUrl: 'https://mojamreza.hep.hr/index.html',
        icon: 'Zap',
        proTip: 'Treba OM broj s računa za struju (nalazi se gore desno)',
      },
      {
        id: 'hep-elektra',
        name: 'HEP Elektra — Moj račun',
        description: 'Pregled i plaćanje računa za električnu energiju',
        loginUrl: 'https://mojracun.hep.hr/',
        icon: 'Receipt',
      },
      {
        id: 'vodovod-zadar',
        name: 'Vodovod Zadar',
        description: 'Informacije o vodoopskrbi, kvarovima i planiranim radovima',
        loginUrl: 'https://www.vodovod-zadar.hr',
        icon: 'Droplets',
        proTip: 'Prijava kvara: 023 234 555 (0-24h)',
      },
      {
        id: 'cistoca-glomazni',
        name: 'Odvoz glomaznog otpada',
        description: 'Online zahtjev za besplatni odvoz glomaznog otpada',
        loginUrl: 'https://www.cistoca-zadar.hr/usluge-2/zahtjevi-za-odvoz-glomaznog-otpada-68/',
        icon: 'Truck',
        proTip: 'Besplatno jednom godišnje do 3m³ — samo pošaljite zahtjev',
      },
    ],
  },
  {
    id: 'parking',
    labelKey: 'digital.cat.parking',
    services: [
      {
        id: 'obala-parking',
        name: 'Obala usluge — Parking',
        description: 'SMS parking, pretplate, pregled kazni, e-usluge',
        loginUrl: 'https://www.obala-usluge.hr',
        icon: 'Car',
        proTip: 'SMS parking: pošalji registraciju na 785785',
      },
      {
        id: 'enis-parking',
        name: 'Enís Parking App',
        description: 'Mobilna aplikacija za plaćanje parkinga u Zadru',
        loginUrl: 'https://www.enisparking.com',
        icon: 'Smartphone',
      },
    ],
  },
  {
    id: 'government',
    labelKey: 'digital.cat.government',
    services: [
      {
        id: 'e-gradjani',
        name: 'e-Građani',
        description: 'Središnji portal javnih e-usluga RH',
        loginUrl: 'https://gov.hr',
        icon: 'Landmark',
        proTip: 'Pristup s osobnom iskaznicom (eOI) ili FINA certifikatom',
      },
      {
        id: 'e-porezna',
        name: 'e-Porezna',
        description: 'Porezna prijava, pregled stanja, potvrde',
        loginUrl: 'https://e-porezna.porezna-uprava.hr',
        icon: 'FileText',
      },
      {
        id: 'e-izvadak',
        name: 'e-Izvadak iz zemljišnih knjiga',
        description: 'Online uvid u zemljišne knjige',
        loginUrl: 'https://oss.uredjenazemlja.hr/public/lrServices.jsp?action=publicLdbExtract',
        icon: 'Map',
      },
      {
        id: 'e-katastar',
        name: 'e-Katastar',
        description: 'Pregled katastarskih planova i čestica',
        loginUrl: 'https://oss.uredjenazemlja.hr/public/cadServices.jsp?action=publicCadParcels',
        icon: 'MapPin',
      },
      {
        id: 'grad-zadar',
        name: 'Grad Zadar — e-Usluge',
        description: 'Portal Grada Zadra, obavijesti i e-usluge',
        loginUrl: 'https://www.grad-zadar.hr',
        icon: 'Building2',
      },
    ],
  },
  {
    id: 'transport',
    labelKey: 'digital.cat.transport',
    services: [
      {
        id: 'jadrolinija',
        name: 'Jadrolinija',
        description: 'Trajekti i katamarani — vozni red, kupnja karata online',
        loginUrl: 'https://www.jadrolinija.hr',
        icon: 'Ship',
        proTip: 'Online kupnja karte jeftinija — na kartama piše e-ticket',
      },
      {
        id: 'liburnija',
        name: 'Liburnija Zadar',
        description: 'Gradski i prigradski autobusi, raspored, karte',
        loginUrl: 'https://www.liburnija-zadar.hr',
        icon: 'Bus',
      },
      {
        id: 'hak',
        name: 'HAK — Stanje na cestama',
        description: 'Promet u realnom vremenu, kamere, cijene goriva',
        loginUrl: 'https://www.hak.hr',
        icon: 'Route',
      },
      {
        id: 'hac-enc',
        name: 'HAC/ENC — Autoceste',
        description: 'ENC uređaj, dopuna, stanje računa, e-cestarina',
        loginUrl: 'https://www.enc.hr',
        icon: 'Gauge',
        proTip: 'ENC dopuna online — bez čekanja na naplatnim kućicama',
      },
    ],
  },
  {
    id: 'health',
    labelKey: 'digital.cat.health',
    services: [
      {
        id: 'cezih',
        name: 'CEZIH — Moji nalazi',
        description: 'Laboratorijski nalazi, e-Uputnice, e-Recepti',
        loginUrl: 'https://www.cezih.hr/mojinalazi/',
        icon: 'Heart',
        proTip: 'Pristup preko e-Građani — trebate eOI ili FINA certifikat',
      },
      {
        id: 'hzzo',
        name: 'HZZO — e-Usluge',
        description: 'Status osiguranja, doznake, uputnice',
        loginUrl: 'https://hzzo.hr/e-usluge',
        icon: 'ShieldCheck',
      },
      {
        id: 'narucivanje',
        name: 'Naručivanje kod liječnika',
        description: 'Online naručivanje u ambulantu obiteljske medicine',
        loginUrl: 'https://www.e-narudzbe.hr',
        icon: 'CalendarCheck',
      },
    ],
  },
  {
    id: 'finance',
    labelKey: 'digital.cat.finance',
    services: [
      {
        id: 'fina',
        name: 'FINA e-Usluge',
        description: 'Digitalni certifikati, e-Potpis, e-Banka',
        loginUrl: 'https://www.fina.hr/e-usluge',
        icon: 'KeyRound',
      },
      {
        id: 'hp-posta',
        name: 'Hrvatska pošta — Praćenje',
        description: 'Praćenje pošiljki, cijene dostave, e-usluge',
        loginUrl: 'https://www.posta.hr/pracenje-posiljaka/1689',
        icon: 'Package',
      },
    ],
  },
];
