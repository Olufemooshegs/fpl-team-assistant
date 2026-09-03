import type { EnrichedPick, SquadData } from "../types"
import { Jersey, Crest } from "./FplImages"

// ── Constants ─────────────────────────────────────────────────────────────────

const POSITION_COLOR: Record<number, string> = {
  1: "#D97706", // GK — amber
  2: "#2454FF", // DEF — primary blue
  3: "#16A34A", // MID — green
  4: "#DC2626", // FWD — red
}

const POS_META = {
  1: { label: "GK",  textClass: "text-pos-gk-text",  bgClass: "bg-pos-gk-bg",  rowLabel: "Goalkeeper" },
  2: { label: "DEF", textClass: "text-pos-def-text", bgClass: "bg-pos-def-bg", rowLabel: "Defenders" },
  3: { label: "MID", textClass: "text-pos-mid-text", bgClass: "bg-pos-mid-bg", rowLabel: "Midfielders" },
  4: { label: "FWD", textClass: "text-pos-fwd-text", bgClass: "bg-pos-fwd-bg", rowLabel: "Forwards" },
} as const

type ElemType = keyof typeof POS_META

function diffClass(d: number): string {
  if (d <= 2) return "text-easy bg-easy-bg"
  if (d === 3) return "text-mid bg-mid-bg"
  return "text-hard bg-hard-bg"
}

// ── Score Banner ──────────────────────────────────────────────────────────────

const TARGET = 80

