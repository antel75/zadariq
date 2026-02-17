// Whitelist of valid teams per league for manual sports entry validation.
// This prevents embarrassing mismatches (e.g., 4th league vs 1st league teams).

export interface LeagueTeams {
  league: string;
  sport: string;
  teams: string[];
}

export const SPORTS_LEAGUES: LeagueTeams[] = [
  {
    league: "SuperSport HNL",
    sport: "football",
    teams: [
      "HNK Hajduk Split", "GNK Dinamo Zagreb", "HNK Rijeka", "NK Osijek",
      "NK Lokomotiva", "HNK Gorica", "NK Istra 1961", "NK Slaven Belupo",
      "NK Varaždin", "NK Rudeš",
    ],
  },
  {
    league: "Prva NL",
    sport: "football",
    teams: [
      "NK Dubrava", "NK Dugopolje", "NK Bijelo Brdo", "NK Solin",
      "NK Sesvete", "NK Orijent", "NK Cibalia", "NK Šibenik",
      "NK Požega", "NK Croatia Zmijavci",
    ],
  },
  {
    league: "4. HNL Jug",
    sport: "football",
    teams: [
      "NK Zadar", "NK Primorac Biograd", "NK Bratstvo Žman",
      "NK Stanovi", "NK Iskra Nin", "NK Vir", "NK Novigrad",
    ],
  },
  {
    league: "UEFA Champions League",
    sport: "football",
    teams: [
      "Real Madrid", "FC Barcelona", "Bayern Munich", "Manchester City",
      "Liverpool", "PSG", "Inter Milan", "AC Milan", "Juventus",
      "Arsenal", "Borussia Dortmund", "Atletico Madrid", "Benfica",
      "Porto", "Celtic", "Club Brugge", "RB Leipzig", "Napoli",
      "Atalanta", "Feyenoord", "PSV Eindhoven", "Bayer Leverkusen",
      "GNK Dinamo Zagreb",
    ],
  },
  {
    league: "UEFA Euro / Kvalifikacije",
    sport: "football",
    teams: [
      "Hrvatska", "Croatia", "Germany", "France", "Spain", "Italy",
      "England", "Portugal", "Netherlands", "Belgium", "Serbia",
      "Turkey", "Austria", "Switzerland", "Poland", "Czech Republic",
    ],
  },
  {
    league: "ABA Liga",
    sport: "basketball",
    teams: [
      "KK Zadar", "KK Split", "KK Cibona", "KK Cedevita Olimpija",
      "KK Partizan", "KK Crvena Zvezda", "KK Budućnost", "KK Mega",
      "KK FMP", "KK Mornar", "KK Igokea", "KK Borac",
    ],
  },
  {
    league: "HKL (Hrvatska košarkaška liga)",
    sport: "basketball",
    teams: [
      "KK Zadar", "KK Split", "KK Cibona", "KK Zagreb",
      "KK Šibenik", "KK Dubrovnik", "KK Alkar",
    ],
  },
  {
    league: "Formula 1",
    sport: "f1",
    teams: ["Formula 1"],
  },
];

// All unique team names for autocomplete
export const ALL_TEAMS: string[] = [
  ...new Set(SPORTS_LEAGUES.flatMap(l => l.teams)),
].sort();

// Get leagues a team belongs to
export function getTeamLeagues(teamName: string): string[] {
  return SPORTS_LEAGUES
    .filter(l => l.teams.some(t => t.toLowerCase() === teamName.toLowerCase()))
    .map(l => l.league);
}

// Check if two teams can realistically play each other
export function canTeamsPlay(homeTeam: string, awayTeam: string): { valid: boolean; reason?: string } {
  const homeLeagues = getTeamLeagues(homeTeam);
  const awayLeagues = getTeamLeagues(awayTeam);

  if (homeLeagues.length === 0 && awayLeagues.length === 0) {
    return { valid: true }; // Both unknown — allow with warning
  }

  if (homeLeagues.length === 0 || awayLeagues.length === 0) {
    return { valid: true }; // One unknown — allow
  }

  // Check if they share at least one league
  const sharedLeagues = homeLeagues.filter(l => awayLeagues.includes(l));
  if (sharedLeagues.length > 0) {
    return { valid: true };
  }

  // Special cases: international competitions can match any teams
  const internationalLeagues = ["UEFA Champions League", "UEFA Euro / Kvalifikacije"];
  const homeInternational = homeLeagues.some(l => internationalLeagues.includes(l));
  const awayInternational = awayLeagues.some(l => internationalLeagues.includes(l));
  if (homeInternational || awayInternational) {
    return { valid: true };
  }

  return {
    valid: false,
    reason: `⚠️ ${homeTeam} (${homeLeagues.join(", ")}) i ${awayTeam} (${awayLeagues.join(", ")}) nisu u istoj ligi. Ova utakmica je nerealna.`,
  };
}

// Map team name to team_tag for sports_events
export function getTeamTag(teamName: string): string {
  const lower = teamName.toLowerCase();
  if (lower.includes("hajduk")) return "hajduk";
  if (lower.includes("nk zadar")) return "nk_zadar";
  if (lower.includes("kk zadar")) return "kk_zadar";
  if (lower.includes("dinamo")) return "dinamo";
  if (lower.includes("hrvatska") || lower === "croatia") return "croatia_nt";
  if (lower.includes("formula")) return "f1";
  return lower.replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
}
