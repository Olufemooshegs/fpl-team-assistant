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
  name: string
  short_name: string
}

export interface FplElement {
  id: number
  first_name: string
  second_name: string
  web_name: string
  team: number
  element_type: number
  now_cost: number
  total_points: number
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
