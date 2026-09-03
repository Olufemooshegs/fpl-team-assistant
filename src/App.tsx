import { useEffect, useState } from "react"
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

// ── Dark mode ─────────────────────────────────────────────────────────────────

function useDarkMode(): [boolean, () => void] {
  const [dark, setDark] = useState<boolean>(() => {
    const stored = localStorage.getItem("fpl-theme")
    if (stored) return stored === "dark"
    return window.matchMedia("(prefers-color-scheme: dark)").matches
  })

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark)
    localStorage.setItem("fpl-theme", dark ? "dark" : "light")
  }, [dark])

  return [dark, () => setDark(d => !d)]
}

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

// ── Icons ─────────────────────────────────────────────────────────────────────

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}

// ── Header ────────────────────────────────────────────────────────────────────

function Header({ dark, onToggle }: { dark: boolean; onToggle: () => void }) {
  return (
    <header className="bg-header border-b border-header-border sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-5 py-3.5 flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center shrink-0">
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
              <path d="M3 8l3.5 3.5L13 4.5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span
            className="text-[22px] text-white tracking-wide hidden sm:block"
            style={{ fontFamily: "var(--font-rajdhani)", fontWeight: 700 }}
          >
            FPL TEAM ASSISTANT
          </span>
          <span
            className="text-[20px] text-white tracking-wide sm:hidden"
            style={{ fontFamily: "var(--font-rajdhani)", fontWeight: 700 }}
          >
            FPL ASSIST
          </span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-accent/20 text-accent-fg/70 border border-white/10 hidden sm:inline">
            BETA
          </span>
          <button
            onClick={onToggle}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
            aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {dark ? <SunIcon /> : <MoonIcon />}
          </button>
        </div>
      </div>
    </header>
  )
}

// ── Hero ──────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 60% 60% at 80% 40%, var(--c-accent-subtle), transparent)",
        }}
      />
      <div className="max-w-5xl mx-auto px-6 py-16 md:py-24">
        <div className="max-w-xl">
          <div className="flex items-center gap-2 mb-5">
            <div className="h-px w-6 bg-accent" />
            <span className="text-accent text-[11px] font-semibold tracking-widest uppercase">
              Data-driven FPL
            </span>
          </div>
          <h1
            className="text-[52px] md:text-6xl text-ink leading-[1.05] mb-5"
            style={{ fontFamily: "var(--font-rajdhani)", fontWeight: 700 }}
          >
            IMPORT YOUR TEAM.
            <br />
            <span className="text-accent">HIT 80+ POINTS</span>
            <br />
            NEXT GAMEWEEK.
          </h1>
          <p className="text-ink-secondary text-base md:text-lg leading-relaxed mb-8 max-w-lg">
            Enter your FPL Team ID to pull your current squad and get
            data-driven transfer suggestions based on fixtures, form, and
            expected points.
          </p>
          <div className="flex flex-wrap gap-5 text-sm text-ink-muted">
            {["Live FPL data", "Fixture difficulty ratings", "Predicted xP per player"].map(f => (
              <span key={f} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                {f}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ── Loading indicator ─────────────────────────────────────────────────────────

function LoadingCard({ message }: { message: string }) {
  return (
    <div className="max-w-5xl mx-auto px-6 pb-8">
      <div className="flex items-center gap-4 p-5 bg-surface-card shadow-card border border-app-border rounded-2xl max-w-xl">
        <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin shrink-0" />
        <div>
          <p className="text-ink text-sm font-medium">{message}</p>
          <p className="text-ink-muted text-xs mt-0.5">Hang tight...</p>
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
    <div className="max-w-5xl mx-auto px-6 pb-10">
      <div className="bg-surface-card shadow-card border border-app-border rounded-2xl p-7 max-w-xl">
        <h2
          className="text-lg text-ink mb-0.5"
          style={{ fontFamily: "var(--font-rajdhani)", fontWeight: 700 }}
        >
          LOAD YOUR SQUAD
        </h2>
        <p className="text-ink-muted text-sm mb-5">
          Your Team ID appears in the URL at{" "}
          <span className="text-accent font-medium">Points &rarr; View gameweek history</span>.
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
            className="flex-1 min-w-0 bg-surface-input border border-app-border rounded-xl px-4 py-2.5 text-ink placeholder-ink-muted focus:outline-none focus:border-accent/50 focus:ring-2 focus:ring-accent/15 transition-all text-sm disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading || !teamId.trim()}
            className="px-5 py-2.5 bg-accent text-accent-fg rounded-xl font-semibold text-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all whitespace-nowrap"
            style={{ "--tw-bg-opacity": "1" } as React.CSSProperties}
            onMouseEnter={e => !isLoading && ((e.target as HTMLElement).style.backgroundColor = "var(--c-accent-hover)")}
            onMouseLeave={e => ((e.target as HTMLElement).style.backgroundColor = "")}
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
          <div className="mt-4 flex items-start gap-3 p-3.5 rounded-xl bg-danger-subtle border border-danger/20">
            <svg className="w-4 h-4 text-danger mt-0.5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-.75-9.25a.75.75 0 011.5 0v3.5a.75.75 0 01-1.5 0v-3.5zm.75 6a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
            </svg>
            <p className="text-danger text-sm">{errorMessage}</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Root ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [dark, toggleDark] = useDarkMode()
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
      console.log("[FPL] Raw team picks:", teamPicks)

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
    <div className="min-h-full flex flex-col bg-surface">
      <Header dark={dark} onToggle={toggleDark} />
      <main className="flex-1">
        {appPhase.phase !== "loaded" && <Hero />}
        <TeamLoader onSubmit={loadTeam} isLoading={isLoading} errorMessage={errorMessage} />
        {isLoading && <LoadingCard message={appPhase.message} />}
        {appPhase.phase === "loaded" && <SquadView squadData={appPhase.squadData} />}
      </main>
      <footer className="border-t border-app-border py-5 mt-4">
        <p className="text-center text-ink-muted text-xs">
          FPL Team Assistant &mdash; not affiliated with Fantasy Premier League or the Premier League.
        </p>
      </footer>
    </div>
  )
}
