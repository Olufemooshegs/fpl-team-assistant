import type { EnrichedPick, SquadData } from "../types"

// Position metadata — uses themed CSS-var Tailwind utilities (auto-switch light/dark)
const POS_META = {
  1: { label: "GK",  textClass: "text-pos-gk-text",  bgClass: "bg-pos-gk-bg",  rowLabel: "Goalkeeper" },
  2: { label: "DEF", textClass: "text-pos-def-text", bgClass: "bg-pos-def-bg", rowLabel: "Defenders" },
  3: { label: "MID", textClass: "text-pos-mid-text", bgClass: "bg-pos-mid-bg", rowLabel: "Midfielders" },
  4: { label: "FWD", textClass: "text-pos-fwd-text", bgClass: "bg-pos-fwd-bg", rowLabel: "Forwards" },
} as const

type ElemType = keyof typeof POS_META

function diffClasses(d: number): string {
  if (d <= 2) return "text-diff-easy-text bg-diff-easy-bg"
  if (d === 3) return "text-diff-mid-text bg-diff-mid-bg"
  return "text-diff-hard-text bg-diff-hard-bg"
}

// ── Player Card ───────────────────────────────────────────────────────────────

function PlayerCard({ ep, compact = false }: { ep: EnrichedPick; compact?: boolean }) {
  const { pick, element, team, prediction, nextFixture } = ep
  const pos = POS_META[element.element_type as ElemType]
  const price = `£${(element.now_cost / 10).toFixed(1)}m`
  const displayPts = prediction.predictedPoints * Math.max(pick.multiplier, 1)

  return (
    <div
      className={`relative flex flex-col items-center rounded-xl border border-app-border transition-all select-none
        ${compact
          ? "p-2 w-[96px] bg-surface-elevated"
          : "p-3 w-[118px] bg-surface-card shadow-card"
        }
        ${pick.is_captain || pick.is_vice_captain ? "ring-2 ring-accent/30" : ""}
      `}
    >
      {/* Captain / VC badge */}
      {(pick.is_captain || pick.is_vice_captain) && (
        <span
          className={`absolute -top-2.5 -right-2.5 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold shadow-sm
            ${pick.is_captain
              ? "bg-accent text-accent-fg"
              : "bg-surface-elevated text-ink-secondary border border-app-border-strong"}`}
        >
          {pick.is_captain ? "C" : "VC"}
        </span>
      )}

      {/* Position pill */}
      {pos && (
        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold tracking-widest mb-1.5 ${pos.textClass} ${pos.bgClass}`}>
          {pos.label}
        </span>
      )}

      {/* Player name */}
      <p
        className="text-ink font-semibold text-center leading-tight mb-0.5 w-full truncate text-[11px] px-0.5"
        title={`${element.first_name} ${element.second_name}`}
      >
        {element.web_name}
      </p>

      {/* Club */}
      <p className="text-ink-muted text-[9px] mb-2">{team.short_name}</p>

      {/* Predicted points */}
      <div className="text-center mb-0.5">
        <span
          className={`font-bold leading-none ${compact ? "text-xl text-ink-secondary" : "text-[26px] text-ink"}`}
          style={{ fontFamily: "var(--font-rajdhani)" }}
        >
          {displayPts.toFixed(1)}
        </span>
        {pick.multiplier > 1 && (
          <div className="text-[8px] text-accent leading-tight mt-0.5">
            {prediction.predictedPoints.toFixed(1)} &times;{pick.multiplier}
          </div>
        )}
      </div>
      <p className="text-[8px] text-ink-muted mb-1.5">pred. pts</p>

      {/* FPL ep_next */}
      {prediction.epNext !== null && (
        <p className="text-[8px] text-ink-muted mb-2">
          FPL: <span className="text-ink-secondary">{prediction.epNext.toFixed(1)}</span>
        </p>
      )}

      {/* Next fixture */}
      {nextFixture ? (
        <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-semibold ${diffClasses(nextFixture.difficulty)}`}>
          {nextFixture.isHome ? "" : "@"}{nextFixture.opponentShortName}
        </span>
      ) : (
        <span className="text-[9px] text-ink-muted italic">BGW</span>
      )}

      {/* Price */}
      <p className="text-[8px] text-ink-muted mt-1.5">{price}</p>
    </div>
  )
}

// ── Position row ──────────────────────────────────────────────────────────────

function PositionRow({ picks, label }: { picks: EnrichedPick[]; label: string }) {
  if (picks.length === 0) return null
  return (
    <div className="flex flex-col items-center gap-2.5 mb-6">
      <span className="text-[10px] font-semibold tracking-widest uppercase text-ink-muted">
        {label}
      </span>
      <div className="flex gap-2 flex-wrap justify-center">
        {picks.map(ep => (
          <PlayerCard key={ep.pick.element} ep={ep} />
        ))}
      </div>
    </div>
  )
}

