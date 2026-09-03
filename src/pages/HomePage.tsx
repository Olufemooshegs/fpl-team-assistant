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

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  const json = await res.json()
  if (!res.ok) {
    throw new Error((json as ApiError).error ?? `Request failed: ${res.status}`)
  }
  return json as T
}

// ── Hero ──────────────────────────────────────────────────────────────────────

function Hero() {
  const displayed = useCountUp(84.2, 1, 0.9)
  return (
    <section className="bg-base border-b border-line" aria-labelledby="landing-hero-heading">
      <div className="max-w-5xl mx-auto px-5 py-20 sm:py-28">
        <div className="flex flex-col sm:flex-row sm:items-start sm:gap-16 gap-10">

          <div className="order-first sm:order-last sm:shrink-0 sm:text-right">
            <div
              className="text-primary leading-none num-display"
              style={{
                fontFamily: "var(--font-rajdhani)",
                fontWeight: 700,
                fontSize: "clamp(80px, 14vw, 148px)",
              }}
            >
              {displayed}
            </div>
            <p className="text-ink-3 text-sm mt-2">predicted this gameweek</p>
          </div>

          <div className="flex-1">
            <h1
              id="landing-hero-heading"
              className="text-ink leading-[1.08] mb-6"
              style={{
                fontFamily: "var(--font-rajdhani)",
                fontWeight: 700,
                fontSize: "clamp(36px, 5.5vw, 58px)",
              }}
            >
              Import your FPL team.
              <br />
              <span className="text-primary">Hit 80+ points</span>
              <br />
              next gameweek.
            </h1>
            <p className="text-ink-2 text-base leading-relaxed mb-8 max-w-md">
              Enter your Team ID to pull your current squad and get
              data-driven predictions based on fixture difficulty,
              recent form, and defensive output.
            </p>
            <p className="text-ink-3 text-sm">
              Enter your Team ID below &darr;
            </p>
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

  return (
    <section className="max-w-5xl mx-auto px-5 py-10" aria-labelledby="team-loader-heading">
      <div className="bg-surface border border-line rounded-xl p-6 sm:p-8 max-w-xl">
        <h2
          id="team-loader-heading"
          className="text-ink mb-1"
          style={{ fontFamily: "var(--font-rajdhani)", fontWeight: 700, fontSize: "20px" }}
        >
          Load your squad
        </h2>
        <p className="text-ink-3 text-sm mb-5">
          Your Team ID appears in the URL at{" "}
          <span className="text-primary font-medium">Points &rarr; View gameweek history</span>.
        </p>

        <form onSubmit={handleSubmit} className="flex gap-2.5">
          <input
            type="text"
            inputMode="numeric"
            pattern="\d*"
            value={teamId}
            onChange={e => setTeamId(e.target.value)}
            placeholder="e.g. 1234567"
            disabled={isLoading}
            className="flex-1 min-w-0 h-11 bg-base border border-line rounded-lg px-4 text-ink text-sm placeholder-ink-3 focus:outline-none focus:border-primary focus:ring-2 transition-all disabled:opacity-50"
            style={{ "--tw-ring-color": "rgba(36,84,255,0.12)" } as React.CSSProperties}
          />
          <button
            type="submit"
            disabled={isLoading || !teamId.trim()}
            className="h-11 px-5 bg-primary text-white rounded-lg font-semibold text-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity whitespace-nowrap"
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
              "Load team"
            )}
          </button>
        </form>

        {errorMessage && (
          <div className="mt-4 flex items-start gap-3 p-3.5 rounded-lg bg-hard-bg border border-hard/20">
            <svg className="w-4 h-4 text-hard mt-0.5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-.75-9.25a.75.75 0 011.5 0v3.5a.75.75 0 01-1.5 0v-3.5zm.75 6a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
            </svg>
            <p className="text-hard text-sm">{errorMessage}</p>
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
        fetchJson<BootstrapResponse>("/api/fpl/bootstrap"),
        fetchJson<FplFixture[]>("/api/fpl/fixtures"),
      ])

      const currentEvent = bootstrap.events.find(e => e.is_current)
      const gameweek =
        currentEvent?.id ?? bootstrap.events.findIndex(e => !e.finished) + 1

      setAppPhase({ phase: "loading", message: `Loading GW${gameweek} squad...` })

      const teamPicks = await fetchJson<TeamPicksResponse>(
        `/api/fpl/team/${teamId}/${gameweek}`,
      )

      setAppPhase({ phase: "loading", message: `Analysing ${teamPicks.picks.length} players...` })

      const summaries = await Promise.all(
        teamPicks.picks.map(pick =>
          fetchJson<PlayerSummaryResponse>(`/api/fpl/player/${pick.element}`),
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
