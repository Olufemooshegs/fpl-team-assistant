import type { EnrichedPick, FplElement, FplTeam } from "../types"

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SingleSwap {
  outPick: EnrichedPick
  inPlayer: FplElement
  inTeam: FplTeam
  outPts: number
  inPts: number
  pointDelta: number
  budgetDelta: number // positive = swap costs more of the bank
}

export interface ComboSwap {
  swap1: SingleSwap
  swap2: SingleSwap
  totalPointDelta: number
  totalBudgetDelta: number
}

export interface TransferAnalysis {
  singles: SingleSwap[]
  bestCombo: ComboSwap | null
}

// ── Core search ───────────────────────────────────────────────────────────────

function findBestSingles(
  squad: EnrichedPick[],
  allPlayers: FplElement[],
  teamsById: Map<number, FplTeam>,
  bank: number,
  excludeIds: Set<number>,
  limit = 10,
): SingleSwap[] {
  const results: SingleSwap[] = []

  for (const ep of squad) {
    const outPts = ep.prediction.predictedPoints
    const outCost = ep.element.now_cost
    const maxInCost = outCost + bank

    for (const candidate of allPlayers) {
      if (
        candidate.element_type !== ep.element.element_type ||
        excludeIds.has(candidate.id) ||
        candidate.now_cost > maxInCost ||
        candidate.ep_next === null ||
        candidate.status === "u"
      ) continue

      const inPts = parseFloat(candidate.ep_next)
      const delta = inPts - outPts
      if (delta <= 0) continue

      const inTeam = teamsById.get(candidate.team)
      if (!inTeam) continue

      results.push({
        outPick: ep,
        inPlayer: candidate,
        inTeam,
        outPts,
        inPts,
        pointDelta: delta,
        budgetDelta: candidate.now_cost - outCost,
      })
    }
  }

  return results.sort((a, b) => b.pointDelta - a.pointDelta).slice(0, limit)
}

// ── Main export ───────────────────────────────────────────────────────────────

export function analyseTransfers(
  allSquad: EnrichedPick[],
  allPlayers: FplElement[],
  allTeams: FplTeam[],
  bank: number,
): TransferAnalysis {
  const teamsById = new Map(allTeams.map(t => [t.id, t]))
  const squadIds = new Set(allSquad.map(ep => ep.element.id))

  const singles = findBestSingles(allSquad, allPlayers, teamsById, bank, squadIds)

  if (singles.length === 0) return { singles: [], bestCombo: null }

  // Greedy 2-swap combo: use the best single swap, then find the best second swap
  // from the remaining squad with the remaining budget
  const best1 = singles[0]
  const remainingBank = bank - best1.budgetDelta

  // After swap1, the out-player is gone and in-player is now in squad
  const squadAfterSwap1 = allSquad.filter(ep => ep.element.id !== best1.outPick.element.id)
  const idsAfterSwap1 = new Set([
    ...squadAfterSwap1.map(ep => ep.element.id),
    best1.inPlayer.id,
  ])

  let bestCombo: ComboSwap | null = null

  if (remainingBank >= 0) {
    const singles2 = findBestSingles(squadAfterSwap1, allPlayers, teamsById, remainingBank, idsAfterSwap1, 5)
    if (singles2.length > 0) {
      bestCombo = {
        swap1: best1,
        swap2: singles2[0],
        totalPointDelta: best1.pointDelta + singles2[0].pointDelta,
        totalBudgetDelta: best1.budgetDelta + singles2[0].budgetDelta,
      }
    }
  }

  return { singles, bestCombo }
}

// ── Hit cost helpers ──────────────────────────────────────────────────────────

export function hitCostFor(numTransfers: number, freeTransfers: number): number {
  return Math.max(0, numTransfers - freeTransfers) * 4
}

export function netDelta(rawDelta: number, numTransfers: number, freeTransfers: number): number {
  return rawDelta - hitCostFor(numTransfers, freeTransfers)
}
