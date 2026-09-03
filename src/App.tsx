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
import LandingSection from "./components/LandingSection"

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
    <header className="bg-nav border-b sticky top-0 z-10" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
      <div className="max-w-5xl mx-auto px-5 py-3 flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
              <path d="M3 8l3.5 3.5L13 4.5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span
            className="text-white hidden sm:block"
            style={{ fontFamily: "var(--font-rajdhani)", fontWeight: 700, fontSize: "22px" }}
          >
            FPL Team Assistant
          </span>
          <span
            className="text-white sm:hidden"
            style={{ fontFamily: "var(--font-rajdhani)", fontWeight: 700, fontSize: "20px" }}
          >
            FPL Assist
          </span>
        </div>

        <div className="ml-auto">
          <button
            onClick={onToggle}
            className="w-11 h-11 rounded-xl flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
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
    <section className="bg-base border-b border-line">
      <div className="max-w-5xl mx-auto px-5 py-14 sm:py-20">
        <div className="flex flex-col sm:flex-row sm:items-start sm:gap-16 gap-8">

          {/* Score demo — appears first on mobile, right on desktop */}
          <div className="order-first sm:order-last sm:shrink-0 sm:text-right">
            <div
              className="text-primary leading-none"
              style={{
                fontFamily: "var(--font-rajdhani)",
                fontWeight: 700,
                fontSize: "clamp(80px, 14vw, 148px)",
              }}
            >
              84.2
            </div>
            <p className="text-ink-3 text-sm mt-1">predicted this gameweek</p>
          </div>

          {/* Headline + subtext */}
          <div className="flex-1">
            <h1
              className="text-ink leading-[1.08] mb-5"
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
    <div className="max-w-5xl mx-auto px-5 py-8">
      <div className="bg-surface border border-line rounded-xl p-6 max-w-xl">
        <h2
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
    <div className="min-h-full flex flex-col bg-base">
      <Header dark={dark} onToggle={toggleDark} />
      <main className="flex-1">
        {appPhase.phase !== "loaded" && <Hero />}
        <TeamLoader onSubmit={loadTeam} isLoading={isLoading} errorMessage={errorMessage} />
        {isLoading && <LoadingCard message={appPhase.message} />}
        {appPhase.phase === "loaded" && <SquadView squadData={appPhase.squadData} />}
        {appPhase.phase === "idle" && <LandingSection />}
      </main>
      <footer className="border-t border-line py-5 mt-4">
        <p className="text-center text-ink-3 text-xs">
          FPL Team Assistant &mdash; not affiliated with Fantasy Premier League or the Premier League.
        </p>
      </footer>
    </div>
  )
}
