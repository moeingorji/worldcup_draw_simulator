type Confederation = "UEFA" | "CONMEBOL" | "CONCACAF" | "CAF" | "AFC" | "OFC";

type PotNumber = 1 | 2 | 3 | 4;

type GroupId =
  | "A"
  | "B"
  | "C"
  | "D"
  | "E"
  | "F"
  | "G"
  | "H"
  | "I"
  | "J"
  | "K"
  | "L";

type Pathway = "SIDE1" | "SIDE2";

const GROUP_IDS: GroupId[] = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
];

const GROUP_PATHWAY: Record<GroupId, Pathway> = {
  E: "SIDE1",
  I: "SIDE1",
  F: "SIDE1",
  H: "SIDE1",
  D: "SIDE1",
  G: "SIDE1",
  C: "SIDE2",
  A: "SIDE2",
  L: "SIDE2",
  J: "SIDE2",
  B: "SIDE2",
  K: "SIDE2",
};

// Semi-final sub-sides for top-4 separation.
// Semi 1: (E, I, F) vs (H, G)
// Semi 2: (C, L) vs (J, K)
const SEMI_CLUSTER: Partial<Record<GroupId, string>> = {
  E: "S1A",
  I: "S1A",
  F: "S1A",
  H: "S1B",
  G: "S1B",
  C: "S2A",
  L: "S2A",
  J: "S2B",
  K: "S2B",
};

const isTop4 = (team: Team): boolean =>
  typeof team.ranking === "number" && team.ranking >= 1 && team.ranking <= 4;

interface Team {
  id: string;
  name: string;
  pot: PotNumber;
  ranking?: number;
  isHost?: boolean;
  confed?: Confederation;
  possibleConfeds?: Confederation[];
}

interface GroupSlot {
  position: 1 | 2 | 3 | 4;
  team?: Team;
}

interface Group {
  id: GroupId;
  slots: GroupSlot[];
}

interface DrawState {
  groups: Record<GroupId, Group>;
  pots: Record<PotNumber, Team[]>;
  currentPot: PotNumber;
  drawOrder: Team[];
}

type ConfedCounts = Record<Confederation, number>;

const HOST_ASSIGNMENTS: Record<string, GroupId> = {
  Mexico: "A",
  Canada: "B",
  "United States": "D",
};

// Predefined slot for each pot per group (from provided draw pattern).
const POSITION_BY_GROUP_POT: Record<GroupId, Record<PotNumber, 1 | 2 | 3 | 4>> = {
  A: { 1: 1, 2: 3, 3: 2, 4: 4 },
  B: { 1: 1, 2: 4, 3: 3, 4: 2 },
  C: { 1: 1, 2: 2, 3: 4, 4: 3 },
  D: { 1: 1, 2: 3, 3: 2, 4: 4 },
  E: { 1: 1, 2: 4, 3: 3, 4: 2 },
  F: { 1: 1, 2: 2, 3: 4, 4: 3 },
  G: { 1: 1, 2: 3, 3: 2, 4: 4 },
  H: { 1: 1, 2: 4, 3: 3, 4: 2 },
  I: { 1: 1, 2: 2, 3: 4, 4: 3 },
  J: { 1: 1, 2: 3, 3: 2, 4: 4 },
  K: { 1: 1, 2: 4, 3: 3, 4: 2 },
  L: { 1: 1, 2: 2, 3: 4, 4: 3 },
};

type PotPositions = 1 | (2 | 3 | 4)[];

const NON_SEEDED_POSITIONS: (2 | 3 | 4)[] = [2, 3, 4];

const POSITION_FOR_POT: Record<PotNumber, PotPositions> = {
  1: 1,
  2: NON_SEEDED_POSITIONS,
  3: NON_SEEDED_POSITIONS,
  4: NON_SEEDED_POSITIONS,
};

const isPotPositionsList = (
  value: PotPositions
): value is (2 | 3 | 4)[] => Array.isArray(value);

const createEmptyGroup = (id: GroupId): Group => ({
  id,
  slots: [
    { position: 1 },
    { position: 2 },
    { position: 3 },
    { position: 4 },
  ],
});

const buildEmptyGroups = (): Record<GroupId, Group> =>
  GROUP_IDS.reduce<Record<GroupId, Group>>((acc, id) => {
    acc[id] = createEmptyGroup(id);
    return acc;
  }, {} as Record<GroupId, Group>);

