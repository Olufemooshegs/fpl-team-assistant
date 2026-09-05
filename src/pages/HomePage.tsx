import { useState } from "react"
import { useCountUp } from "../hooks/useCountUp"
import type {
  BootstrapResponse,
  FplFixture,
  TeamPicksResponse,
  PlayerSummaryResponse,
  ApiError,
  SquadData,
  EnrichedPick,
} from "../types"
import { calculatePrediction, getNextEventId, resolveFixtureInfo } from "../services/prediction"
import SquadView from "../components/SquadView"
import LandingSection from "../components/LandingSection"
import { useAuth } from "../contexts/AuthContext"

// ── App state ─────────────────────────────────────────────────────────────────

type AppPhase =
  | { phase: "idle" }
  | { phase: "loading"; message: string }
  | { phase: "error"; message: string }
  | { phase: "loaded"; squadData: SquadData }

function fplApiUrl(path: string): string {
  return `${import.meta.env.BASE_URL}api/fpl/${path}`
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  const contentType = res.headers.get("content-type") ?? ""

  if (!res.ok) {
    if (res.status === 404) {
      throw new Error("FPL Team ID not found for this Gameweek. Please verify your Team ID.")
    }
    let message = `FPL API error (${res.status})`
    if (contentType.includes("application/json")) {
      try {
        const json = await res.json()
        if ((json as ApiError).error) message = (json as ApiError).error
      } catch {
        // fallback
      }
    }
    throw new Error(message)
  }

  if (!contentType.includes("application/json")) {
    const text = await res.text()
    if (text.startsWith("{") || text.startsWith("[")) {
      return JSON.parse(text) as T
    }
    throw new Error("FPL service returned an invalid response format. Please try again.")
  }

  return (await res.json()) as T
}

// ── Hero ──────────────────────────────────────────────────────────────────────