// ── Score Banner ──────────────────────────────────────────────────────────────

const TARGET = 80

function ScoreBanner({ predictedScore, gameweek }: { predictedScore: number; gameweek: number }) {
  const gap = predictedScore - TARGET
  const above = gap >= 0
  const barPct = Math.min((predictedScore / 100) * 100, 100)

  return (
    <div className="bg-surface-card shadow-card border border-app-border rounded-2xl p-6 mb-8">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-5">
        <div>
          <p className="text-ink-muted text-[10px] uppercase tracking-widest mb-1">
            GW{gameweek} Predicted Score
          </p>
          <div
            className="text-[60px] text-ink leading-none"
            style={{ fontFamily: "var(--font-rajdhani)", fontWeight: 700 }}
          >
            {predictedScore.toFixed(1)}
          </div>
          <p className="text-ink-muted text-sm mt-0.5">starting XI projected points</p>
        </div>

        <div
          className={`self-start flex items-center gap-1.5 px-4 py-2.5 rounded-xl border text-sm font-semibold whitespace-nowrap
            ${above
              ? "bg-positive-subtle text-positive-fg border-positive/20"
              : "bg-warning-subtle text-warning border-warning/25"}`}
        >
          {above ? (
            <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 17a.75.75 0 01-.75-.75V5.612L5.29 9.77a.75.75 0 01-1.08-1.04l5.25-5.5a.75.75 0 011.08 0l5.25 5.5a.75.75 0 11-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0110 17z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a.75.75 0 01.75.75v10.638l3.96-4.158a.75.75 0 111.08 1.04l-5.25 5.5a.75.75 0 01-1.08 0l-5.25-5.5a.75.75 0 111.08-1.04l3.96 4.158V3.75A.75.75 0 0110 3z" clipRule="evenodd" />
            </svg>
          )}
          {above ? "+" : ""}{gap.toFixed(1)} vs 80pt target
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex justify-between text-[10px] text-ink-muted mb-1.5">
          <span>0</span>
          <span className="text-ink-secondary font-medium">80pt target</span>
          <span>100</span>
        </div>
        <div className="relative h-2.5 bg-surface-elevated rounded-full overflow-hidden border border-app-border">
          <div
            className={`h-full rounded-full transition-all duration-700 ${above ? "bg-positive" : "bg-warning"}`}
            style={{ width: `${barPct}%` }}
          />
          {/* 80pt target marker */}
          <div
            className="absolute top-0 bottom-0 w-px"
            style={{ left: "80%", background: "var(--c-border-strong)" }}
          />
        </div>
      </div>

      <p className={`text-xs font-medium ${above ? "text-positive-fg" : "text-warning"}`}>
        {above
          ? `${gap.toFixed(1)} pts above the 80-point target`
          : `${Math.abs(gap).toFixed(1)} pts below target — transfer suggestions coming next`}
      </p>
    </div>
  )
}

// ── Squad View ────────────────────────────────────────────────────────────────

export default function SquadView({ squadData }: { squadData: SquadData }) {
  const { gameweek, startingXI, bench, predictedScore } = squadData

  const gk  = startingXI.filter(ep => ep.element.element_type === 1)
  const def = startingXI.filter(ep => ep.element.element_type === 2)
  const mid = startingXI.filter(ep => ep.element.element_type === 3)
  const fwd = startingXI.filter(ep => ep.element.element_type === 4)

  return (
    <section className="max-w-5xl mx-auto px-5 pb-24">
      <ScoreBanner predictedScore={predictedScore} gameweek={gameweek} />

      {/* Starting XI */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <h2
            className="text-base font-semibold text-ink"
            style={{ fontFamily: "var(--font-rajdhani)", fontWeight: 700, fontSize: "17px" }}
          >
            STARTING XI
          </h2>
          <div className="h-px flex-1 bg-app-border" />
          <span className="text-ink-muted text-xs">{startingXI.length} players</span>
        </div>
        <div className="bg-surface-card shadow-card border border-app-border rounded-2xl p-5 sm:p-8">
          <PositionRow picks={gk}  label="Goalkeeper" />
          <PositionRow picks={def} label="Defenders" />
          <PositionRow picks={mid} label="Midfielders" />
          <PositionRow picks={fwd} label="Forwards" />
        </div>
      </div>

      {/* Bench */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <h2
            className="text-ink-secondary"
            style={{ fontFamily: "var(--font-rajdhani)", fontWeight: 700, fontSize: "15px" }}
          >
            BENCH
          </h2>
          <div className="h-px flex-1 bg-app-border" />
          <span className="text-ink-muted text-xs">{bench.length} players</span>
        </div>
        <div className="bg-surface-elevated border border-app-border rounded-2xl p-4 sm:p-6">
          <div className="flex gap-2.5 flex-wrap justify-center">
            {bench.map(ep => (
              <PlayerCard key={ep.pick.element} ep={ep} compact />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
