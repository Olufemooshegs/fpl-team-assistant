import { useState } from "react"
import type {
  BootstrapResponse,
  FplFixture,
  TeamPicksResponse,
  PlayerSummaryResponse,
  ApiError,
  SquadData,
  EnrichedPick,
} from "./types"
import { calculatePrediction, getNextEventId, resolveFixtureInfo } from "./services/prediction"
import SquadView from "./components/SquadView"

type AppPhase =
  | { phase: "idle" }
  | { phase: "loading"; message: string }
  | { phase: "error"; message: string }
  | { phase: "loaded"; squadData: SquadData }

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
          <div className="w-8 h-8 rounded-full bg-fpl-green flex items-center justify-center shrink-0">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M3 8l3.5 3.5L13 4.5"
                stroke="#37003c"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
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
            {["Live FPL data", "Fixture difficulty", "xP projections"].map(f => (
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

function LoadingCard({ message }: { message: string }) {
  return (
    <div className="max-w-5xl mx-auto px-6 pb-8">
      <div className="flex items-center gap-4 p-5 bg-navy-card border border-navy-border rounded-2xl max-w-xl">
        <div className="w-8 h-8 rounded-full border-2 border-fpl-green border-t-transparent animate-spin shrink-0" />
        <div>
          <p className="text-white text-sm font-medium">{message}</p>
          <p className="text-text-muted text-xs mt-0.5">Hang tight...</p>
        </div>
      </div>
    </div>
  )
}

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

  return (
    <div className="max-w-5xl mx-auto px-6 pb-8">
      <div className="bg-navy-card border border-navy-border rounded-2xl p-8 max-w-xl">
        <h2
          className="text-xl text-white mb-1"
          style={{ fontFamily: "var(--font-rajdhani)", fontWeight: 700 }}
        >
          LOAD YOUR SQUAD
        </h2>
        <p className="text-text-muted text-sm mb-6">
          Find your Team ID at{" "}
          <span className="text-fpl-green">Points &rarr; View gameweek history</span>{" "}
          in the FPL app URL.
        </p>

        <form onSubmit={handleSubmit} className="flex gap-3">
          <input
            type="text"
            inputMode="numeric"
            pattern="\d*"
            value={teamId}
            onChange={e => setTeamId(e.target.value)}
            placeholder="e.g. 1234567"
            disabled={isLoading}
            className="flex-1 bg-navy-elevated border border-navy-border rounded-xl px-4 py-3 text-white placeholder-text-muted focus:outline-none focus:border-fpl-green/60 focus:ring-1 focus:ring-fpl-green/30 transition-all text-sm disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading || !teamId.trim()}
            className="px-5 py-3 bg-fpl-green text-fpl-purple rounded-xl font-semibold text-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:bg-fpl-green-dim active:scale-95 transition-all whitespace-nowrap"
          >
            {isLoading ? (
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

        {errorMessage && (
          <div className="mt-4 flex items-start gap-3 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20">
            <svg
              className="w-4 h-4 text-red-400 mt-0.5 shrink-0"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm-.75-9.25a.75.75 0 011.5 0v3.5a.75.75 0 01-1.5 0v-3.5zm.75 6a.75.75 0 100-1.5.75.75 0 000 1.5z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-red-300 text-sm">{errorMessage}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function App() {
  const [appPhase, setAppPhase] = useState<AppPhase>({ phase: "idle" })

  async function loadTeam(teamId: string) {
    setAppPhase({ phase: "loading", message: "Fetching gameweek data..." })

    try {
      // Step 1: bootstrap + fixtures in parallel (both cached server-side)
      const [bootstrap, fixtures] = await Promise.all([
        fetchJson<BootstrapResponse>("/api/fpl/bootstrap"),
        fetchJson<FplFixture[]>("/api/fpl/fixtures"),
      ])

      const currentEvent = bootstrap.events.find(e => e.is_current)
      const gameweek =
        currentEvent?.id ?? bootstrap.events.findIndex(e => !e.finished) + 1

      setAppPhase({ phase: "loading", message: `Loading GW${gameweek} squad...` })

      // Step 2: team picks for this gameweek
      const teamPicks = await fetchJson<TeamPicksResponse>(
        `/api/fpl/team/${teamId}/${gameweek}`,
      )
      console.log("[FPL] Raw team picks:", teamPicks)

      setAppPhase({ phase: "loading", message: `Analysing ${teamPicks.picks.length} players...` })

      // Step 3: all 15 player histories in parallel
      const summaries = await Promise.all(
        teamPicks.picks.map(pick =>
          fetchJson<PlayerSummaryResponse>(`/api/fpl/player/${pick.element}`),
        ),
      )

      // Step 4: build lookup maps and next-event id
      const elementsMap = new Map(bootstrap.elements.map(el => [el.id, el]))
      const teamsMap = new Map(bootstrap.teams.map(t => [t.id, t]))
      const nextEventId = getNextEventId(fixtures, gameweek)

      // Step 5: enrich each pick with prediction + fixture info
      const enrichedPicks: EnrichedPick[] = teamPicks.picks.map((pick, i) => {
        const element = elementsMap.get(pick.element)!
        const team = teamsMap.get(element.team)!
        const summary = summaries[i]
        const prediction = calculatePrediction({ element, summary, fixtures, nextEventId })
        const nextFixture = resolveFixtureInfo(fixtures, element.team, nextEventId, teamsMap)
        return { pick, element, team, prediction, nextFixture }
      })

      // position 1-11 = starting, 12-15 = bench
      const startingXI = enrichedPicks.filter(ep => ep.pick.position <= 11)
      const bench = enrichedPicks.filter(ep => ep.pick.position > 11)

      // predicted score = sum of (predictedPts × multiplier) for starters
      // captain multiplier=2 doubles their contribution automatically
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

  return (
    <div className="min-h-full flex flex-col bg-navy">
      <Header />
      <main className="flex-1">
        {/* Hero only shown before squad is loaded */}
        {appPhase.phase !== "loaded" && <Hero />}

        <TeamLoader
          onSubmit={loadTeam}
          isLoading={isLoading}
          errorMessage={errorMessage}
        />

        {isLoading && <LoadingCard message={appPhase.message} />}

        {appPhase.phase === "loaded" && <SquadView squadData={appPhase.squadData} />}
      </main>
      <footer className="border-t border-navy-border py-5">
        <p className="text-center text-text-muted text-xs">
          FPL Team Assistant &mdash; not affiliated with Fantasy Premier League or the Premier League.
        </p>
      </footer>
    </div>
  )
}
