import { useMemo, useState } from "react"
import { motion, useReducedMotion } from "motion/react"
import type { SquadData, FplElement, FplTeam } from "../types"
import {
  analyseTransfers,
  hitCostFor,
  netDelta,
  type SingleSwap,
  type ComboSwap,
} from "../services/transfers"
import { Jersey, Crest } from "./FplImages"

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  return n.toFixed(1)
}

function price(cost: number): string {
  return `£${(cost / 10).toFixed(1)}m`
}

// ── Player chip (used in swap cards) ─────────────────────────────────────────

function PlayerChip({
  name,
  teamCode,
  teamShort,
  cost,
  pts,
  label,
}: {
  name: string
  teamCode: number
  teamShort: string
  cost: number
  pts: number
  label: "OUT" | "IN"
}) {
  const isOut = label === "OUT"
  return (
    <div className="flex items-center gap-2.5 min-w-0">
      <div className="relative shrink-0">
        <Jersey teamCode={teamCode} teamShortName={teamShort} isGK={false} size={40} />
        <span
          className={`absolute -top-1 -left-1 text-[8px] font-bold px-1 py-px rounded leading-none ${
            isOut
              ? "bg-hard text-white"
              : "bg-easy text-white"
          }`}
        >
          {label}
        </span>
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-ink text-sm truncate">{name}</span>
          <Crest teamCode={teamCode} shortName={teamShort} size={12} />
          <span className="text-ink-3 text-xs">{teamShort}</span>
        </div>
        <div className="text-ink-3 text-xs mt-px">
          {price(cost)} &bull;{" "}
          <span className="text-ink-2">{fmt(pts)} pts</span>
        </div>
      </div>
    </div>
  )
}

// ── Arrow between OUT and IN ──────────────────────────────────────────────────

function Arrow() {
  return (
    <div className="shrink-0 flex flex-col items-center self-center">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-ink-3">
        <path d="M5 12h14M12 5l7 7-7 7" />
      </svg>
    </div>
  )
}

// ── Delta badge ───────────────────────────────────────────────────────────────

function DeltaBadge({
  rawDelta,
  hitCost,
  compact = false,
}: {
  rawDelta: number
  hitCost: number
  compact?: boolean
}) {
  const net = rawDelta - hitCost
  const positive = net > 0

  return (
    <div className="shrink-0 text-right">
      <div
        className={positive ? "text-easy" : "text-hard"}
        style={{ fontFamily: "var(--font-rajdhani)", fontWeight: 700, fontSize: compact ? "20px" : "24px", lineHeight: 1 }}
      >
        {positive ? "+" : ""}{fmt(net)}
      </div>
      {hitCost > 0 ? (
        <div className="text-[10px] text-ink-3 mt-0.5 leading-tight">
          <span className="text-hard">-{hitCost} hit</span>
          {!compact && <><br />net pts</>}
        </div>
      ) : (
        <div className="text-ink-3 text-[10px] mt-0.5">pts</div>
      )}
    </div>
  )
}

// ── Single swap card ──────────────────────────────────────────────────────────

function SingleSwapCard({ swap, hitCost }: { swap: SingleSwap; hitCost: number }) {
  return (
    <div className="bg-surface border border-line rounded-xl p-5 hover:border-primary/25 transition-colors duration-150">
      <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
        <PlayerChip
          name={swap.outPick.element.web_name}
          teamCode={swap.outPick.team.code}
          teamShort={swap.outPick.team.short_name}
          cost={swap.outPick.element.now_cost}
          pts={swap.outPts}
          label="OUT"
        />
        <Arrow />
        <PlayerChip
          name={swap.inPlayer.web_name}
          teamCode={swap.inTeam.code}
          teamShort={swap.inTeam.short_name}
          cost={swap.inPlayer.now_cost}
          pts={swap.inPts}
          label="IN"
        />
        <div className="ml-auto pl-2">
          <DeltaBadge rawDelta={swap.pointDelta} hitCost={hitCost} />
        </div>
      </div>
    </div>
  )
}

// ── Combo card ────────────────────────────────────────────────────────────────