const splitTeamsIntoPots = (teams: Team[]): Record<PotNumber, Team[]> => {
  const pots: Record<PotNumber, Team[]> = { 1: [], 2: [], 3: [], 4: [] };
  teams.forEach((team) => {
    pots[team.pot].push(team);
  });
  return pots;
};

const removeTeamFromPot = (
  pots: Record<PotNumber, Team[]>,
  team: Team
): Record<PotNumber, Team[]> => ({
  ...pots,
  [team.pot]: pots[team.pot].filter((t) => t.id !== team.id),
});

const getConfedCounts = (group: Group): ConfedCounts => {
  const counts: ConfedCounts = {
    UEFA: 0,
    CONMEBOL: 0,
    CONCACAF: 0,
    CAF: 0,
    AFC: 0,
    OFC: 0,
  };
  group.slots.forEach((slot) => {
    if (slot.team?.confed) {
      counts[slot.team.confed] += 1;
    }
  });
  return counts;
};

const hasAvailableSlotForPot = (groupId: GroupId, group: Group, pot: PotNumber): boolean => {
  const pos = POSITION_BY_GROUP_POT[groupId][pot];
  const slot = group.slots[pos - 1];
  return Boolean(slot && !slot.team);
};

const slotForGroupPot = (groupId: GroupId, pot: PotNumber): 1 | 2 | 3 | 4 =>
  POSITION_BY_GROUP_POT[groupId][pot];

const cloneGroupWithPlacement = (
  group: Group,
  team: Team,
  position: 1 | 2 | 3 | 4
): Group => {
  const updatedSlots = group.slots.map((slot) =>
    slot.position === position ? { ...slot, team } : slot
  );
  return { ...group, slots: updatedSlots };
};

const nextPot = (current: PotNumber): PotNumber =>
  current === 4 ? 4 : ((current + 1) as PotNumber);

const allPotsEmpty = (pots: Record<PotNumber, Team[]>): boolean =>
  Object.values(pots).every((teams) => teams.length === 0);