function ScoreBanner({ predictedScore, gameweek }: { predictedScore: number; gameweek: number }) {
  const gap = predictedScore - TARGET
  const above = gap >= 0
  const barPct = Math.min((predictedScore / 100) * 100, 100)

  return (
    <div className="border-l-4 border-primary rounded-r-xl mb-8 bg-primary-subtle">
      <div className="px-6 py-5">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <p className="text-ink-3 text-[10px] font-medium tracking-wider uppercase mb-1">
              GW{gameweek} predicted score
            </p>
            <div
              className="text-ink leading-none"
              style={{ fontFamily: "var(--font-rajdhani)", fontWeight: 700, fontSize: "72px" }}
            >
              {predictedScore.toFixed(1)}
            </div>
            <p className="text-ink-3 text-xs mt-1">starting XI projected points</p>
          </div>

          <div className="sm:text-right">
            <div
              className={above ? "text-easy" : "text-mid"}
              style={{ fontFamily: "var(--font-rajdhani)", fontWeight: 700, fontSize: "28px", lineHeight: 1 }}
            >
              {above ? "+" : ""}{gap.toFixed(1)}
            </div>
            <p className="text-ink-3 text-xs mt-0.5">vs 80pt target</p>
          </div>
        </div>

        <div className="mt-5">
          <div className="relative h-1.5 bg-line rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${above ? "bg-easy" : "bg-mid"}`}
              style={{ width: `${barPct}%` }}
            />
            <div
              className="absolute top-0 bottom-0 w-px bg-ink-3/30"
              style={{ left: "80%" }}
            />
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

// ── Section divider ───────────────────────────────────────────────────────────

function SectionDivider({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="text-ink-3 text-xs font-medium">{label}</span>
      <div className="flex-1 h-px bg-line" />
      <span className="text-ink-3 text-xs">{count} players</span>
    </div>
  )
}

// ── Fixture badge — crest + colored short name ────────────────────────────────

function FixtureBadge({
  fixture,
  crestSize = 12,
  textSize = "text-[9px]",
}: {
  fixture: { opponentCode: number; opponentShortName: string; isHome: boolean; difficulty: number } | null
  crestSize?: number
  textSize?: string
}) {
  if (!fixture) return <span className={`${textSize} text-ink-3 italic`}>BGW</span>

  const homeAway = fixture.isHome ? "(H)" : "(A)"
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded ${diffClass(fixture.difficulty)}`}>
      <Crest teamCode={fixture.opponentCode} shortName={fixture.opponentShortName} size={crestSize} />
      <span className={`${textSize} font-semibold leading-none`}>
        {fixture.opponentShortName} {homeAway}
      </span>
    </span>
  )
}

// ── Pitch lines ───────────────────────────────────────────────────────────────

function PitchLines() {
  const lineStyle = { borderColor: "var(--c-pitch-line)" } as React.CSSProperties
  return (
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute top-1/2 left-8 right-8 h-px" style={{ background: "var(--c-pitch-line)" }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full border" style={lineStyle} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full" style={{ background: "var(--c-pitch-line)" }} />
      <div className="absolute top-6 left-1/2 -translate-x-1/2 w-40 h-14 rounded-b-lg border border-t-0" style={lineStyle} />
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-40 h-14 rounded-t-lg border border-b-0" style={lineStyle} />
    </div>
  )
}

// ── Pitch card (desktop formation view) ───────────────────────────────────────

function PitchCard({ ep }: { ep: EnrichedPick }) {
  const { pick, element, team, prediction, nextFixture } = ep
  const displayPts = prediction.predictedPoints * Math.max(pick.multiplier, 1)
  const stripColor = POSITION_COLOR[element.element_type] ?? "#94A3B8"
  const isGK = element.element_type === 1
  const isCap = pick.is_captain
  const isVc = pick.is_vice_captain

  return (
    <div className="relative flex flex-col items-center w-24 sm:w-[100px]">
      <div
        className="w-full rounded-lg overflow-hidden"
        style={{ background: "var(--c-pitch-card)" }}
      >
        {/* Position color strip */}
        <div className="h-[3px] w-full" style={{ background: stripColor }} />

        <div className="p-2 flex flex-col items-center text-center gap-1">
          {/* Jersey with C/VC overlay */}
          <div className="relative">
            <Jersey
              teamCode={team.code}
              teamShortName={team.short_name}
              isGK={isGK}
              size={52}
            />
            {(isCap || isVc) && (
              <div
                className={`absolute -top-1 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white border border-white/40 ${
                  isCap ? "bg-primary" : "bg-ink-2"
                }`}
              >
                {isCap ? "C" : "VC"}
              </div>
            )}
          </div>

          {/* Name */}
          <p
            className="text-[11px] font-semibold truncate w-full leading-tight"
            style={{ color: "var(--c-pitch-ink)" }}
            title={`${element.first_name} ${element.second_name}`}
          >
            {element.web_name}
          </p>

          {/* Predicted pts */}
          <div
            className="leading-none"
            style={{
              fontFamily: "var(--font-rajdhani)",
              fontWeight: 700,
              fontSize: "22px",
              color: "var(--c-pitch-ink)",
            }}
          >
            {displayPts.toFixed(1)}
          </div>

          {/* Multiplier hint */}
          {pick.multiplier > 1 && (
            <p className="text-[8px] -mt-0.5" style={{ color: "var(--c-primary)" }}>
              {prediction.predictedPoints.toFixed(1)}&times;{pick.multiplier}
            </p>
          )}

          {/* Fixture */}
          <FixtureBadge fixture={nextFixture} crestSize={12} textSize="text-[9px]" />
        </div>
      </div>
    </div>
  )
}

// ── Pitch row ─────────────────────────────────────────────────────────────────

function PitchRow({ picks }: { picks: EnrichedPick[] }) {
  if (picks.length === 0) return null
  return (
    <div className="flex justify-center gap-2 sm:gap-2.5">
      {picks.map(ep => (
        <PitchCard key={ep.pick.element} ep={ep} />
      ))}
    </div>
  )
}

// ── Pitch formation (desktop ≥ sm) ────────────────────────────────────────────

function PitchFormation({ startingXI }: { startingXI: EnrichedPick[] }) {
  const gk  = startingXI.filter(ep => ep.element.element_type === 1)
  const def = startingXI.filter(ep => ep.element.element_type === 2)
  const mid = startingXI.filter(ep => ep.element.element_type === 3)
  const fwd = startingXI.filter(ep => ep.element.element_type === 4)

  return (
    <div
      className="relative rounded-xl overflow-hidden"
      style={{ background: "var(--c-pitch-gradient)" }}
    >
      <PitchLines />
      <div className="relative z-10 flex flex-col gap-6 py-10 px-4">
        <PitchRow picks={fwd} />
        <PitchRow picks={mid} />
        <PitchRow picks={def} />
        <PitchRow picks={gk} />
      </div>
    </div>
  )
}

// ── List card (mobile) ────────────────────────────────────────────────────────

function ListCard({ ep }: { ep: EnrichedPick }) {
  const { pick, element, team, prediction, nextFixture } = ep
  const displayPts = prediction.predictedPoints * Math.max(pick.multiplier, 1)
  const stripColor = POSITION_COLOR[element.element_type] ?? "#94A3B8"
  const isCap = pick.is_captain
  const isVc = pick.is_vice_captain

  return (
    <div className="flex items-center gap-3 bg-surface border border-line rounded-xl p-3 min-h-[56px]">
      {/* Position color strip */}
      <div className="w-1 self-stretch rounded-full shrink-0" style={{ background: stripColor }} />

      {/* Player info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-ink text-sm truncate">{element.web_name}</span>
          {isCap && (
            <span className="w-[18px] h-[18px] rounded-full bg-primary text-white text-[8px] font-bold flex items-center justify-center shrink-0">
              C
            </span>
          )}
          {isVc && (
            <span className="w-[18px] h-[18px] rounded-full bg-surface-2 text-ink-2 text-[8px] font-bold flex items-center justify-center shrink-0 border border-line">
              VC
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
          {/* Own team */}
          <Crest teamCode={team.code} shortName={team.short_name} size={14} />
          <span className="text-ink-3 text-xs">{team.short_name}</span>
          <span className="text-ink-3 text-xs">&bull;</span>
          <span className="text-ink-3 text-xs">£{(element.now_cost / 10).toFixed(1)}m</span>

          {/* Fixture */}
          {nextFixture && (
            <>
              <span className="text-ink-3 text-xs">&bull;</span>
              <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded ${diffClass(nextFixture.difficulty)}`}>
                <Crest teamCode={nextFixture.opponentCode} shortName={nextFixture.opponentShortName} size={12} />
                {nextFixture.isHome ? "" : "@"}{nextFixture.opponentShortName}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Score */}
      <div className="text-right shrink-0">
        <div
          className="text-ink leading-none"
          style={{ fontFamily: "var(--font-rajdhani)", fontWeight: 700, fontSize: "26px" }}
        >
          {displayPts.toFixed(1)}
        </div>
        {pick.multiplier > 1 && (
          <div className="text-primary text-[9px] mt-0.5">
            {prediction.predictedPoints.toFixed(1)}&times;{pick.multiplier}
          </div>
        )}
        {prediction.epNext !== null && (
          <div className="text-ink-3 text-[10px] mt-0.5">FPL {prediction.epNext.toFixed(1)}</div>
        )}
      </div>
    </div>
  )
}

