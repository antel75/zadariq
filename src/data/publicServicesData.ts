export interface PublicServiceDepartment {
  id: string;
  name: string;
  phone?: string;
  website?: string;
  address?: string;
  subunits?: { name: string; phone?: string; link?: string }[];
}

export interface PublicServiceOrg {
  id: string;
  name: string;
  centralPhone?: string;
  website: string;
  address: string;
  departments: PublicServiceDepartment[];
}

export const gradZadar: PublicServiceOrg = {
  id: 'grad-zadar',
  name: 'Grad Zadar',
  centralPhone: '023 208 100',
  website: 'https://www.grad-zadar.hr',
  address: 'Narodni trg 1, 23000 Zadar',
  departments: [
    {
      id: 'gz-kabinet',
      name: 'Upravni odjel za poslove kabineta Gradonačelnika',
      website: 'https://www.grad-zadar.hr/upravni-odjel-za-poslove-kabineta-gradonacelnika-1005/',
    },
    {
      id: 'gz-prostorno',
      name: 'Upravni odjel za prostorno uređenje i graditeljstvo',
      website: 'https://www.grad-zadar.hr/upravni-odjel-za-prostorno-uredenje-i-graditeljstvo-168/',
      subunits: [
        { name: 'Odsjek za ozakonjenje zgrada i ostale poslove' },
        { name: 'Odsjek za provedbu dokumenata prostornog uređenja i gradnje' },
        { name: 'Odsjek za građenje' },
        { name: 'Odsjek za infrastrukturne građevine' },
        { name: 'Odsjek za prostorno uređenje' },
        { name: 'Odsjek za razrez komunalnog doprinosa i ostale poslove' },
        { name: 'Odsjek za izgradnju prometnog sustava' },
        { name: 'Odsjek za energetsku učinkovitost' },
      ],
    },
    {
      id: 'gz-komunalne',
      name: 'Upravni odjel za komunalne djelatnosti i zaštitu okoliša',
      website: 'https://www.grad-zadar.hr/upravni-odjel-za-komunalne-djelatnosti-i-zastitu-okolisa-180/',
      subunits: [
        { name: 'Zaštita okoliša' },
        { name: 'Održivo gospodarenje otpadom' },
      ],
    },
    {
      id: 'gz-gospodarstvo',
      name: 'Upravni odjel za gospodarstvo, obrtništvo i razvitak otoka',
      website: 'https://www.grad-zadar.hr/upravni-odjel-za-gospodarstvo-obrtnistvo-i-razvitak-otoka-370/',
      subunits: [
        { name: 'Poduzetništvo i obrtništvo' },
        { name: 'Turizam' },
        { name: 'Informatika i telekomunikacije' },
        { name: 'Civilna zaštita' },
        { name: 'Razvitak otoka' },
      ],
    },
    {
      id: 'gz-samouprava',
      name: 'Upravni odjel za gradsku samoupravu i opće poslove',
      website: 'https://www.grad-zadar.hr/upravni-odjel-za-gradsku-samoupravu-i-opce-poslove-203/',
      subunits: [
        { name: 'Mjesni odbori' },
      ],
    },
    {
      id: 'gz-kultura',
      name: 'Upravni odjel za kulturu i šport',
      website: 'https://www.grad-zadar.hr/upravni-odjel-za-kulturu-i-sport-204/',
    },
    {
      id: 'gz-odgoj',
      name: 'Upravni odjel za odgoj i školstvo',
      website: 'https://www.grad-zadar.hr/upravni-odjel-za-odgoj-i-skolstvo-304/',
      subunits: [
        { name: 'Predškolstvo' },
        { name: 'Školstvo' },
        { name: 'Stipendiranje učenika i studenata' },
      ],
    },
    {
      id: 'gz-revizija',
      name: 'Služba za unutarnju reviziju',
      website: 'https://www.grad-zadar.hr/sluzba-za-unutarnju-reviziju-305/',
    },
    {
      id: 'gz-financije',
      name: 'Upravni odjel za financije',
      website: 'https://www.grad-zadar.hr/upravni-odjel-za-financije-306/',
      subunits: [
        { name: 'Proračun Grada Zadra' },
        { name: 'Lokalni porezi' },
        { name: 'Odsjek za javnu nabavu' },
      ],
    },
    {
      id: 'gz-imovina',
      name: 'Upravni odjel za gospodarenje gradskom imovinom',
      website: 'https://www.grad-zadar.hr/upravni-odjel-za-gospodarenje-gradskom-imovinom-307/',
      subunits: [
        { name: 'Korištenje javnih površina' },
        { name: 'Poslovni prostori' },
        { name: 'Stambeni prostori' },
        { name: 'Procjena vrijednosti nekretnina' },
        { name: 'Registar nekretnina' },
      ],
    },
    {
      id: 'gz-socijalna',
      name: 'Upravni odjel za socijalnu skrb i zdravstvo',
      website: 'https://www.grad-zadar.hr/upravni-odjel-za-socijalnu-skrb-i-zdravstvo-308/',
    },
    {
      id: 'gz-eu',
      name: 'Upravni odjel za EU fondove',
      website: 'https://www.grad-zadar.hr/upravni-odjel-za-eu-fondove-734/',
      subunits: [
        { name: 'Projekti' },
        { name: 'ITU Mehanizam' },
        { name: 'EU fondovi' },
      ],
    },
  ],
};

