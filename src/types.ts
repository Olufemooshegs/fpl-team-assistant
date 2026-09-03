export interface FplEvent {
  id: number
  name: string
  deadline_time: string
  average_entry_score: number
  finished: boolean
  is_current: boolean
  is_next: boolean
}

export interface FplTeam {
  id: number
  code: number
  name: string
  short_name: string
}

export interface FplElement {
  id: number
  first_name: string
  second_name: string
  web_name: string
  team: number
  element_type: number // 1=GK 2=DEF 3=MID 4=FWD
  now_cost: number
  total_points: number
  points_per_game: string
  ep_next: string | null
  ep_this: string | null
  chance_of_playing_next_round: number | null
  selected_by_percent: string
  form: string
  status: string
}

export interface BootstrapResponse {
  events: FplEvent[]
  teams: FplTeam[]
  elements: FplElement[]
}

export interface TeamPick {
  element: number
  position: number
  multiplier: number
  is_captain: boolean
  is_vice_captain: boolean
}

export interface TeamPicksResponse {
  active_chip: string | null
  automatic_subs: unknown[]
  entry_history: {
    event: number
    points: number
    total_points: number
    rank: number
    overall_rank: number
    value: number
    event_transfers: number
    event_transfers_cost: number
    bank: number
  }
  picks: TeamPick[]
}

export interface ApiError {
  error: string
}

// ── Fixtures ──────────────────────────────────────────────────────────────────

export interface FplFixture {
  id: number
  team_h: number
  team_a: number
  team_h_difficulty: number
  team_a_difficulty: number
  event: number | null
  finished: boolean
  started: boolean | null
  kickoff_time: string | null
}

// ── Player summary ────────────────────────────────────────────────────────────

export interface PlayerHistoryEntry {
  element: number
  fixture: number
  opponent_team: number
  total_points: number
  was_home: boolean
  kickoff_time: string
  round: number
  minutes: number
  goals_scored: number
  assists: number
  clean_sheets: number
  goals_conceded: number
  own_goals: number
  penalties_saved: number
  yellow_cards: number
  red_cards: number
  saves: number
  bonus: number
  bps: number
  // Defensive action stats (confirmed present in FPL API as of 2025-26)
  defensive_contribution: number
  clearances_blocks_interceptions: number
  recoveries: number
  tackles: number
}

export interface PlayerSummaryResponse {
  history: PlayerHistoryEntry[]
  fixtures: unknown[]
  history_past: unknown[]
}

// ── Prediction engine ─────────────────────────────────────────────────────────

export interface FixtureInfo {
  opponentTeamId: number
  opponentCode: number
  opponentShortName: string
  isHome: boolean
  difficulty: number
  event: number
}

export interface PlayerPrediction {
  elementId: number
  baseScore: number
  predictedPoints: number
  epNext: number | null
}

// ── Squad state ───────────────────────────────────────────────────────────────

export interface EnrichedPick {
  pick: TeamPick
  element: FplElement
  team: FplTeam
  prediction: PlayerPrediction
  nextFixture: FixtureInfo | null
}

export interface SquadData {
  gameweek: number
  startingXI: EnrichedPick[]
  bench: EnrichedPick[]
  predictedScore: number
}
