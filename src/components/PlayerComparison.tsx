import { useState, useMemo } from "react"
import { motion, useReducedMotion } from "motion/react"
import type { SquadData, FplElement, FplTeam, EnrichedPick } from "../types"
import type { SingleSwap } from "../services/transfers"
import { Jersey, Crest } from "./FplImages"

const POS_NAMES: Record<number, { label: string; full: string }> = {
  1: { label: "GK", full: "Goalkeepers" },
  2: { label: "DEF", full: "Defenders" },
  3: { label: "MID", full: "Midfielders" },
  4: { label: "FWD", full: "Forwards" },
}

function fplFdrStyle(d: number): { bg: string; text: string } {
  if (d <= 2) return { bg: "#00FF87", text: "#00552B" }
  if (d === 3) return { bg: "#E7E7E7", text: "#242424" }
  if (d === 4) return { bg: "#FF005A", text: "#FFFFFF" }
  return { bg: "#80072D", text: "#FFFFFF" }
}

interface PlayerComparisonProps {
  squadData: SquadData
  onInjectSwap: (swap: SingleSwap) => void
}

export default function PlayerComparison({
  squadData,
  onInjectSwap,
}: PlayerComparisonProps) {
  const [activePos, setActivePos] = useState<number>(2) // Default DEF
  const [unaffordableMap, setUnaffordableMap] = useState<Record<number, string>>({})
  const reducedMotion = useReducedMotion()

  const allSquad = useMemo(
    () => [...squadData.startingXI, ...squadData.bench],
    [squadData.startingXI, squadData.bench],
  )

  const squadMap = useMemo(
    () => new Map<number, EnrichedPick>(allSquad.map(ep => [ep.element.id, ep])),
    [allSquad],
  )

  const teamsMap = useMemo(
    () => new Map<number, FplTeam>(squadData.allTeams.map(t => [t.id, t])),
    [squadData.allTeams],
  )

  // Rank top 10 players for active position
  const top10 = useMemo(() => {
    const filtered = squadData.allPlayers.filter(
      p => p.element_type === activePos && p.status !== "u",
    )

    const scored = filtered.map(player => {
      const squadPick = squadMap.get(player.id)
      const pts = squadPick
        ? squadPick.prediction.predictedPoints
        : player.ep_next
        ? parseFloat(player.ep_next)
        : parseFloat(player.points_per_game) || 0

      return {
        player,
        team: teamsMap.get(player.team)!,
        predictedPts: Math.round(pts * 10) / 10,
        isOwned: squadMap.has(player.id),
      }
    })

    return scored.sort((a, b) => b.predictedPts - a.predictedPts).slice(0, 10)
  }, [squadData.allPlayers, activePos, squadMap, teamsMap])

  function handleSuggestSwap(targetPlayer: FplElement, targetPts: number) {
    // Clear previous inline errors
    setUnaffordableMap({})

    // Find weakest player in squad playing the same position
    const squadSamePos = allSquad.filter(
      ep => ep.element.element_type === targetPlayer.element_type,
    )

    if (squadSamePos.length === 0) return

    // Sort squad players by predicted points ascending (weakest first)
    squadSamePos.sort((a, b) => a.prediction.predictedPoints - b.prediction.predictedPoints)
    const weakestPick = squadSamePos[0]

    const outCost = weakestPick.element.now_cost
    const targetCost = targetPlayer.now_cost
    const bank = squadData.bank
    const maxBudget = outCost + bank

    if (targetCost > maxBudget) {
      const shortfall = ((targetCost - maxBudget) / 10).toFixed(1)
      setUnaffordableMap(prev => ({
        ...prev,
        [targetPlayer.id]: `Not affordable - need £${shortfall}m more`,
      }))
      return
    }

    const outPts = weakestPick.prediction.predictedPoints
    const delta = Math.round((targetPts - outPts) * 10) / 10

    const swap: SingleSwap = {
      outPick: weakestPick,
      inPlayer: targetPlayer,
      inTeam: teamsMap.get(targetPlayer.team)!,
      outPts,
      inPts: targetPts,
      pointDelta: delta,
      budgetDelta: targetCost - outCost,
    }

    onInjectSwap(swap)

    // Smooth scroll to transfer suggestions section
    const elem = document.getElementById("transfer-suggestions")
    if (elem) {
      elem.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth" })
    }
  }

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-16" id="player-comparison">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono text-xs font-bold border border-emerald-500/20 uppercase tracking-wider">
              OPTIONAL EVALUATOR
            </span>
            <span className="text-xs text-ink-3 font-mono">GW{squadData.gameweek} PROJECTIONS</span>
          </div>
          <h2
            className="text-ink font-bold tracking-tight text-2xl sm:text-3xl"
            style={{ fontFamily: "var(--font-rajdhani)" }}
          >
            COMPARE TOP PLAYERS BY POSITION
          </h2>
        </div>

        {/* Segmented Position Controls */}
        <div className="flex items-center gap-1.5 bg-surface-2 p-1.5 rounded-xl border border-line shrink-0">
          {[1, 2, 3, 4].map(pos => {
            const active = activePos === pos
            const meta = POS_NAMES[pos]
            return (
              <button
                key={pos}
                onClick={() => setActivePos(pos)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                  active
                    ? "bg-primary text-white shadow-md scale-105"
                    : "text-ink-2 hover:text-ink hover:bg-surface/50"
                }`}
              >
                {meta.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Top 10 Comparison Table / Cards */}
      <div className="bg-surface border border-line rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-4 sm:p-5 border-b border-line bg-surface-2/40 flex items-center justify-between">
          <p className="text-xs font-mono text-ink-3 uppercase">
            Top 10 {POS_NAMES[activePos]?.full} Ranked by Predicted Points
          </p>
          <span className="text-[11px] font-mono text-emerald-400 font-bold">
            Live xP Matrix
          </span>
        </div>

        <div className="divide-y divide-line">
          {top10.map(({ player, team, predictedPts, isOwned }, idx) => {
            const rank = idx + 1
            const inlineError = unaffordableMap[player.id]

            return (
              <motion.div
                key={player.id}
                initial={reducedMotion ? {} : { opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: idx * 0.03 }}
                className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                  isOwned ? "bg-emerald-500/10 border-l-4 border-l-emerald-400" : "hover:bg-surface-2/40"
                }`}
              >
                {/* Left: Rank, Jersey, Player Info */}
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  <span
                    className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs font-mono shrink-0 ${
                      rank <= 3
                        ? "bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 font-black"
                        : "bg-surface-2 text-ink-3 border border-line"
                    }`}
                  >
                    #{rank}
                  </span>

                  <Jersey
                    teamCode={team.code}
                    teamShortName={team.short_name}
                    isGK={activePos === 1}
                    size={40}
                  />

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-ink text-sm sm:text-base truncate">
                        {player.first_name} {player.second_name}
                      </span>
                      {isOwned && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider">
                          In your squad
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-ink-3 mt-0.5">
                      <Crest teamCode={team.code} shortName={team.short_name} size={14} />
                      <span className="font-medium text-ink-2">{team.name}</span>
                      <span>&bull;</span>
                      <span className="font-mono font-bold text-ink">£{(player.now_cost / 10).toFixed(1)}m</span>
                    </div>
                  </div>
                </div>

                {/* Right: Predicted Points, Swap Action */}
                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 border-t sm:border-t-0 border-line pt-3 sm:pt-0">
                  <div className="text-left sm:text-right">
                    <div className="flex items-baseline gap-1">
                      <span
                        className="text-ink text-xl sm:text-2xl leading-none font-bold"
                        style={{ fontFamily: "var(--font-rajdhani)" }}
                      >
                        {predictedPts.toFixed(1)}
                      </span>
                      <span className="text-[10px] font-mono font-bold text-emerald-400">xP</span>
                    </div>
                    <span className="text-[10px] text-ink-3 font-mono">GW{squadData.gameweek} Projection</span>
                  </div>

                  {!isOwned ? (
                    <div className="flex flex-col items-end gap-1">
                      <button
                        onClick={() => handleSuggestSwap(player, predictedPts)}
                        className="px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20 cursor-pointer whitespace-nowrap"
                      >
                        Suggest swap &rarr;
                      </button>
                      {inlineError && (
                        <span className="text-[10.5px] font-medium text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg">
                          {inlineError}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                      Owned
                    </span>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}