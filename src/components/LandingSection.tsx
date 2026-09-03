import { useRef } from "react"
import { motion, useInView, useReducedMotion } from "motion/react"
import type { EnrichedPick } from "../types"
import { Jersey, Crest } from "./FplImages"

// ── Scroll-reveal primitives ──────────────────────────────────────────────────

function Reveal({
  children,
  delay = 0,
  y = 20,
  className = "",
}: {
  children: React.ReactNode
  delay?: number
  y?: number
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: "-80px 0px" })
  const reduced = useReducedMotion()

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={reduced ? { opacity: 1, y: 0 } : { opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: reduced ? 0 : delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}

// ── Mock squad data ───────────────────────────────────────────────────────────
// Real PL team codes from the FPL CDN, so jersey images actually load.

function pick(
  id: number,
  pos: number,
  webName: string,
  teamCode: number,
  teamShort: string,
  elementType: number,
  cost: number,
  pts: number,
  oppCode: number,
  oppShort: string,
  isHome: boolean,
  diff: number,
  cap = false,
  vc = false,
): EnrichedPick {
  return {
    pick: { element: id, position: pos, multiplier: cap ? 2 : 1, is_captain: cap, is_vice_captain: vc },
    element: {
      id, first_name: webName, second_name: "", web_name: webName,
      team: teamCode, element_type: elementType,
      now_cost: Math.round(cost * 10), total_points: 160,
      points_per_game: "6.2", ep_next: String(pts), ep_this: null,
      chance_of_playing_next_round: null,
      selected_by_percent: "18.5", form: "6.5", status: "a",
    },
    team: { id: teamCode, code: teamCode, name: teamShort, short_name: teamShort },
    prediction: { elementId: id, baseScore: pts, predictedPoints: pts, epNext: pts },
    nextFixture: {
      opponentTeamId: oppCode, opponentCode: oppCode,
      opponentShortName: oppShort,
      isHome, difficulty: diff, event: 22,
    },
  }
}

// 4-4-2 with typical FPL manager picks
const MOCK_XI: EnrichedPick[] = [
  pick(1,  1,  "Raya",        3,  "ARS", 1, 5.5, 5.8,  43, "MCI", false, 4),
  pick(2,  2,  "Alexander-Arnold", 14, "LIV", 2, 7.0, 10.2, 8,  "CHE", true,  3, true),
  pick(3,  3,  "Pedro Porro", 6,  "TOT", 2, 5.5, 6.1,  4,  "NEW", false, 3),
  pick(4,  4,  "Estupinan",   36, "BHA", 2, 5.0, 5.4,  21, "WHU", true,  2),
  pick(5,  5,  "Martinez",    7,  "AVL", 2, 5.0, 5.7,  14, "LIV", false, 4),
  pick(6,  6,  "Salah",       14, "LIV", 3, 13.0,11.8,  8, "CHE", true,  3, false, true),
  pick(7,  7,  "Saka",        3,  "ARS", 3, 10.0, 8.7, 43, "MCI", false, 4),
  pick(8,  8,  "Palmer",      8,  "CHE", 3, 11.5, 8.1, 14, "LIV", false, 4),
  pick(9,  9,  "Adingra",     36, "BHA", 3, 6.5,  6.2, 21, "WHU", true,  2),
  pick(10, 10, "Haaland",     43, "MCI", 4, 15.0, 10.9, 3, "ARS", true,  4),
  pick(11, 11, "Watkins",     7,  "AVL", 4, 9.5,  7.4, 14, "LIV", false, 4),
]

const MOCK_BENCH: EnrichedPick[] = [
  pick(12, 12, "Flekken",     94, "BRE", 1, 4.5, 3.8, 6,  "TOT", false, 3),
  pick(13, 13, "Pedro",       8,  "CHE", 2, 4.5, 4.2, 14, "LIV", false, 4),
  pick(14, 14, "Doherty",     43, "MCI", 2, 4.5, 4.5,  3, "ARS", true,  4),
  pick(15, 15, "Nkunku",      8,  "CHE", 4, 6.5, 5.1, 14, "LIV", false, 4),
]

const MOCK_SCORE = 78.3

// ── Shared preview sub-components ────────────────────────────────────────────

const POSITION_COLOR: Record<number, string> = {
  1: "#D97706", 2: "#2454FF", 3: "#16A34A", 4: "#DC2626",
}

function diffClass(d: number): string {
  if (d <= 2) return "text-easy bg-easy-bg"
  if (d === 3) return "text-mid bg-mid-bg"
  return "text-hard bg-hard-bg"
}

// Inline pitch line overlay
function PitchMarkings() {
  const s = { borderColor: "rgba(255,255,255,0.07)" } as React.CSSProperties
  return (
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute top-1/2 left-8 right-8 h-px" style={{ background: "rgba(255,255,255,0.07)" }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full border" style={s} />
      <div className="absolute top-5 left-1/2 -translate-x-1/2 w-32 h-11 rounded-b-lg border border-t-0" style={s} />
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 w-32 h-11 rounded-t-lg border border-b-0" style={s} />
    </div>
  )
}

// Compact card for use on the preview pitch
function PreviewCard({ ep }: { ep: EnrichedPick }) {
  const { pick: p, element, team, prediction, nextFixture } = ep
  const displayPts = prediction.predictedPoints * Math.max(p.multiplier, 1)
  const stripColor = POSITION_COLOR[element.element_type] ?? "#94A3B8"

  return (
    <div className="relative flex flex-col items-center w-[80px]">
      <div className="w-full rounded-lg overflow-hidden" style={{ background: "var(--c-pitch-card)" }}>
        <div className="h-[3px] w-full" style={{ background: stripColor }} />
        <div className="p-1.5 flex flex-col items-center text-center gap-[3px]">
          {/* Jersey with C/VC badge */}
          <div className="relative">
            <Jersey teamCode={team.code} teamShortName={team.short_name} isGK={element.element_type === 1} size={40} />
            {(p.is_captain || p.is_vice_captain) && (
              <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white ${p.is_captain ? "bg-primary" : "bg-ink-2"}`}>
                {p.is_captain ? "C" : "V"}
              </div>
            )}
          </div>
          <p className="text-[10px] font-semibold truncate w-full leading-tight" style={{ color: "var(--c-pitch-ink)" }}>
            {element.web_name}
          </p>
          <div className="leading-none" style={{ fontFamily: "var(--font-rajdhani)", fontWeight: 700, fontSize: "19px", color: "var(--c-pitch-ink)" }}>
            {displayPts.toFixed(1)}
          </div>
          {nextFixture && (
            <span className={`inline-flex items-center gap-0.5 text-[8px] font-semibold px-1 py-0.5 rounded ${diffClass(nextFixture.difficulty)}`}>
              <Crest teamCode={nextFixture.opponentCode} shortName={nextFixture.opponentShortName} size={10} />
              {nextFixture.isHome ? "" : "@"}{nextFixture.opponentShortName}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

function PreviewRow({ picks }: { picks: EnrichedPick[] }) {
  if (picks.length === 0) return null
  return (
    <div className="flex justify-center gap-1.5">
      {picks.map(ep => <PreviewCard key={ep.pick.element} ep={ep} />)}
    </div>
  )
}

// Full pitch preview using real data + jerseys
function PitchPreview() {
  const gk  = MOCK_XI.filter(ep => ep.element.element_type === 1)
  const def = MOCK_XI.filter(ep => ep.element.element_type === 2)
  const mid = MOCK_XI.filter(ep => ep.element.element_type === 3)
  const fwd = MOCK_XI.filter(ep => ep.element.element_type === 4)

  return (
    <div className="relative rounded-xl overflow-hidden" style={{ background: "var(--c-pitch-gradient)" }}>
      <PitchMarkings />
      <div className="relative z-10 flex flex-col gap-4 py-8 px-3">
        <PreviewRow picks={fwd} />
        <PreviewRow picks={mid} />
        <PreviewRow picks={def} />
        <PreviewRow picks={gk} />
      </div>
    </div>
  )
}

// Score banner preview (self-contained, no imports from SquadView)
function ScorePreview() {
  const gap = MOCK_SCORE - 80
  const barPct = (MOCK_SCORE / 100) * 100

  return (
    <div className="border-l-4 border-primary rounded-r-xl bg-primary-subtle">
      <div className="px-6 py-5">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <p className="text-ink-3 text-[10px] font-medium tracking-wider uppercase mb-1">
              GW22 predicted score
            </p>
            <div className="text-ink leading-none" style={{ fontFamily: "var(--font-rajdhani)", fontWeight: 700, fontSize: "72px" }}>
              {MOCK_SCORE.toFixed(1)}
            </div>
            <p className="text-ink-3 text-xs mt-1">starting XI projected points</p>
          </div>
          <div className="sm:text-right">
            <div className="text-mid" style={{ fontFamily: "var(--font-rajdhani)", fontWeight: 700, fontSize: "28px", lineHeight: 1 }}>
              {gap.toFixed(1)}
            </div>
            <p className="text-ink-3 text-xs mt-0.5">vs 80pt target</p>
          </div>
        </div>
        <div className="mt-5">
          <div className="relative h-1.5 bg-line rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700 bg-mid" style={{ width: `${barPct}%` }} />
            <div className="absolute top-0 bottom-0 w-px bg-ink-3/30" style={{ left: "80%" }} />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-ink-3 text-[10px]">0</span>
            <span className="text-ink-3 text-[10px]">80pt target</span>
            <span className="text-ink-3 text-[10px]">100</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// Bench preview strip
function BenchPreview() {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {MOCK_BENCH.map(ep => {
        const stripColor = POSITION_COLOR[ep.element.element_type] ?? "#94A3B8"
        return (
          <div key={ep.pick.element} className="flex-shrink-0 w-[76px] opacity-65">
            <div className="w-full rounded-lg overflow-hidden bg-surface-2 border border-line">
              <div className="h-[3px] w-full" style={{ background: stripColor }} />
              <div className="p-1.5 flex flex-col items-center text-center gap-0.5">
                <Jersey teamCode={ep.team.code} teamShortName={ep.team.short_name} isGK={ep.element.element_type === 1} size={30} />
                <p className="text-ink text-[9px] font-semibold truncate w-full">{ep.element.web_name}</p>
                <div className="text-ink-2 leading-none" style={{ fontFamily: "var(--font-rajdhani)", fontWeight: 700, fontSize: "15px" }}>
                  {ep.prediction.predictedPoints.toFixed(1)}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Section wrapper ───────────────────────────────────────────────────────────

function SectionWrap({ children, alt = false }: { children: React.ReactNode; alt?: boolean }) {
  return (
    <section className={`border-t border-line ${alt ? "bg-surface" : "bg-base"}`}>
      <div className="max-w-5xl mx-auto px-5 py-20 sm:py-28">
        {children}
      </div>
    </section>
  )
}

// ── "Screenshot" frame ────────────────────────────────────────────────────────
// Gives the live component render a product-shot context without fake device chrome.

function Frame({ children, label }: { children: React.ReactNode; label?: string }) {
  return (
    <div className="relative">
      <div className="border border-line rounded-xl overflow-hidden bg-base shadow-[0_0_0_1px_rgba(0,0,0,0.03)]">
        {label && (
          <div className="border-b border-line px-4 py-2.5 flex items-center gap-2 bg-surface">
            <div className="flex gap-1.5">
              <div className="w-2 h-2 rounded-full bg-line" />
              <div className="w-2 h-2 rounded-full bg-line" />
              <div className="w-2 h-2 rounded-full bg-line" />
            </div>
            <span className="text-ink-3 text-[11px] ml-1">{label}</span>
          </div>
        )}
        <div className="p-4 sm:p-6">
          {children}
        </div>
      </div>
    </div>
  )
}

// ── Feature sections ──────────────────────────────────────────────────────────

function PitchSection() {
  return (
    <SectionWrap>
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-12 lg:gap-16 items-center">

        {/* Copy */}
        <div>
          <Reveal delay={0}>
            <h2
              className="text-ink mb-5 leading-tight"
              style={{ fontFamily: "var(--font-rajdhani)", fontWeight: 700, fontSize: "clamp(28px, 4vw, 40px)" }}
            >
              Your squad on the pitch, with predicted points for every player
            </h2>
          </Reveal>
          <Reveal delay={0.08}>
            <p className="text-ink-2 text-base leading-relaxed mb-7">
              See your starting XI laid out in formation — goalkeeper at the
              bottom, forwards at the top. Each card shows the shirt, the
              predicted gameweek score, and your next fixture coloured by
              difficulty so you can spot problems at a glance.
            </p>
          </Reveal>
          <ul className="space-y-3">
            {[
              ["Fixture difficulty", "Easy (green), average (amber), hard (red) — instantly scannable"],
              ["Captain indicator", "Your captain's predicted score is automatically doubled"],
              ["Bench at the bottom", "Four bench players shown below, de-prioritised but still visible"],
            ].map(([title, desc], i) => (
              <Reveal key={title} delay={0.14 + i * 0.07}>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                  <p className="text-ink-2 text-sm leading-relaxed">
                    <span className="font-semibold text-ink">{title} — </span>
                    {desc}
                  </p>
                </li>
              </Reveal>
            ))}
          </ul>
        </div>

        {/* Live pitch preview — hidden on mobile (too compact), shown sm+ */}
        <Reveal delay={0.1} y={24} className="hidden sm:block">
          <Frame label="fplassistant.app — Your Squad">
            <PitchPreview />
            <div className="mt-4 pt-4 border-t border-line">
              <p className="text-ink-3 text-[10px] mb-2 font-medium">Bench</p>
              <BenchPreview />
            </div>
          </Frame>
        </Reveal>

        {/* Mobile: show score preview instead */}
        <Reveal className="sm:hidden">
          <Frame>
            <ScorePreview />
          </Frame>
        </Reveal>
      </div>
    </SectionWrap>
  )
}

function ScoreSection() {
  return (
    <SectionWrap alt>
      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-12 lg:gap-16 items-center">

        {/* Live score banner */}
        <Reveal delay={0.05} y={24} className="lg:order-first">
          <Frame label="fplassistant.app — GW22 Prediction">
            <ScorePreview />
          </Frame>
        </Reveal>

        {/* Copy */}
        <div>
          <Reveal delay={0}>
            <h2
              className="text-ink mb-5 leading-tight"
              style={{ fontFamily: "var(--font-rajdhani)", fontWeight: 700, fontSize: "clamp(28px, 4vw, 40px)" }}
            >
              Know if you will hit 80 before the deadline
            </h2>
          </Reveal>
          <Reveal delay={0.08}>
            <p className="text-ink-2 text-base leading-relaxed mb-5">
              The predicted GW score is calculated from your players' recent
              form (weighted toward the last few gameweeks), fixture
              difficulty, home advantage, and minutes reliability.
            </p>
          </Reveal>
          <Reveal delay={0.14}>
            <p className="text-ink-2 text-base leading-relaxed">
              The 80-point benchmark is shown on the progress bar so you
              know immediately whether to play a chip, make a transfer, or
              hold steady. You can see exactly how far above or below target
              you are.
            </p>
          </Reveal>
        </div>

      </div>
    </SectionWrap>
  )
}

function TransferSection() {
  return (
    <SectionWrap>
      <div className="max-w-xl mx-auto text-center">
        <Reveal delay={0}>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-line bg-surface-2 mb-6">
            <div className="w-1.5 h-1.5 rounded-full bg-mid" />
            <span className="text-ink-3 text-xs font-medium">In development</span>
          </div>
        </Reveal>

        <Reveal delay={0.06}>
          <h2
            className="text-ink mb-5 leading-tight"
            style={{ fontFamily: "var(--font-rajdhani)", fontWeight: 700, fontSize: "clamp(28px, 4vw, 40px)" }}
          >
            Transfer suggestions, ranked by impact
          </h2>
        </Reveal>

        <Reveal delay={0.12}>
          <p className="text-ink-2 text-base leading-relaxed mb-10">
            The next update will surface smart transfer targets ranked by
            predicted points gain, fixture run, and differential value — so
            you spend your free transfers where they matter most. No guesswork.
          </p>
        </Reveal>

        {/* Skeleton preview */}
        <Reveal delay={0.18} y={16}>
          <div className="bg-surface border border-line rounded-xl p-6 text-left max-w-md mx-auto">
            <div className="flex items-center justify-between mb-5">
              <p className="text-ink-3 text-xs font-medium uppercase tracking-wide">Transfer out</p>
              <p className="text-ink-3 text-xs font-medium uppercase tracking-wide">Transfer in</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex-1 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-line animate-pulse" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-3 bg-line rounded animate-pulse w-3/4" />
                  <div className="h-2.5 bg-line rounded animate-pulse w-1/2" />
                </div>
              </div>
              <div className="w-6 text-center text-ink-3">→</div>
              <div className="flex-1 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-line animate-pulse" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-3 bg-line rounded animate-pulse w-3/4" />
                  <div className="h-2.5 bg-line rounded animate-pulse w-1/2" />
                </div>
              </div>
            </div>
            <div className="mt-5 pt-5 border-t border-line text-center">
              <p className="text-ink-3 text-xs">Coming in the next update</p>
            </div>
          </div>
        </Reveal>
      </div>
    </SectionWrap>
  )
}

// ── Public export ─────────────────────────────────────────────────────────────

export default function LandingSection() {
  return (
    <>
      <PitchSection />
      <ScoreSection />
      <TransferSection />
    </>
  )
}
