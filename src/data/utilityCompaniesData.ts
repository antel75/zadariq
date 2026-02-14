export interface UtilityService {
  name: string;
  phone?: string;
  description?: string;
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
  services: UtilityService[];
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
    services: [
      { name: 'Odvoz komunalnog otpada', phone: '023 234 045' },
      { name: 'Odvoz glomaznog otpada', phone: '023 234 045' },
      { name: 'Reciklažno dvorište', phone: '023 234 045' },
      { name: 'Čišćenje javnih površina' },
      { name: 'Moja Čistoća (e-usluge)', description: 'moja.cistoca-zadar.hr' },
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
    services: [
      { name: 'Vodoopskrba', phone: '023 234 500' },
      { name: 'Odvodnja', phone: '023 234 500' },
      { name: 'Prijava kvara (0-24)', phone: '023 234 555' },
      { name: 'Priključci na mrežu' },
      { name: 'Laboratorij za kvalitetu vode' },
    ],
  },
  {
    id: 'hep',
    name: 'HEP ODS — Elektra Zadar',
    centralPhone: '023 309 222',
    emergencyPhone: '0800 300 401',
    website: 'https://www.hep.hr/ods/',
    address: 'Kralja Dmitra Zvonimira 8, 23000 Zadar',
    workingHours: 'Pon-Pet 08:00-15:00',
    services: [
      { name: 'Prijava kvara — besplatni telefon', phone: '0800 300 401' },
      { name: 'Novi priključak', phone: '023 309 222' },
      { name: 'Dostava očitanja (Moja mreža)', description: 'mojamreza.hep.hr' },
      { name: 'Informacije o isključenjima', description: 'hep.hr/ods — Bez struje' },
      { name: 'Reklamacije i prigovori' },
    ],
  },
];
