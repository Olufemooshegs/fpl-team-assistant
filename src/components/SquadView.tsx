import type { EnrichedPick, SquadData } from "../types"

const POS_META = {
  1: {
    label: "GK",
    textColor: "text-amber-400",
    bgColor: "bg-amber-400/10",
    rowLabel: "Goalkeeper",
  },
  2: {
    label: "DEF",
    textColor: "text-sky-400",
    bgColor: "bg-sky-400/10",
    rowLabel: "Defenders",
  },
  3: {
    label: "MID",
    textColor: "text-emerald-400",
    bgColor: "bg-emerald-400/10",
    rowLabel: "Midfielders",
  },
  4: {
    label: "FWD",
    textColor: "text-rose-400",
    bgColor: "bg-rose-400/10",
    rowLabel: "Forwards",
  },
} as const

type ElemType = keyof typeof POS_META

function diffStyle(d: number): { text: string; bg: string; label: string } {
  if (d <= 2) return { text: "text-fpl-green", bg: "bg-fpl-green/10", label: "Easy" }
  if (d === 3) return { text: "text-amber-400", bg: "bg-amber-400/10", label: "Mid" }
  if (d === 4) return { text: "text-rose-400", bg: "bg-rose-400/10", label: "Hard" }
  return { text: "text-red-500", bg: "bg-red-500/10", label: "V.Hard" }
}

