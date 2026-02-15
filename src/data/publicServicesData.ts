export interface DepartmentContact {
  name: string;
  title: string;
  phone?: string;
  email?: string;
}

export interface PublicServiceDepartment {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  contacts?: DepartmentContact[];
  subunits?: { name: string; phone?: string; email?: string; link?: string }[];
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
      contacts: [
        { name: 'Sanja Jurišić', title: 'Pročelnica', email: 'sanja.jurisic@grad-zadar.hr', phone: '099 192 8811' },
        { name: 'Boris Artić', title: 'Zamjenik pročelnice', phone: '023 208 181', email: 'boris.artic@grad-zadar.hr' },
        { name: 'Ivana Dadić', title: 'Voditeljica Odsjeka za informiranje', phone: '023 208 173', email: 'idadic@grad-zadar.hr' },
        { name: 'Anita Gržan Martinović', title: 'Viši savjetnik za međunarodnu suradnju', phone: '023 208 176', email: 'AGrzan@grad-zadar.hr' },
      ],
    },
    {
      id: 'gz-prostorno',
      name: 'Upravni odjel za prostorno uređenje i graditeljstvo',
      website: 'https://www.grad-zadar.hr/upravni-odjel-za-prostorno-uredenje-i-graditeljstvo-168/',
      email: 'graditeljstvo@grad-zadar.hr',
      contacts: [
        { name: 'Darko Kasap', title: 'Pročelnik', phone: '023 208 040', email: 'darko.kasap@grad-zadar.hr' },
        { name: 'Matko Segarić', title: 'Zamjenik pročelnika I', phone: '023 208 040', email: 'matko.segaric@grad-zadar.hr' },
        { name: 'Slavica Kardum', title: 'Zamjenica pročelnika II', phone: '023 208 031', email: 'slavica.kardum@grad-zadar.hr' },
        { name: 'Marija Pavlović Palčok', title: 'Pomoćnica za ozakonjenje zgrada', phone: '023 208 030', email: 'marija.pavlovic-palcok@grad-zadar.hr' },
        { name: 'Hrvoje Baranović', title: 'Pomoćnik za prostorno uređenje i gradnju', phone: '023 208 025', email: 'hrvoje.baranovic@grad-zadar.hr' },
        { name: 'Andrej Sudinja', title: 'Pomoćnik za prostorno uređenje i en. učinkovitost', phone: '023 208 041', email: 'andrej.sudinja@grad-zadar.hr' },
        { name: 'Ivana Volarević', title: 'Pomoćnica za komunalni doprinos', phone: '023 208 059', email: 'ivana.volarevic@grad-zadar.hr' },
      ],
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
      contacts: [
        { name: 'Hrvoje Marić', title: 'Pročelnik', phone: '023 208 115', email: 'hrvoje.maric@grad-zadar.hr' },
        { name: 'Hrvoje Šarić', title: 'Zamjenik pročelnika', phone: '023 208 115', email: 'hrvoje.saric@grad-zadar.hr' },
        { name: 'Žana Klarić', title: 'Pomoćnica pročelnika', phone: '023 208 115', email: 'zana.klaric@grad-zadar.hr' },
      ],
      subunits: [
        { name: 'Odsjek za komunalno redarstvo', phone: '023 208 125', email: 'komredarstvo@grad-zadar.hr' },
        { name: 'Odsjek za prometno redarstvo', phone: '023 627 701', email: 'prometno.redarstvo@grad-zadar.hr' },
        { name: 'Odsjek za zaštitu okoliša', phone: '023 208 120', email: 'okolis@grad-zadar.hr' },
        { name: 'Odsjek za komunalnu naknadu', phone: '023 208 112', email: 'komunalna.naknada@grad-zadar.hr' },
        { name: 'Odsjek za ceste i promet', phone: '023 208 117', email: 'ceste.promet@grad-zadar.hr' },
      ],
    },
    {
      id: 'gz-gospodarstvo',
      name: 'Upravni odjel za gospodarstvo, obrtništvo i razvitak otoka',
      website: 'https://www.grad-zadar.hr/upravni-odjel-za-gospodarstvo-obrtnistvo-i-razvitak-otoka-370/',
      contacts: [
        { name: 'Grozdana Perić', title: 'Pročelnica', phone: '023 208 090', email: 'grozdana.peric@grad-zadar.hr' },
        { name: 'Mate Pinčić', title: 'Zamjenik pročelnice', phone: '023 208 090', email: 'mate.pincic@grad-zadar.hr' },
        { name: 'Blanka Dujela', title: 'Pomoćnica za poduzetništvo i turizam', phone: '023 208 087', email: 'blanka.dujela@grad-zadar.hr' },
        { name: 'Ivan Plazina', title: 'Voditelj Odsjeka za otoke i poljoprivredu', phone: '023 208 009', email: 'ivan.plazina@grad-zadar.hr' },
        { name: 'Anita Krpina', title: 'Voditeljica Odsjeka za poduzetništvo', phone: '023 208 185', email: 'anita.krpina@grad-zadar.hr' },
        { name: 'Šime Baraba', title: 'Stručni suradnik za informatiku', phone: '023 208 082', email: 'sime.baraba@grad-zadar.hr' },
      ],
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
      name: 'Upravni odjel za poslove Gradonačelnika i Gradskog vijeća',
      website: 'https://www.grad-zadar.hr/upravni-odjel-za-poslove-gradonacelnika-i-gradskog-vijeca-167/',
      contacts: [
        { name: 'Mirjana Zubčić', title: 'Pročelnica', phone: '023 208 172', email: 'mirjana.zubcic@grad-zadar.hr' },
        { name: 'Marijana Gabre', title: 'Pomoćnica pročelnice', phone: '023 208 175', email: 'marijana.gabre@grad-zadar.hr' },
        { name: 'Ivana Dlačić', title: 'Referentica za poslove Ureda grada', phone: '023 208 172', email: 'ivana.dlacic@grad-zadar.hr' },
        { name: 'Sara Kosanović', title: 'Referentica za sjednice Gradskog vijeća', phone: '023 208 189', email: 'sara.kosanovic@grad-zadar.hr' },
      ],
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
      contacts: [
        { name: 'Krešimir Karamarko', title: 'Pročelnik', phone: '023 208 107', email: 'kresimir.karamarko@grad-zadar.hr' },
        { name: 'Branimir Vrkić', title: 'Unutarnji revizor', phone: '023 208 108', email: 'branimir.vrkic@grad-zadar.hr' },
      ],
    },
    {
      id: 'gz-financije',
      name: 'Upravni odjel za financije',
      website: 'https://www.grad-zadar.hr/upravni-odjel-za-financije-306/',
      contacts: [
        { name: 'Ivan Mijolović', title: 'Pročelnik', phone: '023 208 160', email: 'ivan.mijolovic@grad-zadar.hr' },
        { name: 'Anita Radetić', title: 'Zamjenica pročelnika', phone: '023 208 158', email: 'anita.radetic@grad-zadar.hr' },
        { name: 'Ana Vuleta', title: 'Voditeljica Odsjeka za poreze', phone: '023 208 054', email: 'ana.vuleta@grad-zadar.hr' },
      ],
      subunits: [
        { name: 'Proračun Grada Zadra' },
        { name: 'Lokalni porezi' },
        { name: 'Odsjek za javnu nabavu', phone: '023 208 165', email: 'javna.nabava@grad-zadar.hr' },
      ],
    },
    {
      id: 'gz-imovina',
      name: 'Upravni odjel za gospodarenje gradskom imovinom',
      website: 'https://www.grad-zadar.hr/upravni-odjel-za-gospodarenje-gradskom-imovinom-307/',
      contacts: [
        { name: 'Tomislav Korona', title: 'Pročelnik', phone: '023 208 130', email: 'tomislav.korona@grad-zadar.hr' },
        { name: 'Marin Batur', title: 'Zamjenik pročelnika', phone: '023 208 137', email: 'marin.batur@grad-zadar.hr' },
        { name: 'Josipa Mileta', title: 'Pomoćnica pročelnika', phone: '023 208 145', email: 'josipa.mileta@grad-zadar.hr' },
        { name: 'Vesna Ivanov', title: 'Referent za javne površine', phone: '023 208 133', email: 'vesna.ivanov@grad-zadar.hr' },
        { name: 'Tijana Buterin', title: 'Voditeljica Odsjeka za zemljište', phone: '023 208 139', email: 'tijana.buterin@grad-zadar.hr' },
        { name: 'Iva Stipčević Pantalon', title: 'Procjena nekretnina', phone: '023 208 134', email: 'iva.stipcevicpantalon@grad-zadar.hr' },
      ],
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
      contacts: [
        { name: 'Mladen Klanac', title: 'Pročelnik', phone: '023 208 140', email: 'mladen.klanac@grad-zadar.hr' },
        { name: 'Marta Brala', title: 'Referent za uredsko poslovanje', phone: '023 208 140', email: 'marta.brala@grad-zadar.hr' },
      ],
    },
    {
      id: 'gz-eu',
      name: 'Upravni odjel za EU fondove',
      website: 'https://www.grad-zadar.hr/upravni-odjel-za-eu-fondove-734/',
      email: 'eufondovi@grad-zadar.hr',
      contacts: [
        { name: 'Stefani Mikulec Perković', title: 'Pročelnica', phone: '023 208 005', email: 'stefani.mikulec@grad-zadar.hr' },
      ],
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