const shuffle = <T>(arr: T[]): T[] => {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const placeHostTeams = (
  groups: Record<GroupId, Group>,
  pots: Record<PotNumber, Team[]>
): { groups: Record<GroupId, Group>; pots: Record<PotNumber, Team[]> } => {
  let updatedGroups = { ...groups };
  let updatedPots = { ...pots };

  Object.entries(HOST_ASSIGNMENTS).forEach(([name, groupId]) => {
    const normalizedName = name.toLowerCase();
    const host = updatedPots[1].find(
      (team) =>
        team.name.toLowerCase() === normalizedName ||
        team.id.toLowerCase() === normalizedName
    );
    if (!host) {
      throw new Error(`Missing host team: ${name}`);
    }
    const group = updatedGroups[groupId];
    updatedGroups = {
      ...updatedGroups,
      [groupId]: cloneGroupWithPlacement(group, host, 1),
    };
    updatedPots = removeTeamFromPot(updatedPots, host);
  });

  return { groups: updatedGroups, pots: updatedPots };
};

const teamHasKnownConfed = (team: Team): team is Team & { confed: Confederation } =>
  Boolean(team.confed);

const teamHasPossibleConfeds = (
  team: Team
): team is Team & { possibleConfeds: Confederation[] } =>
  Array.isArray(team.possibleConfeds) && team.possibleConfeds.length === 3;

/**
 * Initialize draw state with empty groups, pots, and host placements.
 */
const initDrawState = (teams: Team[]): DrawState => {
  const groups = buildEmptyGroups();
  const pots = splitTeamsIntoPots(teams);
  const { groups: seededGroups, pots: potsWithoutHosts } = placeHostTeams(
    groups,
    pots
  );

  return {
    groups: seededGroups,
    pots: potsWithoutHosts,
    currentPot: 1,
    drawOrder: [],
  };
};

/**
 * Confederation compliance check. For UEFA we allow up to two teams;
 * for other confeds we allow at most one. Unknown playoff teams are treated
 * as "could be any" of their possibleConfeds and blocked if every option
 * would exceed limits in the current group.
 */
const canPlaceTeamInGroup = (team: Team, group: Group): boolean => {
  if (!hasAvailableSlotForPot(group.id, group, team.pot)) {
    return false;
  }

  // Enforce exactly one team per pot in each group.
  if (group.slots.some((slot) => slot.team?.pot === team.pot)) {
    return false;
  }

  const confedCounts = getConfedCounts(group);

  if (teamHasKnownConfed(team)) {
    if (team.confed === "UEFA") {
      return confedCounts.UEFA < 2;
    }
    return confedCounts[team.confed] === 0;
  }

  if (teamHasPossibleConfeds(team)) {
    // Strict: every possible confed must remain under its limit in this group.
    // Non-UEFA: must not already be present. UEFA: must be below 2.
    return team.possibleConfeds.every((possible) => {
      if (possible === "UEFA") {
        return confedCounts.UEFA < 2;
      }
      return confedCounts[possible] === 0;
    });
  }

  // Should never happen: every team must have confed or possibleConfeds.
  return false;
};

const findGroupOfRanking = (state: DrawState, rank: number): GroupId | undefined => {
  for (const gid of GROUP_IDS) {
    const g = state.groups[gid];
    for (const slot of g.slots) {
      if (slot.team?.ranking === rank) return gid;
    }
  }
  return undefined;
};

const rankingPlacementAllowed = (state: DrawState, team: Team, groupId: GroupId): boolean => {
  if (!team.ranking || team.ranking < 1 || team.ranking > 4) return true;
  const targetPath = GROUP_PATHWAY[groupId];
  const pairRank = team.ranking === 1 ? 2 : team.ranking === 2 ? 1 : team.ranking === 3 ? 4 : 3;
  const pairGroup = findGroupOfRanking(state, pairRank);
  if (!pairGroup) return true;
  // Different pathway for (1,2) and (3,4)
  if (GROUP_PATHWAY[pairGroup] === targetPath) return false;
  // Also split across semi clusters for all top-4
  const targetCluster = SEMI_CLUSTER[groupId];
  const pairCluster = SEMI_CLUSTER[pairGroup];
  if (targetCluster && pairCluster && targetCluster === pairCluster) return false;
  return true;
};

const isUefaCapable = (team: Team): boolean =>
  (team.confed && team.confed === "UEFA") ||
  (team.possibleConfeds && team.possibleConfeds.includes("UEFA"));

const getValidGroupsForTeam = (state: DrawState, team: Team): GroupId[] => {
  const baseAll = GROUP_IDS.filter(
    (id) => canPlaceTeamInGroup(team, state.groups[id]) && rankingPlacementAllowed(state, team, id)
  );

  const remaining = remainingTeams(state);

  // Forced UEFA distribution: if the number of UEFA-capable remaining teams equals
  // the number of groups without a UEFA team, restrict UEFA-capable teams to only those groups.
  const needUefaGroups = GROUP_IDS.filter((gid) => getConfedCounts(state.groups[gid]).UEFA === 0);
  const remainingUefaCapable = remaining.filter(isUefaCapable).length;
  if (needUefaGroups.length > remainingUefaCapable) {
    return [];
  }
  if (needUefaGroups.length > 0 && needUefaGroups.length === remainingUefaCapable) {
    if (isUefaCapable(team)) {
      return baseAll.filter((g) => needUefaGroups.includes(g));
    }
    return baseAll.filter((g) => !needUefaGroups.includes(g));
  }

  // Top-4 cluster locking: four clusters must each contain exactly one top-4.
  const clusterIds = Array.from(
    new Set(Object.values(SEMI_CLUSTER).filter((x): x is string => Boolean(x)))
  );
  const clustersWithTop4 = new Set<string>();
  for (const gid of GROUP_IDS) {
    const cluster = SEMI_CLUSTER[gid];
    if (!cluster) continue;
    const hasTop4 = state.groups[gid].slots.some((s) => s.team && isTop4(s.team));
    if (hasTop4) clustersWithTop4.add(cluster);
  }
  const missingClusters = clusterIds.filter((c) => !clustersWithTop4.has(c));
  const remainingTop4 = remaining.filter(isTop4).length;
  const inMissing = (gid: GroupId) => {
    const c = SEMI_CLUSTER[gid];
    return c ? missingClusters.includes(c) : false;
  };
  const inCluster = (gid: GroupId) => Boolean(SEMI_CLUSTER[gid]);

  if (missingClusters.length > remainingTop4) {
    return [];
  }

  if (isTop4(team)) {
    // Top-4 must stay within clusters and only in clusters that don't already have a top-4.
    let candidates = baseAll.filter(
      (g) => inCluster(g) && !clustersWithTop4.has(SEMI_CLUSTER[g] as string)
    );
    if (missingClusters.length === remainingTop4 && missingClusters.length > 0) {
      candidates = candidates.filter(inMissing);
    }
    return candidates;
  }

  // Non top-4 (only pot 1 matters for cluster seeds): allow if enough cluster slots
  // remain for the unplaced top-4. Block placing into a missing cluster only when it
  // would consume the last open slot needed for remaining top-4 seeds.
  if (team.pot === 1 && missingClusters.length > 0 && remainingTop4 > 0) {
    // Count open position-1 slots per cluster.
    const openSlotsPerCluster: Record<string, number> = {};
    for (const gid of GROUP_IDS) {
      const cluster = SEMI_CLUSTER[gid];
      if (!cluster) continue;
      const slot1 = state.groups[gid].slots.find((s) => s.position === 1);
      if (!slot1?.team) {
        openSlotsPerCluster[cluster] = (openSlotsPerCluster[cluster] ?? 0) + 1;
      }
    }

    return baseAll.filter((g) => {
      const cluster = SEMI_CLUSTER[g];
      if (!cluster) return true;
      if (!missingClusters.includes(cluster)) return true;
      const totalOpenMissing = missingClusters.reduce(
        (sum, c) => sum + (openSlotsPerCluster[c] ?? 0),
        0
      );
      const afterOpen = totalOpenMissing - 1; // placing this team consumes one slot in that cluster
      return afterOpen >= remainingTop4;
    });
  }

  return baseAll;
};

const remainingTeams = (state: DrawState): Team[] =>
  [1, 2, 3, 4]
    .map((p) => state.pots[p as PotNumber])
    .reduce((acc, arr) => acc.concat(arr), [] as Team[]);

/**
 * Compute domains (possible groups) for all remaining teams and check feasibility:
 * - every team has at least one possible group
 * - simple Hall/pigeonhole: no more teams share an identical domain than its size
 */
const computeDomainsFeasible = (state: DrawState): { feasible: boolean; domains: Record<string, GroupId[]> } => {
  const rem = remainingTeams(state);
  const domainMap: Record<string, GroupId[]> = {};
  const keyCount: Record<string, number> = {};

  for (const t of rem) {
    const domain = getValidGroupsForTeam(state, t);
    if (domain.length === 0) {
      return { feasible: false, domains: {} };
    }
    const key = domain.slice().sort().join(",");
    domainMap[key] = domain;
    keyCount[key] = (keyCount[key] ?? 0) + 1;
  }

  for (const key of Object.keys(keyCount)) {
    const size = domainMap[key].length;
    if (keyCount[key] > size) {
      return { feasible: false, domains: domainMap };
    }
  }

  return { feasible: true, domains: domainMap };
};

const placeTeam = (
  state: DrawState,
  team: Team,
  groupId: GroupId
): DrawState => {
  const group = state.groups[groupId];
  const targetPosition = slotForGroupPot(groupId, team.pot);
  const updatedGroup = cloneGroupWithPlacement(group, team, targetPosition);
  const updatedGroups = { ...state.groups, [groupId]: updatedGroup };
  const updatedPots = removeTeamFromPot(state.pots, team);
  const potExhausted = updatedPots[state.currentPot].length === 0;
  const nextPotNumber = potExhausted ? nextPot(state.currentPot) : state.currentPot;

  return {
    groups: updatedGroups,
    pots: updatedPots,
    currentPot: nextPotNumber,
    drawOrder: [...state.drawOrder, team],
  };
};

const drawNextTeamRandom = (state: DrawState): DrawState | null => {
  const currentPotTeams = state.pots[state.currentPot];
  if (currentPotTeams.length === 0) {
    return null;
  }

  const teamIndex = Math.floor(Math.random() * currentPotTeams.length);
  const team = currentPotTeams[teamIndex];
  const validGroups = getValidGroupsForTeam(state, team);

  if (validGroups.length === 0) {
    return null;
  }

  const groupIndex = Math.floor(Math.random() * validGroups.length);
  const chosenGroup = validGroups[groupIndex];
  return placeTeam(state, team, chosenGroup);
};

type SafeDrawResult = { state: DrawState; adjusted: boolean; team: Team; group: GroupId };
type SolveBudgetResult = { state: DrawState | null; exhausted: boolean };

const nowMs = (): number => Date.now();

const isIcPathTeam = (team: Team) =>
  team.id.toLowerCase() === "ic-path-1" || team.id.toLowerCase() === "ic-path-2";

/**
 * Check if all remaining teams (across all pots) have at least one possible group
 * and ensure a simple pigeonhole condition: for any identical domain of size k,
 * we cannot have more than k teams sharing that exact domain.
 */
const domainsFeasible = (state: DrawState): boolean => {
  const rem = remainingTeams(state);
  const domainMap: Record<string, GroupId[]> = {};
  const keyCount: Record<string, number> = {};

  for (const t of rem) {
    const domain = getValidGroupsForTeam(state, t).sort();
    if (domain.length === 0) return false;
    const key = domain.join(",");
    domainMap[key] = domain;
    keyCount[key] = (keyCount[key] ?? 0) + 1;
  }

  for (const key of Object.keys(keyCount)) {
    const size = domainMap[key].length;
    if (keyCount[key] > size) {
      return false;
    }
  }
  return true;
};

/**
 * Cheap feasibility check to ensure IC path teams still have at least one valid group.
 */
const icTeamsHaveOptions = (state: DrawState): boolean => {
  const icTeams = state.pots[4].filter(isIcPathTeam);
  for (const ic of icTeams) {
    const valid = getValidGroupsForTeam(state, ic);
    if (valid.length === 0) return false;
  }
  return true;
};

/**
 * Bipartite matching (teams -> groups) for a single pot to ensure every remaining team
 * in that pot can be placed in a distinct group. This catches "n teams with < n options"
 * style deadlocks.
 */
const potMatchingFeasible = (state: DrawState, pot: PotNumber): boolean => {
  const teams = state.pots[pot];
  if (teams.length === 0) return true;

  const availableGroups = GROUP_IDS.filter((gid) =>
    hasAvailableSlotForPot(gid, state.groups[gid], pot)
  );
  if (teams.length > availableGroups.length) return false;

  const domains = teams.map((t) => getValidGroupsForTeam(state, t));
  const match: Partial<Record<GroupId, number>> = {};

  const tryMatch = (idx: number, seen: Set<GroupId>): boolean => {
    for (const gid of domains[idx]) {
      if (seen.has(gid)) continue;
      seen.add(gid);
      const current = match[gid];
      if (current === undefined || tryMatch(current, seen)) {
        match[gid] = idx;
        return true;
      }
    }
    return false;
  };

  for (let i = 0; i < teams.length; i += 1) {
    if (domains[i].length === 0) return false;
    const seen = new Set<GroupId>();
    if (!tryMatch(i, seen)) {
      return false;
    }
  }
  return true;
};

const allPotsMatchingFeasible = (state: DrawState): boolean => {
  const pots: PotNumber[] = [1, 2, 3, 4];
  for (const p of pots) {
    if (!potMatchingFeasible(state, p)) return false;
  }
  return true;
};

const completedGroupsHaveUefa = (state: DrawState): boolean => {
  for (const gid of GROUP_IDS) {
    const g = state.groups[gid];
    const full = g.slots.every((s) => s.team);
    if (full) {
      if (getConfedCounts(g).UEFA < 1) return false;
    }
  }
  return true;
};

/**
 * Bounded backtracking: tries to solve all remaining pots with a node budget.
 * Returns {state, exhausted}. If exhausted is true, we hit the budget or deadline before
 * proving impossibility.
 */
const solveAllPotsWithBudget = (
  state: DrawState,
  budget: number,
  deadline: number
): SolveBudgetResult => {
  if (budget <= 0 || nowMs() >= deadline) {
    return { state: null, exhausted: true };
  }
  if (allPotsEmpty(state.pots)) {
    return { state, exhausted: false };
  }

  const currentPotTeams = state.pots[state.currentPot];
  if (currentPotTeams.length === 0) {
    const advanced: DrawState = { ...state, currentPot: nextPot(state.currentPot) };
    return solveAllPotsWithBudget(advanced, budget - 1, deadline);
  }

  const candidates = currentPotTeams
    .map((t) => ({ team: t, groups: getValidGroupsForTeam(state, t) }))
    .sort((a, b) => a.groups.length - b.groups.length);

  if (candidates[0].groups.length === 0) {
    return { state: null, exhausted: false };
  }

  for (const { team, groups } of candidates) {
    for (const groupId of groups) {
      const nextState = placeTeam(state, team, groupId);
      const res = solveAllPotsWithBudget(nextState, budget - 1, deadline);
      if (res.state) {
        return res;
      }
      if (res.exhausted) {
        return { state: null, exhausted: true };
      }
    }
    break;
  }

  return { state: null, exhausted: false };
};

/**
 * Pop the most recently placed team from the current pot, restoring it to the pot and
 * clearing its slot. Returns a new state or null if nothing to pop.
 */
/**
 * Safer draw step: draw a random team from the current pot, then place it in the first
 * valid group (A→L) that keeps all remaining teams feasible (domains + IC + per-pot matching).
 * If no direct placement works, we solve the current pot and take only the next placement
 * from that solution (no full auto-fill).
 */
const drawNextTeamSafe = (state: DrawState): SafeDrawResult | null => {
  const currentPotTeams = state.pots[state.currentPot];
  if (currentPotTeams.length === 0) {
    return null;
  }

  const teamOrder = shuffle(currentPotTeams);

  for (const team of teamOrder) {
    const validGroups = getValidGroupsForTeam(state, team);
    for (const groupId of validGroups) {
      const tentative = placeTeam(state, team, groupId);
      const remaining = remainingTeams(tentative);
      const allHaveRoom = remaining.every((t) => getValidGroupsForTeam(tentative, t).length > 0);
      const icOk = icTeamsHaveOptions(tentative);
      const matchingOk = allPotsMatchingFeasible(tentative);
      const fullUefaOk = completedGroupsHaveUefa(tentative);
      if (allHaveRoom && icOk && matchingOk && fullUefaOk) {
        // Lightweight global lookahead: prove the rest can be solved within a small budget.
        const { state: proof } = solveAllPotsWithBudget(
          tentative,
          1200,
          nowMs() + 120
        );
        if (!proof) {
          continue;
        }
        return { state: tentative, adjusted: false, team, group: groupId };
      }
    }
  }

  // Last resort: solve the current pot entirely. If solvable, accept that pot solution as-is.
  const solvedPot = solveCurrentPot(state);
  if (solvedPot) {
    // Sanity: ensure global feasibility still holds.
    const remaining = remainingTeams(solvedPot);
    const allHaveRoom = remaining.every((t) => getValidGroupsForTeam(solvedPot, t).length > 0);
    const icOk = icTeamsHaveOptions(solvedPot);
    const matchingOk = allPotsMatchingFeasible(solvedPot);
    const fullUefaOk = completedGroupsHaveUefa(solvedPot);
    if (allHaveRoom && icOk && matchingOk && fullUefaOk) {
      const newlyPlaced = solvedPot.drawOrder.find(
        (t) => !state.drawOrder.some((d) => d.id === t.id)
      );
      const placedGroup = newlyPlaced
        ? GROUP_IDS.find((gid) =>
            solvedPot.groups[gid].slots.some((s) => s.team?.id === newlyPlaced.id)
          )
        : undefined;
      return {
        state: solvedPot,
        adjusted: true,
        team: newlyPlaced ?? currentPotTeams[0],
        group: placedGroup ?? GROUP_IDS[0],
      };
    }
  }

  return null;
};

/**
 * Backtracking solver for the current pot: tries to place all remaining teams in this pot
 * into valid groups. Returns a full updated state or null if impossible.
 */
const solveCurrentPot = (state: DrawState): DrawState | null => {
  const remaining = state.pots[state.currentPot];
  if (remaining.length === 0) {
    return state;
  }

  // Choose the team with the fewest valid options to reduce branching.
  const candidates = remaining
    .map((t) => ({ team: t, groups: getValidGroupsForTeam(state, t) }))
    .sort((a, b) => a.groups.length - b.groups.length);

  if (candidates[0].groups.length === 0) {
    return null;
  }

  for (const { team, groups } of candidates) {
    const shuffledGroups = shuffle(groups);
    for (const groupId of shuffledGroups) {
      const nextState = placeTeam(state, team, groupId);
      const solved = solveCurrentPot(nextState);
      if (solved) {
        return solved;
      }
    }
    // If this team cannot be placed anywhere leading to a solution, prune.
    break;
  }

  return null;
};

/**
 * Re-solves the current pot including teams from this pot already placed in groups.
 * Lower pots remain fixed.
 */
const reSolveCurrentPotAssignments = (state: DrawState): DrawState | null => {
  const pot = state.currentPot;
  const recovered: Team[] = [...state.pots[pot]];
  const clearedGroups: Record<GroupId, Group> = { ...state.groups };

  // Pull back teams of this pot from groups.
  for (const gid of Object.keys(clearedGroups) as GroupId[]) {
    const g = clearedGroups[gid];
    const newSlots = g.slots.map((slot) => {
      if (slot.team?.pot === pot) {
        recovered.push(slot.team);
        return { ...slot, team: undefined };
      }
      return slot;
    });
    clearedGroups[gid] = { ...g, slots: newSlots };
  }

  const newPots: Record<PotNumber, Team[]> = {
    ...state.pots,
    [pot]: recovered,
  };

  const resetState: DrawState = {
    ...state,
    groups: clearedGroups,
    pots: newPots,
    drawOrder: state.drawOrder.filter((t) => t.pot !== pot),
  };

  return solveCurrentPot(resetState);
};

/**
 * Reset the current pot assignments and attempt to solve that pot from scratch,
 * keeping other pots fixed.
 */
const reSolveCurrentPot = (state: DrawState): DrawState | null => {
  return reSolveFromPot(state, state.currentPot);
};

/**
 * Clear placements for the given pot and all higher pots, put those teams back into pots,
 * and attempt to solve from that pot upward while keeping lower pots fixed.
 */
const reSolveFromPot = (state: DrawState, startPot: PotNumber): DrawState | null => {
  const reassignedTeams: Team[] = [];
  const clearedGroups: Record<GroupId, Group> = { ...state.groups };

  // Remove teams from current pot already placed in groups and put them back.
  for (const id of Object.keys(clearedGroups) as GroupId[]) {
    const g = clearedGroups[id];
    const newSlots = g.slots.map((slot) => {
      if (slot.team && slot.team.pot >= startPot) {
        reassignedTeams.push(slot.team);
        return { ...slot, team: undefined };
      }
      return slot;
    });
    clearedGroups[id] = { ...g, slots: newSlots };
  }

  const newPots: Record<PotNumber, Team[]> = {
    ...state.pots,
    [1]: [...state.pots[1]],
    [2]: [...state.pots[2]],
    [3]: [...state.pots[3]],
    [4]: [...state.pots[4]],
  };
  reassignedTeams.forEach((t) => {
    newPots[t.pot].push(t);
  });

  const resetState: DrawState = {
    ...state,
    groups: clearedGroups,
    pots: newPots,
    currentPot: startPot,
    drawOrder: state.drawOrder.filter((t) => t.pot < startPot),
  };

  return solveAllPots(resetState);
};

/**
 * Full backtracking across all remaining pots from the current state.
 */
const solveAllPots = (state: DrawState): DrawState | null => {
  if (allPotsEmpty(state.pots)) {
    return state;
  }

  const currentPotTeams = state.pots[state.currentPot];
  if (currentPotTeams.length === 0) {
    // Advance pot if empty and continue.
    const advanced: DrawState = { ...state, currentPot: nextPot(state.currentPot) };
    return solveAllPots(advanced);
  }

  // Pick team with fewest options.
  const candidates = currentPotTeams
    .map((t) => ({ team: t, groups: getValidGroupsForTeam(state, t) }))
    .sort((a, b) => a.groups.length - b.groups.length);

  if (candidates[0].groups.length === 0) {
    return null;
  }

  for (const { team, groups } of candidates) {
    for (const groupId of shuffle(groups)) {
      const nextState = placeTeam(state, team, groupId);
      const solved = solveAllPots(nextState);
      if (solved) return solved;
    }
    break;
  }

  return null;
};


/**
 * Validate the UEFA lower/upper bound and ranking-based pathway split.
 */
const validateGlobalConstraints = (
  groups: Record<GroupId, Group>,
  teams: Team[]
): boolean => {
  const rankingSet = new Set<number>();
  teams.forEach((team) => {
    if (team.ranking && team.ranking >= 1 && team.ranking <= 4) {
      rankingSet.add(team.ranking);
    }
  });
  if (rankingSet.size < 4) {
    return false;
  }

  // UEFA per-group bounds (known confeds only).
  for (const groupId of GROUP_IDS) {
    const group = groups[groupId];
    const confedCounts = getConfedCounts(group);
    const uefaCount = confedCounts.UEFA;
    if (uefaCount < 1 || uefaCount > 2) {
      return false;
    }
  }

  const rankingLocations: Record<number, GroupId | undefined> = {};
  for (const groupId of GROUP_IDS) {
    const group = groups[groupId];
    group.slots.forEach((slot) => {
      const ranking = slot.team?.ranking;
      if (ranking && ranking >= 1 && ranking <= 4) {
        rankingLocations[ranking] = groupId;
      }
    });
  }

  const ensureDifferentPath = (r1: number, r2: number): boolean => {
    const g1 = rankingLocations[r1];
    const g2 = rankingLocations[r2];
    if (!g1 || !g2) {
      return false;
    }
    return GROUP_PATHWAY[g1] !== GROUP_PATHWAY[g2];
  };

  const ensureDifferentCluster = (r1: number, r2: number): boolean => {
    const g1 = rankingLocations[r1];
    const g2 = rankingLocations[r2];
    if (!g1 || !g2) return false;
    const c1 = SEMI_CLUSTER[g1];
    const c2 = SEMI_CLUSTER[g2];
    if (!c1 || !c2) return true;
    return c1 !== c2;
  };

  const clusterCounts: Record<string, number> = {};
  Object.values(SEMI_CLUSTER).forEach((c) => {
    if (c) clusterCounts[c] = 0;
  });
  for (const gid of GROUP_IDS) {
    const cluster = SEMI_CLUSTER[gid];
    if (!cluster) continue;
    groupLoop: for (const slot of groups[gid].slots) {
      if (slot.team && isTop4(slot.team)) {
        clusterCounts[cluster] = (clusterCounts[cluster] ?? 0) + 1;
        break groupLoop;
      }
    }
  }
  const allClustersHaveOne =
    Object.keys(clusterCounts).length > 0 &&
    Object.values(clusterCounts).every((c) => c === 1);

  return (
    ensureDifferentPath(1, 2) &&
    ensureDifferentPath(3, 4) &&
    ensureDifferentCluster(1, 2) &&
    ensureDifferentCluster(1, 3) &&
    ensureDifferentCluster(1, 4) &&
    ensureDifferentCluster(2, 3) &&
    ensureDifferentCluster(2, 4) &&
    ensureDifferentCluster(3, 4) &&
    allClustersHaveOne
  );
};

const simulateFullDraw = (teams: Team[], maxRetries = 1000): DrawState => {
  if (teams.length !== 48) {
    throw new Error("Expected exactly 48 teams for the draw.");
  }

  for (let attempt = 0; attempt < maxRetries; attempt += 1) {
    let state = initDrawState(teams);
    let deadEnd = false;

    while (!allPotsEmpty(state.pots)) {
      const result = drawNextTeamSafe(state);
      if (!result) {
        // Try solving current pot, then bounded full backtracking.
        const deadline = nowMs() + 200; // 200ms budget per failure recovery
        const solvedPot =
          solveCurrentPot(state) ||
          solveAllPotsWithBudget(state, 2000, deadline).state;
        if (solvedPot) {
          state = solvedPot;
          continue;
        }
        deadEnd = true;
        break;
      }
      state = result.state;
    }

    if (deadEnd) {
      continue;
    }

    if (validateGlobalConstraints(state.groups, teams)) {
      return state;
    }
  }

  throw new Error("Failed to find a valid draw within maxRetries.");
};

export {
  Confederation,
  Team,
  Group,
  GroupId,
  GroupSlot,
  DrawState,
  Pathway,
  GROUP_PATHWAY,
  initDrawState,
  canPlaceTeamInGroup,
  getValidGroupsForTeam,
  placeTeam,
  drawNextTeamRandom,
  drawNextTeamSafe,
  solveCurrentPot,
  reSolveCurrentPotAssignments,
  solveAllPots,
  reSolveCurrentPot,
  reSolveFromPot,
  validateGlobalConstraints,
  simulateFullDraw,
  SafeDrawResult,
};