function PlayerCard({ ep, compact = false }: { ep: EnrichedPick; compact?: boolean }) {
  const { pick, element, team, prediction, nextFixture } = ep
  const pos = POS_META[element.element_type as ElemType]
  const price = `£${(element.now_cost / 10).toFixed(1)}m`
  // effective pts displayed on card = predicted × multiplier (doubles for captain)
  const displayPts = prediction.predictedPoints * Math.max(pick.multiplier, 1)
  const diff = nextFixture ? diffStyle(nextFixture.difficulty) : null

  return (
    <div
      className={`relative flex flex-col items-center rounded-xl border transition-all select-none
        ${compact
          ? "p-2 w-[96px] bg-navy-card border-navy-border/40"
          : "p-3 w-[118px] bg-navy-elevated border-navy-border hover:border-navy-border/80"}
        ${pick.is_captain || pick.is_vice_captain ? "ring-1 ring-fpl-green/50" : ""}
      `}
    >
      {/* Captain / VC badge */}
      {(pick.is_captain || pick.is_vice_captain) && (
        <span
          className={`absolute -top-2.5 -right-2.5 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold shadow
            ${pick.is_captain
              ? "bg-fpl-green text-fpl-purple"
              : "bg-navy-border text-text-secondary border border-navy-elevated"}`}
        >
          {pick.is_captain ? "C" : "VC"}
        </span>
      )}

      {/* Position pill */}
      {pos && (
        <span
          className={`px-1.5 py-0.5 rounded text-[9px] font-bold tracking-widest mb-1.5 ${pos.textColor} ${pos.bgColor}`}
        >
          {pos.label}
        </span>
      )}

      {/* Player name */}
      <p
        className="text-white font-semibold text-center leading-tight mb-0.5 w-full truncate text-[11px] px-0.5"
        title={`${element.first_name} ${element.second_name}`}
      >
        {element.web_name}
      </p>

      {/* Club */}
      <p className="text-text-muted text-[9px] mb-2">{team.short_name}</p>

      {/* Predicted pts (large) */}
      <div className="text-center mb-0.5">
        <span
          className={`font-bold leading-none ${compact ? "text-xl text-text-secondary" : "text-[26px] text-white"}`}
          style={{ fontFamily: "var(--font-rajdhani)" }}
        >
          {displayPts.toFixed(1)}
        </span>
        {pick.multiplier > 1 && (
          <div className="text-[8px] text-fpl-green leading-tight mt-0.5">
            {prediction.predictedPoints.toFixed(1)} &times;{pick.multiplier}
          </div>
        )}
      </div>
      <p className="text-[8px] text-text-muted mb-1.5">pred. pts</p>

      {/* FPL ep_next */}
      {prediction.epNext !== null && (
        <p className="text-[8px] text-text-muted mb-2">
          FPL: <span className="text-text-secondary">{prediction.epNext.toFixed(1)}</span>
        </p>
      )}

      {/* Next fixture */}
      {nextFixture && diff ? (
        <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-semibold ${diff.text} ${diff.bg}`}>
          {nextFixture.isHome ? "" : "@"}{nextFixture.opponentShortName}
        </span>
      ) : (
        <span className="text-[9px] text-text-muted italic">BGW</span>
      )}

      {/* Price */}
      <p className="text-[8px] text-text-muted mt-1.5">{price}</p>
    </div>
  )
}

function PositionRow({ picks, label }: { picks: EnrichedPick[]; label: string }) {
  if (picks.length === 0) return null
  return (
    <div className="flex flex-col items-center gap-2.5 mb-6">
      <span className="text-[10px] font-semibold tracking-widest uppercase text-text-muted">
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

const TARGET_SCORE = 80

function ScoreBanner({ predictedScore, gameweek }: { predictedScore: number; gameweek: number }) {
  const gap = predictedScore - TARGET_SCORE
  const above = gap >= 0
  // bar fills on a 0-100 scale; 80pt target is the visual marker at 80%
  const barPct = Math.min((predictedScore / 100) * 100, 100)

  return (
    <div className="bg-navy-card border border-navy-border rounded-2xl p-6 mb-8">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-5">
        <div>
          <p className="text-text-muted text-[10px] uppercase tracking-widest mb-1">
            GW{gameweek} Predicted Score
          </p>
          <div
            className="text-6xl text-white leading-none"
            style={{ fontFamily: "var(--font-rajdhani)", fontWeight: 700 }}
          >
            {predictedScore.toFixed(1)}
          </div>
          <p className="text-text-muted text-sm mt-1">starting XI projected points</p>
        </div>

        <div
          className={`self-start px-4 py-2.5 rounded-xl border text-sm font-semibold whitespace-nowrap
            ${above
              ? "bg-fpl-green/10 text-fpl-green border-fpl-green/25"
              : "bg-orange-500/10 text-orange-400 border-orange-500/25"}`}
        >
          {above ? "+" : ""}{gap.toFixed(1)} vs 80pt target
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex justify-between text-[10px] text-text-muted mb-1.5">
          <span>0</span>
          <span className="text-text-secondary font-medium">80pt target</span>
          <span>100</span>
        </div>
        <div className="relative h-3 bg-navy-elevated rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${above ? "bg-fpl-green" : "bg-orange-500"}`}
            style={{ width: `${barPct}%` }}
          />
          {/* 80pt marker line */}
          <div
            className="absolute top-0 bottom-0 w-px border-r border-dashed border-text-muted/50"
            style={{ left: "80%" }}
          />
        </div>
      </div>

      <p className={`text-xs font-medium ${above ? "text-fpl-green" : "text-orange-400"}`}>
        {above
          ? `${gap.toFixed(1)} points above the 80-point target`
          : `${Math.abs(gap).toFixed(1)} points below target — transfer suggestions coming next`}
      </p>
    </div>
  )
}

export default function SquadView({ squadData }: { squadData: SquadData }) {
  const { gameweek, startingXI, bench, predictedScore } = squadData

  const gk = startingXI.filter(ep => ep.element.element_type === 1)
  const def = startingXI.filter(ep => ep.element.element_type === 2)
  const mid = startingXI.filter(ep => ep.element.element_type === 3)
  const fwd = startingXI.filter(ep => ep.element.element_type === 4)

  return (
    <section className="max-w-5xl mx-auto px-6 pb-24">
      <ScoreBanner predictedScore={predictedScore} gameweek={gameweek} />

      {/* Starting XI */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <h2
            className="text-lg text-white"
            style={{ fontFamily: "var(--font-rajdhani)", fontWeight: 700 }}
          >
            STARTING XI
          </h2>
          <div className="h-px flex-1 bg-navy-border" />
          <span className="text-text-muted text-xs">{startingXI.length} players</span>
        </div>
        <div className="bg-navy-card border border-navy-border rounded-2xl p-5 sm:p-8">
          <PositionRow picks={gk} label="Goalkeeper" />
          <PositionRow picks={def} label="Defenders" />
          <PositionRow picks={mid} label="Midfielders" />
          <PositionRow picks={fwd} label="Forwards" />
        </div>
      </div>

      {/* Bench */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <h2
            className="text-base text-text-secondary"
            style={{ fontFamily: "var(--font-rajdhani)", fontWeight: 700 }}
          >
            BENCH
          </h2>
          <div className="h-px flex-1 bg-navy-border/40" />
          <span className="text-text-muted text-xs">{bench.length} players</span>
        </div>
        <div className="bg-navy-card/40 border border-navy-border/40 rounded-2xl p-4 sm:p-6">
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