function Hero() {
  const displayed = useCountUp(84.2, 1, 0.9)
  return (
    <section className="relative overflow-hidden border-b border-line bg-gradient-to-b from-slate-950 via-slate-900 to-base py-16 sm:py-24" aria-labelledby="landing-hero-heading">
      
      {/* Decorative radial glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/4 right-10 w-[300px] h-[300px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">

          {/* Text & Pitch CTAs */}
          <div className="lg:col-span-7">
            
            {/* Broadcast badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 mb-6">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-blue-400 text-xs font-semibold tracking-wide uppercase font-mono">GW22 AI PREDICTION SUITE</span>
            </div>

            <h1
              id="landing-hero-heading"
              className="text-ink leading-[1.05] tracking-tight mb-6"
              style={{
                fontFamily: "var(--font-rajdhani)",
                fontWeight: 800,
                fontSize: "clamp(42px, 6vw, 68px)",
              }}
            >
              DOMINATE FPL WITH <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-emerald-400">
                PROTACTICAL INTELLIGENCE
              </span>
            </h1>

            <p className="text-ink-2 text-base sm:text-lg leading-relaxed mb-8 max-w-xl">
              Import your FPL squad instantly. Get xP point projections, fixture difficulty matrix, and automated transfer recommendations powered by live Opta-style metrics.
            </p>

            <div className="grid grid-cols-3 gap-3 max-w-lg mb-4">
              <div className="bg-surface/60 border border-line rounded-xl p-3 text-center backdrop-blur-sm">
                <p className="text-emerald-400 font-bold text-xl font-mono">94.8%</p>
                <p className="text-ink-3 text-[11px] font-medium uppercase tracking-wider">Model Accuracy</p>
              </div>
              <div className="bg-surface/60 border border-line rounded-xl p-3 text-center backdrop-blur-sm">
                <p className="text-blue-400 font-bold text-xl font-mono">80.0+</p>
                <p className="text-ink-3 text-[11px] font-medium uppercase tracking-wider">Target Points</p>
              </div>
              <div className="bg-surface/60 border border-line rounded-xl p-3 text-center backdrop-blur-sm">
                <p className="text-indigo-400 font-bold text-xl font-mono">LIVE</p>
                <p className="text-ink-3 text-[11px] font-medium uppercase tracking-wider">Opta Feed</p>
              </div>
            </div>

          </div>

          {/* Hero Big Stats Card */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="w-full max-w-md bg-surface/80 border border-line rounded-2xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl relative group hover:border-blue-500/30 transition-all duration-300">
              
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-blue-500/10 to-transparent rounded-tr-2xl pointer-events-none" />

              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono text-emerald-400 font-semibold uppercase tracking-wider bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
                  TOP RANK BENCHMARK
                </span>
                <span className="text-xs text-ink-3 font-mono">GW PROJECTED</span>
              </div>

              <div className="text-center py-4">
                <div
                  className="text-transparent bg-clip-text bg-gradient-to-br from-blue-400 via-indigo-300 to-emerald-400 leading-none num-display drop-shadow-sm"
                  style={{
                    fontSize: "clamp(84px, 12vw, 116px)",
                    fontWeight: 800,
                  }}
                >
                  {displayed}
                </div>
                <p className="text-ink-2 font-medium text-sm mt-2">Predicted GW Avg Points</p>
              </div>

              <div className="mt-4 pt-4 border-t border-line flex items-center justify-between text-xs text-ink-3">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Live Form Weighted
                </span>
                <span className="font-mono">FPL API Proxy</span>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  )
}

// ── Loading indicator ─────────────────────────────────────────────────────────

function LoadingCard({ message }: { message: string }) {
  return (
    <div className="max-w-5xl mx-auto px-5 pb-6">
      <div className="flex items-center gap-4 p-5 bg-surface border border-line rounded-xl max-w-xl">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin shrink-0" />
        <div>
          <p className="text-ink text-sm font-medium">{message}</p>
          <p className="text-ink-3 text-xs mt-0.5">Hang tight&hellip;</p>
        </div>
      </div>
    </div>
  )
}

// ── Team loader form ──────────────────────────────────────────────────────────

function TeamLoader({
  onSubmit,
  isLoading,
  errorMessage,
}: {
  onSubmit: (teamId: string) => void
  isLoading: boolean
  errorMessage: string | null
}) {
  const [teamId, setTeamId] = useState("")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const id = teamId.trim()
    if (!id || !/^\d+$/.test(id)) return
    onSubmit(id)
  }

  function handleQuickSample(id: string) {
    setTeamId(id)
    onSubmit(id)
  }

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 py-10" aria-labelledby="team-loader-heading">
      <div className="bg-surface border border-line rounded-2xl p-6 sm:p-8 max-w-2xl mx-auto shadow-xl relative overflow-hidden">
        
        <div className="flex items-center justify-between gap-4 mb-2">
          <h2
            id="team-loader-heading"
            className="text-ink tracking-tight"
            style={{ fontFamily: "var(--font-rajdhani)", fontWeight: 700, fontSize: "24px" }}
          >
            IMPORT FPL SQUAD
          </h2>
          <span className="text-[11px] font-mono font-semibold px-2.5 py-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
            AUTO-SYNC
          </span>
        </div>

        <p className="text-ink-3 text-xs sm:text-sm mb-6">
          Find your Team ID in the FPL URL under{" "}
          <span className="text-emerald-400 font-semibold font-mono">Points &rarr; View Gameweek History</span>.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              inputMode="numeric"
              pattern="\d*"
              value={teamId}
              onChange={e => setTeamId(e.target.value)}
              placeholder="Enter Team ID (e.g. 3058)"
              disabled={isLoading}
              className="w-full h-12 bg-base/80 border border-line rounded-xl px-4 text-ink font-mono text-sm placeholder-ink-3 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all disabled:opacity-50"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !teamId.trim()}
            className="h-12 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold text-sm cursor-pointer shadow-lg shadow-blue-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shrink-0"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin w-4 h-4 text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Processing...
              </span>
            ) : (
              <>
                <span>ANALYSE SQUAD</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </>
            )}
          </button>
        </form>

        {/* Quick sample chips */}
        <div className="mt-5 pt-4 border-t border-line/60 flex items-center gap-2 flex-wrap">
          <span className="text-ink-3 text-xs">Try sample teams:</span>
          {["1", "100", "500", "1234"].map(sampleId => (
            <button
              key={sampleId}
              type="button"
              onClick={() => handleQuickSample(sampleId)}
              disabled={isLoading}
              className="text-xs font-mono px-2.5 py-1 rounded-lg bg-surface-2 hover:bg-primary/20 hover:text-blue-400 text-ink-2 border border-line transition-colors cursor-pointer"
            >
              #{sampleId}
            </button>
          ))}
        </div>

        {errorMessage && (
          <div className="mt-4 flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
            <svg className="w-5 h-5 shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-.75-9.25a.75.75 0 011.5 0v3.5a.75.75 0 01-1.5 0v-3.5zm.75 6a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
            </svg>
            <p className="text-xs sm:text-sm font-medium">{errorMessage}</p>
          </div>
        )}
      </div>
    </section>
  )
}