export const zadarskaZupanija: PublicServiceOrg = {
  id: 'zadarska-zupanija',
  name: 'Zadarska županija',
  centralPhone: '023 350 350',
  website: 'https://www.zadarska-zupanija.hr',
  address: 'Božidara Petranovića 8, 23000 Zadar',
  departments: [
    {
      id: 'zz-opca-uprava',
      name: 'Upravni odjel za opću upravu',
      website: 'https://www.zadarska-zupanija.hr/upravni-odjeli/upravni-odjel-za-op%C4%87u-upravu',
      subunits: [
        { name: 'Matični uredi' },
        { name: 'Registar birača' },
      ],
    },
    {
      id: 'zz-prostorno',
      name: 'Upravni odjel za prostorno uređenje, zaštitu okoliša i komunalne poslove',
      website: 'https://www.zadarska-zupanija.hr/upravni-odjeli/upravni-odjel-za-prostorno-ure%C4%91enje,-za%C5%A1titu-okoli%C5%A1a-i-komunalne-poslove',
      subunits: [
        { name: 'Građevinske dozvole' },
        { name: 'Izmjene i dopune Prostornog plana' },
        { name: 'Zaštita okoliša' },
      ],
    },
    {
      id: 'zz-gospodarstvo',
      name: 'Upravni odjel za gospodarstvo i turizam',
      website: 'https://www.zadarska-zupanija.hr/upravni-odjeli/upravni-odjel-za-gospodarstvo-i-turizam',
      subunits: [
        { name: 'Kategorizacija turističkih objekata' },
        { name: 'Potpore u turizmu' },
      ],
    },
    {
      id: 'zz-financije',
      name: 'Upravni odjel za financije i proračun',
      website: 'https://www.zadarska-zupanija.hr/upravni-odjeli/financije-i-prora%C4%8Dun',
      subunits: [
        { name: 'Proračun Zadarske županije' },
      ],
    },
    {
      id: 'zz-zdravstvo',
      name: 'Upravni odjel za zdravstvo',
      website: 'https://www.zadarska-zupanija.hr/upravni-odjeli/upravni-odjel-za-zdravstvo',
      subunits: [
        { name: 'Povjerenstvo za zaštitu prava pacijenata' },
      ],
    },
    {
      id: 'zz-obrazovanje',
      name: 'Upravni odjel za obrazovanje, kulturu i šport',
      website: 'https://www.zadarska-zupanija.hr/upravni-odjeli/obrazovanje-kultura-i-sport',
      subunits: [
        { name: 'Javne potrebe u kulturi' },
        { name: 'Javne potrebe u športu' },
      ],
    },
    {
      id: 'zz-branitelji',
      name: 'Upravni odjel za hrvatske branitelje, udruge, demografiju i socijalnu politiku',
      website: 'https://www.zadarska-zupanija.hr/upravni-odjeli/branitelji-udruge-demografija',
      subunits: [
        { name: 'Socijalna skrb i humanitarni rad' },
        { name: 'Stambeno zbrinjavanje' },
      ],
    },
    {
      id: 'zz-pomorsko',
      name: 'Upravni odjel za pomorsko dobro, more i promet',
      website: 'https://www.zadarska-zupanija.hr/upravni-odjeli/upravni-odjel-za-pomorsko-dobro,-more-i-promet',
      subunits: [
        { name: 'Koncesije na pomorskom dobru' },
      ],
    },
  ],
};

export const publicServiceOrgs: Record<string, PublicServiceOrg> = {
  'grad-zadar': gradZadar,
  'zadarska-zupanija': zadarskaZupanija,
};
