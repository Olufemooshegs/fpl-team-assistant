import { useState } from "react"
import type { BootstrapResponse, TeamPicksResponse, ApiError } from "./types"

type LoadState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; gameweek: number; teamData: TeamPicksResponse }
  | { status: "error"; message: string }

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  const json = await res.json()
  if (!res.ok) {
    throw new Error((json as ApiError).error ?? `Request failed: ${res.status}`)
  }
  return json as T
}

function Header() {
  return (
    <header className="bg-fpl-purple border-b border-fpl-purple-light">
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-fpl-green flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8l3.5 3.5L13 4.5" stroke="#37003c" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span
            className="text-2xl text-white tracking-wide"
            style={{ fontFamily: "var(--font-rajdhani)", fontWeight: 700 }}
          >
            FPL TEAM ASSISTANT
          </span>
        </div>
        <div className="ml-auto">
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-fpl-green/10 text-fpl-green border border-fpl-green/20">
            BETA
          </span>
        </div>
      </div>
    </header>
  )
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-fpl-purple/20 via-transparent to-fpl-green/5 pointer-events-none" />
      <div className="max-w-5xl mx-auto px-6 py-20">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 mb-6">
            <div className="h-px w-8 bg-fpl-green" />
            <span className="text-fpl-green text-xs font-semibold tracking-widest uppercase">
              Data-driven FPL
            </span>
          </div>
          <h1
            className="text-5xl md:text-6xl text-white leading-tight mb-6"
            style={{ fontFamily: "var(--font-rajdhani)", fontWeight: 700 }}
          >
            IMPORT YOUR TEAM.
            <br />
            <span className="text-fpl-green">HIT 80+ POINTS</span>
            <br />
            NEXT GAMEWEEK.
          </h1>
          <p className="text-text-secondary text-lg leading-relaxed mb-8 max-w-xl">
            Enter your FPL Team ID to pull your current squad, then get
            data-driven transfer suggestions based on fixtures, form, and
            expected points.
          </p>
          <div className="flex flex-wrap gap-6 text-sm text-text-muted">
            {["Live FPL data", "Fixture difficulty", "xP projections"].map((f) => (
              <span key={f} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-fpl-green" />
                {f}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function TeamLoader({ onLoad }: { onLoad: (state: LoadState) => void }) {
  const [teamId, setTeamId] = useState("")
  const [localState, setLocalState] = useState<LoadState>({ status: "idle" })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const id = teamId.trim()
    if (!id || !/^\d+$/.test(id)) {
      setLocalState({ status: "error", message: "Please enter a valid numeric FPL Team ID." })
      return
    }

    setLocalState({ status: "loading" })
    onLoad({ status: "loading" })

    try {
      const bootstrap = await fetchJson<BootstrapResponse>("/api/fpl/bootstrap")
      const currentEvent = bootstrap.events.find((e) => e.is_current)
      const gameweek = currentEvent?.id ?? bootstrap.events.findIndex((e) => !e.finished) + 1

      const teamData = await fetchJson<TeamPicksResponse>(
        `/api/fpl/team/${id}/${gameweek}`,
      )

      console.log("[FPL Team Assistant] Raw team data:", teamData)

      const next: LoadState = { status: "success", gameweek, teamData }
      setLocalState(next)
      onLoad(next)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load team data."
      const errState: LoadState = { status: "error", message }
      setLocalState(errState)
      onLoad(errState)
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-6 pb-16">
      <div className="bg-navy-card border border-navy-border rounded-2xl p-8 max-w-xl">
        <h2
          className="text-xl text-white mb-1"
          style={{ fontFamily: "var(--font-rajdhani)", fontWeight: 700 }}
        >
          LOAD YOUR SQUAD
        </h2>
        <p className="text-text-muted text-sm mb-6">
          Find your Team ID at{" "}
          <span className="text-fpl-green">Points → View gameweek history</span>{" "}
          in the FPL app URL.
        </p>

        <form onSubmit={handleSubmit} className="flex gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              inputMode="numeric"
              pattern="\d*"
              value={teamId}
              onChange={(e) => {
                setTeamId(e.target.value)
                if (localState.status === "error") setLocalState({ status: "idle" })
              }}
              placeholder="e.g. 1234567"
              className="w-full bg-navy-elevated border border-navy-border rounded-xl px-4 py-3 text-white placeholder-text-muted focus:outline-none focus:border-fpl-green/60 focus:ring-1 focus:ring-fpl-green/30 transition-all text-sm"
              disabled={localState.status === "loading"}
            />
          </div>
          <button
            type="submit"
            disabled={localState.status === "loading" || !teamId.trim()}
            className="px-5 py-3 bg-fpl-green text-fpl-purple rounded-xl font-semibold text-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:bg-fpl-green-dim active:scale-95 transition-all whitespace-nowrap"
          >
            {localState.status === "loading" ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Loading&hellip;
              </span>
            ) : (
              "Load My Team"
            )}
          </button>
        </form>

        {localState.status === "error" && (
          <div className="mt-4 flex items-start gap-3 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20">
            <svg className="w-4 h-4 text-red-400 mt-0.5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-.75-9.25a.75.75 0 011.5 0v3.5a.75.75 0 01-1.5 0v-3.5zm.75 6a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
            </svg>
            <p className="text-red-300 text-sm">{localState.message}</p>
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="bg-navy-card border border-navy-border rounded-xl p-5">
      <span className="text-text-muted text-xs uppercase tracking-wider">{label}</span>
      <div
        className={`text-3xl mt-1 ${accent ? "text-fpl-green" : "text-white"}`}
        style={{ fontFamily: "var(--font-rajdhani)", fontWeight: 700 }}
      >
        {value}
      </div>
    </div>
  )
}

function GameweekResult({ state }: { state: Extract<LoadState, { status: "success" }> }) {
  const { gameweek, teamData } = state
  const { entry_history, picks } = teamData
  const captainPick = picks.find((p) => p.is_captain)
  const vicePick = picks.find((p) => p.is_vice_captain)

  return (
    <div className="max-w-5xl mx-auto px-6 pb-20">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-px flex-1 bg-navy-border" />
        <div
          className="px-4 py-1.5 rounded-full bg-fpl-green text-fpl-purple text-sm"
          style={{ fontFamily: "var(--font-rajdhani)", fontWeight: 700 }}
        >
          GW{gameweek}
        </div>
        <div className="h-px flex-1 bg-navy-border" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard label="Total Points" value={entry_history.total_points.toLocaleString()} />
        <StatCard label="GW Points" value={String(entry_history.points)} />
        <StatCard label="Overall Rank" value={`#${entry_history.overall_rank.toLocaleString()}`} accent />
      </div>

      <div className="bg-navy-card border border-navy-border rounded-2xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-2 h-6 rounded-full bg-fpl-green" />
          <h3
            className="text-lg text-white"
            style={{ fontFamily: "var(--font-rajdhani)", fontWeight: 700 }}
          >
            TEAM LOADED SUCCESSFULLY
          </h3>
          <span className="ml-auto flex items-center gap-1.5 text-fpl-green text-sm font-medium">
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
            </svg>
            Connected
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 text-sm">
          <div>
            <span className="text-text-muted block text-xs mb-0.5">Squad size</span>
            <span className="text-white font-medium">{picks.length} players</span>
          </div>
          <div>
            <span className="text-text-muted block text-xs mb-0.5">Active chip</span>
            <span className="text-white font-medium">{teamData.active_chip ?? "None"}</span>
          </div>
          {captainPick && (
            <div>
              <span className="text-text-muted block text-xs mb-0.5">Captain (element)</span>
              <span className="text-white font-medium">#{captainPick.element}</span>
            </div>
          )}
          {vicePick && (
            <div>
              <span className="text-text-muted block text-xs mb-0.5">Vice-captain</span>
              <span className="text-white font-medium">#{vicePick.element}</span>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-navy-border bg-navy-elevated p-5">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-4 h-4 text-fpl-green" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-.5a1.5 1.5 0 000 3h.5a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-.5a1.5 1.5 0 00-3 0v.5a1 1 0 01-1 1H6a1 1 0 01-1-1v-3a1 1 0 00-1-1h-.5a1.5 1.5 0 010-3H4a1 1 0 001-1V6a1 1 0 011-1h3a1 1 0 001-1v-.5z" />
            </svg>
            <span className="text-sm font-medium text-text-secondary">Squad view coming next</span>
          </div>
          <p className="text-text-muted text-xs leading-relaxed">
            Player cards, formation view, and transfer recommendations will appear here. Raw picks data has been logged to the browser console for verification.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [loadState, setLoadState] = useState<LoadState>({ status: "idle" })

  return (
    <div className="min-h-full flex flex-col bg-navy">
      <Header />
      <main className="flex-1">
        <Hero />
        <TeamLoader onLoad={setLoadState} />
        {loadState.status === "success" && <GameweekResult state={loadState} />}
      </main>
      <footer className="border-t border-navy-border py-5">
        <p className="text-center text-text-muted text-xs">
          FPL Team Assistant — not affiliated with Fantasy Premier League or the Premier League.
        </p>
      </footer>
    </div>
  )
}
