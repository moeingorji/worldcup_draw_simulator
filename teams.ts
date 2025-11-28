import { Team } from "./draw";

// Canonical team list for FIFA 2026 group draw simulation.
// Ranking values provided; hosts flagged; unknown playoff winners use possibleConfeds.
export const teams: Team[] = [
  // Pot 1
  { id: "usa", name: "United States", pot: 1, ranking: 14, isHost: true, confed: "CONCACAF" },
  { id: "mexico", name: "Mexico", pot: 1, ranking: 15, isHost: true, confed: "CONCACAF" },
  { id: "canada", name: "Canada", pot: 1, ranking: 27, isHost: true, confed: "CONCACAF" },
  { id: "spain", name: "Spain", pot: 1, ranking: 1, confed: "UEFA" },
  { id: "argentina", name: "Argentina", pot: 1, ranking: 2, confed: "CONMEBOL" },
  { id: "france", name: "France", pot: 1, ranking: 3, confed: "UEFA" },
  { id: "england", name: "England", pot: 1, ranking: 4, confed: "UEFA" },
  { id: "brazil", name: "Brazil", pot: 1, ranking: 5, confed: "CONMEBOL" },
  { id: "portugal", name: "Portugal", pot: 1, ranking: 6, confed: "UEFA" },
  { id: "netherlands", name: "Netherlands", pot: 1, ranking: 7, confed: "UEFA" },
  { id: "belgium", name: "Belgium", pot: 1, ranking: 8, confed: "UEFA" },
  { id: "germany", name: "Germany", pot: 1, ranking: 9, confed: "UEFA" },

  // Pot 2
  { id: "croatia", name: "Croatia", pot: 2, ranking: 10, confed: "UEFA" },
  { id: "morocco", name: "Morocco", pot: 2, ranking: 11, confed: "CAF" },
  { id: "colombia", name: "Colombia", pot: 2, ranking: 13, confed: "CONMEBOL" },
  { id: "uruguay", name: "Uruguay", pot: 2, ranking: 16, confed: "CONMEBOL" },
  { id: "switzerland", name: "Switzerland", pot: 2, ranking: 17, confed: "UEFA" },
  { id: "japan", name: "Japan", pot: 2, ranking: 18, confed: "AFC" },
  { id: "senegal", name: "Senegal", pot: 2, ranking: 19, confed: "CAF" },
  { id: "iran", name: "Iran", pot: 2, ranking: 20, confed: "AFC" },
  { id: "south-korea", name: "South Korea", pot: 2, ranking: 22, confed: "AFC" },
  { id: "ecuador", name: "Ecuador", pot: 2, ranking: 23, confed: "CONMEBOL" },
  { id: "austria", name: "Austria", pot: 2, ranking: 24, confed: "UEFA" },
  { id: "australia", name: "Australia", pot: 2, ranking: 26, confed: "AFC" },

  // Pot 3
  { id: "norway", name: "Norway", pot: 3, ranking: 29, confed: "UEFA" },
  { id: "panama", name: "Panama", pot: 3, ranking: 30, confed: "CONCACAF" },
  { id: "egypt", name: "Egypt", pot: 3, ranking: 34, confed: "CAF" },
  { id: "algeria", name: "Algeria", pot: 3, ranking: 35, confed: "CAF" },
  { id: "scotland", name: "Scotland", pot: 3, ranking: 36, confed: "UEFA" },
  { id: "paraguay", name: "Paraguay", pot: 3, ranking: 39, confed: "CONMEBOL" },
  { id: "tunisia", name: "Tunisia", pot: 3, ranking: 40, confed: "CAF" },
  { id: "ivory-coast", name: "Ivory Coast", pot: 3, ranking: 42, confed: "CAF" },
  { id: "uzbekistan", name: "Uzbekistan", pot: 3, ranking: 50, confed: "AFC" },
  { id: "qatar", name: "Qatar", pot: 3, ranking: 51, confed: "AFC" },
  { id: "saudi-arabia", name: "Saudi Arabia", pot: 3, ranking: 60, confed: "AFC" },
  { id: "south-africa", name: "South Africa", pot: 3, ranking: 61, confed: "CAF" },

  // Pot 4
  { id: "jordan", name: "Jordan", pot: 4, ranking: 66, confed: "AFC" },
  { id: "cape-verde", name: "Cape Verde", pot: 4, ranking: 68, confed: "CAF" },
  { id: "ghana", name: "Ghana", pot: 4, ranking: 72, confed: "CAF" },
  { id: "curacao", name: "Curacao", pot: 4, ranking: 82, confed: "CONCACAF" },
  { id: "haiti", name: "Haiti", pot: 4, ranking: 84, confed: "CONCACAF" },
  { id: "new-zealand", name: "New Zealand", pot: 4, ranking: 86, confed: "OFC" },
  { id: "uefa-path-a", name: "UEFA play-offs Path A winners", pot: 4, confed: "UEFA" },
  { id: "uefa-path-b", name: "UEFA play-offs Path B winners", pot: 4, confed: "UEFA" },
  { id: "uefa-path-c", name: "UEFA play-offs Path C winners", pot: 4, confed: "UEFA" },
  { id: "uefa-path-d", name: "UEFA play-offs Path D winners", pot: 4, confed: "UEFA" },
  {
    id: "ic-path-1",
    name: "IC play-off Pathway 1 winners",
    pot: 4,
    possibleConfeds: ["CAF", "CONCACAF", "OFC"],
  },
  {
    id: "ic-path-2",
    name: "IC play-off Pathway 2 winners",
    pot: 4,
    possibleConfeds: ["AFC", "CONCACAF", "CONMEBOL"],
  },
];

export default teams;