// ── Mobile list view (below sm) ───────────────────────────────────────────────

const POSITION_GROUPS = [
  { type: 1, label: "Goalkeeper" },
  { type: 2, label: "Defenders" },
  { type: 3, label: "Midfielders" },
  { type: 4, label: "Forwards" },
] as const

function MobileListView({ startingXI }: { startingXI: EnrichedPick[] }) {
  return (
    <div className="space-y-6">
      {POSITION_GROUPS.map(({ type, label }) => {
        const picks = startingXI.filter(ep => ep.element.element_type === type)
        if (picks.length === 0) return null
        return (
          <div key={type}>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-ink-3 text-xs font-medium">{label}</span>
              <div className="flex-1 h-px bg-line" />
            </div>
            <div className="space-y-2">
              {picks.map(ep => (
                <ListCard key={ep.pick.element} ep={ep} />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Bench card ────────────────────────────────────────────────────────────────

function BenchCard({ ep }: { ep: EnrichedPick }) {
  const { pick, element, team, prediction, nextFixture } = ep
  const pos = POS_META[element.element_type as ElemType]
  const stripColor = POSITION_COLOR[element.element_type] ?? "#94A3B8"
  const isGK = element.element_type === 1

  return (
    <div className="flex-shrink-0 w-24 flex flex-col items-center opacity-70">
      <div className="w-full rounded-lg overflow-hidden bg-surface-2 border border-line">
        <div className="h-[3px] w-full" style={{ background: stripColor }} />
        <div className="p-1.5 flex flex-col items-center text-center gap-1">
          {/* Position pill */}
          {pos && (
            <span className={`text-[8px] font-bold px-1 py-0.5 rounded ${pos.textClass} ${pos.bgClass}`}>
              {pos.label}
            </span>
          )}

          {/* Jersey */}
          <Jersey
            teamCode={team.code}
            teamShortName={team.short_name}
            isGK={isGK}
            size={36}
          />

          {/* Name */}
          <p
            className="text-ink text-[10px] font-semibold truncate w-full leading-tight"
            title={`${element.first_name} ${element.second_name}`}
          >
            {element.web_name}
          </p>

          {/* Score */}
          <div
            className="text-ink-2 leading-none"
            style={{ fontFamily: "var(--font-rajdhani)", fontWeight: 700, fontSize: "18px" }}
          >
            {prediction.predictedPoints.toFixed(1)}
          </div>

          {/* Fixture */}
          {nextFixture ? (
            <span className={`inline-flex items-center gap-0.5 text-[8px] font-semibold px-1 py-0.5 rounded ${diffClass(nextFixture.difficulty)}`}>
              <Crest teamCode={nextFixture.opponentCode} shortName={nextFixture.opponentShortName} size={10} />
              {nextFixture.isHome ? "" : "@"}{nextFixture.opponentShortName}
            </span>
          ) : (
            <span className="text-[8px] text-ink-3 italic">BGW</span>
          )}

          {/* Own team crest */}
          <div className="flex items-center gap-1 mt-0.5">
            <Crest teamCode={team.code} shortName={team.short_name} size={12} />
            <span className="text-ink-3 text-[9px]">{team.short_name}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Squad View ────────────────────────────────────────────────────────────────

export default function SquadView({ squadData }: { squadData: SquadData }) {
  const { gameweek, startingXI, bench, predictedScore } = squadData

  return (
    <section className="max-w-5xl mx-auto px-5 pb-24">
      <ScoreBanner predictedScore={predictedScore} gameweek={gameweek} />

      {/* Starting XI */}
      <div className="mb-8">
        <SectionDivider label="Starting XI" count={startingXI.length} />

        {/* Desktop: pitch formation */}
        <div className="hidden sm:block">
          <PitchFormation startingXI={startingXI} />
        </div>

        {/* Mobile: grouped vertical list */}
        <div className="block sm:hidden">
          <MobileListView startingXI={startingXI} />
        </div>
      </div>

      {/* Bench */}
      <div>
        <SectionDivider label="Bench" count={bench.length} />
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-5 px-5 sm:mx-0 sm:px-0 sm:flex-wrap sm:justify-center">
          {bench.map(ep => (
            <BenchCard key={ep.pick.element} ep={ep} />
          ))}
        </div>
      </div>
    </section>
  )
}