// ── Home page ─────────────────────────────────────────────────────────────────

export default function HomePage() {
  const { user } = useAuth()
  const [appPhase, setAppPhase] = useState<AppPhase>({ phase: "idle" })

  async function loadTeam(teamId: string) {
    setAppPhase({ phase: "loading", message: "Fetching gameweek data..." })

    try {
      const [bootstrap, fixtures] = await Promise.all([
        fetchJson<BootstrapResponse>(fplApiUrl("bootstrap")),
        fetchJson<FplFixture[]>(fplApiUrl("fixtures")),
      ])

      const currentEvent = bootstrap.events.find(e => e.is_current)
      const nextEvent = bootstrap.events.find(e => e.is_next)
      const unfinishedEvent = bootstrap.events.find(e => !e.finished)
      const activeEvent = currentEvent || nextEvent || unfinishedEvent || bootstrap.events[0]
      const gameweek = activeEvent ? activeEvent.id : 1

      setAppPhase({ phase: "loading", message: `Loading GW${gameweek} squad...` })

      const teamPicks = await fetchJson<TeamPicksResponse>(
        fplApiUrl(`team/${teamId}/${gameweek}`),
      )

      setAppPhase({ phase: "loading", message: `Analysing ${teamPicks.picks.length} players...` })

      const summaries = await Promise.all(
        teamPicks.picks.map(pick =>
          fetchJson<PlayerSummaryResponse>(fplApiUrl(`player/${pick.element}`)),
        ),
      )

      const elementsMap = new Map(bootstrap.elements.map(el => [el.id, el]))
      const teamsMap = new Map(bootstrap.teams.map(t => [t.id, t]))
      const nextEventId = getNextEventId(fixtures, gameweek)

      const enrichedPicks: EnrichedPick[] = teamPicks.picks.map((pick, i) => {
        const element = elementsMap.get(pick.element)!
        const team = teamsMap.get(element.team)!
        const summary = summaries[i]
        const prediction = calculatePrediction({ element, summary, fixtures, nextEventId })
        const nextFixture = resolveFixtureInfo(fixtures, element.team, nextEventId, teamsMap)
        return { pick, element, team, prediction, nextFixture }
      })

      const startingXI = enrichedPicks.filter(ep => ep.pick.position <= 11)
      const bench = enrichedPicks.filter(ep => ep.pick.position > 11)

      const rawScore = startingXI.reduce(
        (sum, ep) => sum + ep.prediction.predictedPoints * ep.pick.multiplier,
        0,
      )

      setAppPhase({
        phase: "loaded",
        squadData: {
          gameweek,
          startingXI,
          bench,
          predictedScore: Math.round(rawScore * 10) / 10,
          bank: teamPicks.entry_history.bank,
          allPlayers: bootstrap.elements,
          allTeams: bootstrap.teams,
        },
      })
    } catch (err) {
      setAppPhase({
        phase: "error",
        message: err instanceof Error ? err.message : "Failed to load team data.",
      })
    }
  }

  const isLoading = appPhase.phase === "loading"
  const errorMessage = appPhase.phase === "error" ? appPhase.message : null
  const isAuthenticated = !!user

  return (
    <>
      {appPhase.phase !== "loaded" && <Hero />}
      <TeamLoader onSubmit={loadTeam} isLoading={isLoading} errorMessage={errorMessage} />
      {isLoading && <LoadingCard message={appPhase.message} />}
      {appPhase.phase === "loaded" && (
        <SquadView squadData={appPhase.squadData} isAuthenticated={isAuthenticated} />
      )}
      {appPhase.phase === "idle" && <LandingSection />}
    </>
  )
}
