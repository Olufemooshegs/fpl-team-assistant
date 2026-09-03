import type {
  FplElement,
  FplFixture,
  FplTeam,
  PlayerHistoryEntry,
  PlayerSummaryResponse,
  FixtureInfo,
  PlayerPrediction,
} from "../types"

// element_type 2=DEF, 3=MID receive the defensive contribution bonus
const DEFENSIVE_TYPES = new Set([2, 3])

const DIFFICULTY_MULT: Record<number, number> = {
  1: 1.15,
  2: 1.15,
  3: 1.0,
  4: 0.85,
  5: 0.7,
}

function diffMult(d: number): number {
  return DIFFICULTY_MULT[Math.max(1, Math.min(5, d))] ?? 1.0
}

function weightedAvgPts(history: PlayerHistoryEntry[]): number {
  const last5 = history.slice(-5)
  const reversed = [...last5].reverse() // reversed[0] = most recent GW
  // weights: most recent = 5, oldest of the 5 = 1
  const weights = [5, 4, 3, 2, 1].slice(0, reversed.length)
  const totalWeight = weights.reduce((s, w) => s + w, 0)
  return reversed.reduce((sum, h, i) => sum + h.total_points * weights[i], 0) / totalWeight
}

/** Returns the earliest upcoming event ID across all fixtures. */
export function getNextEventId(fixtures: FplFixture[], currentGw: number): number {
  const ids = fixtures
    .filter(f => !f.finished && f.event !== null && f.event >= currentGw)
    .map(f => f.event as number)
  return ids.length > 0 ? Math.min(...ids) : currentGw + 1
}

/** Resolves the next fixture for a team, with opponent short name filled in. */
export function resolveFixtureInfo(
  fixtures: FplFixture[],
  teamId: number,
  nextEventId: number,
  teamsMap: Map<number, FplTeam>,
): FixtureInfo | null {
  const match = fixtures.find(
    f => f.event === nextEventId && (f.team_h === teamId || f.team_a === teamId),
  )
  if (!match) return null

  const isHome = match.team_h === teamId
  const opponentId = isHome ? match.team_a : match.team_h
  const difficulty = isHome ? match.team_h_difficulty : match.team_a_difficulty

  return {
    opponentTeamId: opponentId,
    opponentShortName: teamsMap.get(opponentId)?.short_name ?? "???",
    isHome,
    difficulty,
    event: nextEventId,
  }
}

export interface PredictionParams {
  element: FplElement
  summary: PlayerSummaryResponse
  fixtures: FplFixture[]
  nextEventId: number
}

/**
 * 4-step prediction engine:
 *   1. Weighted recent form (or season PPG fallback)
 *   2. Fixture difficulty + home advantage
 *   3. Minutes reliability discount
 *   4. Defensive contribution bonus (DEF/MID with 3+ CS in last 5 GWs)
 */
export function calculatePrediction(params: PredictionParams): PlayerPrediction {
  const { element, summary, fixtures, nextEventId } = params
  const history = summary.history

  // Step 1 – base score
  const baseRaw =
    history.length >= 5
      ? weightedAvgPts(history)
      : parseFloat(element.points_per_game) || 0
  const baseScore = Math.round(baseRaw * 10) / 10
  let score = baseRaw

  // Step 2 – fixture difficulty & home boost
  const nextFixture = fixtures.find(
    f => f.event === nextEventId && (f.team_h === element.team || f.team_a === element.team),
  )
  if (nextFixture) {
    const isHome = nextFixture.team_h === element.team
    const difficulty = isHome ? nextFixture.team_h_difficulty : nextFixture.team_a_difficulty
    score *= diffMult(difficulty)
    if (isHome) score *= 1.05
  }

  // Step 3 – minutes reliability
  const chanceOfPlaying = element.chance_of_playing_next_round
  if (chanceOfPlaying !== null && chanceOfPlaying < 75) {
    score *= chanceOfPlaying / 100
  }
  if (history.length >= 5) {
    const avgMins = history.slice(-5).reduce((s, h) => s + h.minutes, 0) / 5
    if (avgMins < 60) score *= 0.8
  }

  // Step 4 – defensive contribution bonus
  // The FPL API exposes `clean_sheets` (1 when player kept a CS, 0 otherwise)
  // as the closest analogue to "defensive contribution" in the history array.
  if (DEFENSIVE_TYPES.has(element.element_type) && history.length >= 5) {
    const defContributions = history.slice(-5).filter(h => h.clean_sheets >= 1).length
    if (defContributions >= 3) score += 1.5
  }

  const epNextRaw = element.ep_next !== null ? parseFloat(element.ep_next) : null
  const epNext =
    epNextRaw !== null && !isNaN(epNextRaw) ? Math.round(epNextRaw * 10) / 10 : null

  return {
    elementId: element.id,
    baseScore,
    predictedPoints: Math.round(score * 10) / 10,
    epNext,
  }
}