function ComboSwapCard({
  combo,
  hitCost,
}: {
  combo: ComboSwap
  hitCost: number
}) {
  const net = combo.totalPointDelta - hitCost
  const positive = net > 0

  return (
    <div className="border-l-4 border-primary rounded-r-xl bg-primary-subtle p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-primary text-[10px] font-bold tracking-wider uppercase">Best combo</span>
          {hitCost > 0 && (
            <span className="text-[9px] bg-hard-bg text-hard border border-hard/20 px-1.5 py-0.5 rounded font-semibold">
              -{hitCost} hit
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <span
            className={positive ? "text-easy" : "text-hard"}
            style={{ fontFamily: "var(--font-rajdhani)", fontWeight: 700, fontSize: "28px", lineHeight: 1 }}
          >
            {positive ? "+" : ""}{fmt(net)}
          </span>
          <span className="text-ink-3 text-xs self-end mb-0.5">pts total</span>
        </div>
      </div>

      {/* Two swaps stacked */}
      <div className="space-y-2">
        {[combo.swap1, combo.swap2].map((swap, i) => (
          <div key={i} className="flex items-center gap-2.5 bg-surface/70 rounded-lg px-3 py-2.5 flex-wrap sm:flex-nowrap">
            <PlayerChip
              name={swap.outPick.element.web_name}
              teamCode={swap.outPick.team.code}
              teamShort={swap.outPick.team.short_name}
              cost={swap.outPick.element.now_cost}
              pts={swap.outPts}
              label="OUT"
            />
            <Arrow />
            <PlayerChip
              name={swap.inPlayer.web_name}
              teamCode={swap.inTeam.code}
              teamShort={swap.inTeam.short_name}
              cost={swap.inPlayer.now_cost}
              pts={swap.inPts}
              label="IN"
            />
            <div className="ml-auto pl-2">
              <DeltaBadge rawDelta={swap.pointDelta} hitCost={0} compact />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center text-center py-10 px-5">
      <div className="w-12 h-12 rounded-xl bg-easy-bg flex items-center justify-center mb-4">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-easy">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      </div>
      <p className="text-ink font-semibold text-sm">{message}</p>
    </div>
  )
}

// ── Summary bar ───────────────────────────────────────────────────────────────

function SummaryBar({
  currentScore,
  bestFreeGain,
  freeTransfers,
}: {
  currentScore: number
  bestFreeGain: number | null
  freeTransfers: number
}) {
  const label = freeTransfers === 1 ? "1 free transfer" : `${freeTransfers} free transfers`

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 mb-5 text-sm">
      <span className="text-ink-2">
        Current predicted score:{" "}
        <span className="text-ink font-semibold" style={{ fontFamily: "var(--font-rajdhani)", fontWeight: 700, fontSize: "18px" }}>
          {fmt(currentScore)}
        </span>
      </span>
      {bestFreeGain !== null && bestFreeGain > 0 ? (
        <span className="text-ink-2">
          Best with {label}:{" "}
          <span style={{ fontFamily: "var(--font-rajdhani)", fontWeight: 700, fontSize: "18px" }}
            className="text-easy"
          >
            {fmt(currentScore + bestFreeGain)}
          </span>
          <span className="text-easy ml-1 text-xs font-semibold">+{fmt(bestFreeGain)}</span>
        </span>
      ) : (
        <span className="text-ink-3 text-xs">No free-transfer improvements found</span>
      )}
    </div>
  )
}

// ── Tab button ────────────────────────────────────────────────────────────────

function Tab({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors cursor-pointer ${
        active
          ? "bg-primary text-white"
          : "text-ink-2 hover:text-ink hover:bg-surface-2"
      }`}
    >
      {label}
    </button>
  )
}

// ── Staggered card list ───────────────────────────────────────────────────────

function CardList({
  combo,
  singles,
  hitCostFn,
  tabKey,
}: {
  combo: ComboSwap | null
  singles: { swap: SingleSwap; hitCost: number; net: number }[]
  hitCostFn: (numTransfers: number) => number
  tabKey: string
}) {
  const reduced = useReducedMotion()
  let idx = 0

  const wrap = (key: string | number, child: React.ReactNode) => {
    const i = idx++
    return (
      <motion.div
        key={key}
        initial={reduced ? {} : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
      >
        {child}
      </motion.div>
    )
  }

  return (
    <motion.div
      key={tabKey}
      className="space-y-3"
      initial={false}
      animate={{}}
    >
      {combo && wrap("combo", <ComboSwapCard combo={combo} hitCost={hitCostFn(2)} />)}
      {singles.map((x, i) =>
        wrap(`single-${i}`, <SingleSwapCard swap={x.swap} hitCost={x.hitCost} />)
      )}
    </motion.div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function TransferSuggestions({
  squadData,
  freeTransfers,
}: {
  squadData: SquadData
  freeTransfers: number
}) {
  const [activeTab, setActiveTab] = useState<"free" | "hits">("free")

  const allSquad = [...squadData.startingXI, ...squadData.bench]

  const analysis = useMemo(
    () => analyseTransfers(allSquad, squadData.allPlayers, squadData.allTeams, squadData.bank),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [squadData.bank, squadData.allPlayers, squadData.allTeams, allSquad.map(ep => ep.element.id).join(",")],
  )

  // Singles classified
  const freeSingles = analysis.singles.filter(() => 1 <= freeTransfers)
  const hitSingles = analysis.singles
    .map(s => ({ swap: s, hitCost: hitCostFor(1, freeTransfers), net: netDelta(s.pointDelta, 1, freeTransfers) }))
    .filter(x => x.net > 0 && x.hitCost > 0)

  // Combo classified
  const comboHit = hitCostFor(2, freeTransfers)
  const comboNet = analysis.bestCombo ? analysis.bestCombo.totalPointDelta - comboHit : 0
  const comboIsFree = 2 <= freeTransfers
  const comboIsWorthIt = analysis.bestCombo && comboNet > 0

  // Best free gain (for summary)
  const bestFreeGain: number | null = (() => {
    const options: number[] = []
    if (freeSingles.length > 0) options.push(freeSingles[0].pointDelta)
    if (comboIsFree && analysis.bestCombo) options.push(analysis.bestCombo.totalPointDelta)
    return options.length > 0 ? Math.max(...options) : null
  })()

  // Determine if there's anything to show in each tab
  const hasFreeContent = freeSingles.length > 0 || (comboIsFree && comboIsWorthIt)
  const hasHitContent = hitSingles.length > 0 || (!comboIsFree && comboIsWorthIt)
  const hasAnything = hasFreeContent || hasHitContent

  return (
    <section className="max-w-5xl mx-auto px-5 pb-20">
      {/* Section header */}
      <div className="flex items-center gap-3 mb-6">
        <span
          className="text-ink"
          style={{ fontFamily: "var(--font-rajdhani)", fontWeight: 700, fontSize: "22px" }}
        >
          Suggested transfers
        </span>
        <div className="flex-1 h-px bg-line" />
        <span className="text-ink-3 text-xs">
          {price(squadData.bank)} in bank
        </span>
      </div>

      <SummaryBar
        currentScore={squadData.predictedScore}
        bestFreeGain={bestFreeGain}
        freeTransfers={freeTransfers}
      />

      {!hasAnything ? (
        <EmptyState message="Your squad is well-optimised for this gameweek — no beneficial transfers found." />
      ) : (
        <>
          {/* Tabs */}
          <div className="flex gap-1 bg-surface-2 border border-line rounded-xl p-1 w-fit mb-6">
            <Tab label="Free transfers" active={activeTab === "free"} onClick={() => setActiveTab("free")} />
            <Tab label="Including hits" active={activeTab === "hits"} onClick={() => setActiveTab("hits")} />
          </div>

          {/* Free transfers tab */}
          {activeTab === "free" && (
            !hasFreeContent ? (
              <EmptyState message="No beneficial swaps within your free transfer allowance. Check 'Including hits'." />
            ) : (
              <CardList
                key="free"
                tabKey="free"
                combo={comboIsFree && comboIsWorthIt ? analysis.bestCombo : null}
                singles={freeSingles.map(s => ({ swap: s, hitCost: 0, net: s.pointDelta }))}
                hitCostFn={() => 0}
              />
            )
          )}

          {/* Including hits tab */}
          {activeTab === "hits" && (
            !hasHitContent ? (
              <EmptyState message="No additional improvements found beyond your free transfers." />
            ) : (
              <CardList
                key="hits"
                tabKey="hits"
                combo={!comboIsFree && comboIsWorthIt ? analysis.bestCombo : null}
                singles={hitSingles.sort((a, b) => b.net - a.net)}
                hitCostFn={n => hitCostFor(n, freeTransfers)}
              />
            )
          )}
        </>
      )}
    </section>
  )
}
