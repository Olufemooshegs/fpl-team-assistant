import { useState } from "react"
import { motion, useReducedMotion } from "motion/react"
import type { EnrichedPick, SquadData } from "../types"
import type { SingleSwap } from "../services/transfers"
import { Jersey, Crest } from "./FplImages"
import TransferSuggestions from "./TransferSuggestions"
import PlayerComparison from "./PlayerComparison"
import { useCountUp } from "../hooks/useCountUp"

// ── Official FPL FDR Difficulty Colors ────────────────────────────────────────

function fplFdrStyle(d: number): { bg: string; text: string; label: string } {
  if (d <= 2) return { bg: "#00FF87", text: "#00552B", label: "Easy" }
  if (d === 3) return { bg: "#E7E7E7", text: "#242424", label: "Medium" }
  if (d === 4) return { bg: "#FF005A", text: "#FFFFFF", label: "Hard" }
  return { bg: "#80072D", text: "#FFFFFF", label: "Very Hard" }
}

function FixturePill({
  fixture,
}: {
  fixture: { opponentCode: number; opponentShortName: string; isHome: boolean; difficulty: number } | null
}) {
  if (!fixture) {
    return (
      <div className="w-full text-[9px] font-bold py-0.5 px-1 bg-slate-800 text-slate-400 rounded text-center uppercase tracking-tighter">
        BLANK
      </div>
    )
  }

  const fdr = fplFdrStyle(fixture.difficulty)
  const homeAway = fixture.isHome ? "(H)" : "(A)"

  return (
    <div
      className="w-full text-[9.5px] font-bold py-0.5 px-1 rounded flex items-center justify-center gap-1 shadow-sm leading-none"
      style={{ backgroundColor: fdr.bg, color: fdr.text }}
    >
      <Crest teamCode={fixture.opponentCode} shortName={fixture.opponentShortName} size={11} />
      <span>
        {fixture.opponentShortName} {homeAway}
      </span>
    </div>
  )
}

// ── Pitch Lines (Authentic FPL pitch markings) ────────────────────────────────

function OfficialFplPitchLines() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
      {/* Turf Stripes */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(255, 255, 255, 0.08) 0px, rgba(255, 255, 255, 0.08) 44px, transparent 44px, transparent 88px)",
        }}
      />
      {/* Outer Border Line */}
      <div className="absolute inset-3 border-2 border-white/20 rounded-xl" />
      {/* Center Half Line */}
      <div className="absolute top-1/2 left-3 right-3 h-0.5 bg-white/20" />
      {/* Center Circle */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full border-2 border-white/20" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white/30" />
      {/* Top Goal Penalty Box */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 w-64 h-24 border-2 border-t-0 border-white/20 rounded-b-xl" />
      <div className="absolute top-3 left-1/2 -translate-x-1/2 w-28 h-10 border-2 border-t-0 border-white/20 rounded-b-md" />
      {/* Bottom Goal Penalty Box */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-64 h-24 border-2 border-b-0 border-white/20 rounded-t-xl" />
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-28 h-10 border-2 border-b-0 border-white/20 rounded-t-md" />
    </div>
  )
}

// ── FPL Player Card (Official style pitch node) ───────────────────────────────

function FplPlayerCard({
  ep,
  onClick,
}: {
  ep: EnrichedPick
  onClick: () => void
}) {
  const { pick, element, team, prediction, nextFixture } = ep
  const isGK = element.element_type === 1
  const displayPts = prediction.predictedPoints * Math.max(pick.multiplier, 1)

  return (
    <div
      onClick={onClick}
      className="relative flex flex-col items-center w-[78px] sm:w-[94px] group cursor-pointer hover:scale-105 transition-all duration-200 select-none"
    >
      {/* Shirt container with Captain / Vice-Captain badge */}
      <div className="relative mb-1">
        <Jersey
          teamCode={team.code}
          teamShortName={team.short_name}
          isGK={isGK}
          size={56}
          className="filter drop-shadow-[0_6px_8px_rgba(0,0,0,0.4)] group-hover:drop-shadow-[0_8px_12px_rgba(0,0,0,0.6)]"
        />

        {pick.is_captain && (
          <div className="absolute -top-1 -right-2 w-5 h-5 rounded-full bg-[#00FF87] text-[#37003C] font-black text-[11px] flex items-center justify-center border-2 border-[#37003C] shadow-md">
            C
          </div>
        )}
        {pick.is_vice_captain && (
          <div className="absolute -top-1 -right-2 w-5 h-5 rounded-full bg-slate-200 text-[#37003C] font-black text-[10px] flex items-center justify-center border-2 border-[#37003C] shadow-md">
            V
          </div>
        )}
      </div>

      {/* Name banner */}
      <div className="w-full bg-[#37003C] text-white text-center py-0.5 px-1 rounded-t-md shadow-md border-b border-white/10">
        <p className="text-[11px] font-bold truncate leading-tight tracking-tight">
          {element.web_name}
        </p>
      </div>

      {/* Points & xP Bar */}
      <div className="w-full bg-slate-900/95 text-white py-0.5 px-1 text-center font-mono flex items-center justify-between text-[10px] border-b border-slate-800">
        <span className="text-slate-400 text-[8.5px]">xP</span>
        <span className="font-extrabold text-[#00FF87] text-[11px]">{displayPts.toFixed(1)}</span>
      </div>

      {/* Fixture FDR Pill */}
      <div className="w-full mt-0.5">
        <FixturePill fixture={nextFixture} />
      </div>
    </div>
  )
}

// ── Official Pitch Grid (Goalkeeper at top -> Defenders -> Midfielders -> Forwards) ──

function OfficialPitch({
  startingXI,
  onSelectPlayer,
}: {
  startingXI: EnrichedPick[]
  onSelectPlayer: (ep: EnrichedPick) => void
}) {
  const gk  = startingXI.filter(ep => ep.element.element_type === 1)
  const def = startingXI.filter(ep => ep.element.element_type === 2)
  const mid = startingXI.filter(ep => ep.element.element_type === 3)
  const fwd = startingXI.filter(ep => ep.element.element_type === 4)

  const reduced = useReducedMotion()

  return (
    <div className="relative rounded-2xl overflow-hidden bg-gradient-to-b from-[#00874e] via-[#027443] to-[#005a33] p-4 sm:p-6 shadow-2xl border-4 border-[#37003C]">
      <OfficialFplPitchLines />

      <div className="relative z-10 flex flex-col gap-5 sm:gap-7 py-4">
        {/* Row 1: Goalkeeper */}
        <div className="flex justify-center gap-2 sm:gap-4">
          {gk.map((ep, i) => (
            <motion.div
              key={ep.pick.element}
              initial={reduced ? {} : { opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
            >
              <FplPlayerCard ep={ep} onClick={() => onSelectPlayer(ep)} />
            </motion.div>
          ))}
        </div>

        {/* Row 2: Defenders */}
        <div className="flex justify-center gap-2 sm:gap-4">
          {def.map((ep, i) => (
            <motion.div
              key={ep.pick.element}
              initial={reduced ? {} : { opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 + i * 0.05 }}
            >
              <FplPlayerCard ep={ep} onClick={() => onSelectPlayer(ep)} />
            </motion.div>
          ))}
        </div>

        {/* Row 3: Midfielders */}
        <div className="flex justify-center gap-2 sm:gap-4">
          {mid.map((ep, i) => (
            <motion.div
              key={ep.pick.element}
              initial={reduced ? {} : { opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 + i * 0.05 }}
            >
              <FplPlayerCard ep={ep} onClick={() => onSelectPlayer(ep)} />
            </motion.div>
          ))}
        </div>

        {/* Row 4: Forwards */}
        <div className="flex justify-center gap-2 sm:gap-4">
          {fwd.map((ep, i) => (
            <motion.div
              key={ep.pick.element}
              initial={reduced ? {} : { opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 + i * 0.05 }}
            >
              <FplPlayerCard ep={ep} onClick={() => onSelectPlayer(ep)} />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Bench Dugout (FPL official style sub bar) ──────────────────────────────────

function FplBenchDugout({
  bench,
  onSelectPlayer,
}: {
  bench: EnrichedPick[]
  onSelectPlayer: (ep: EnrichedPick) => void
}) {
  const benchLabels = ["GKP", "1st", "2nd", "3rd"]

  return (
    <div className="mt-4 bg-[#37003C] rounded-2xl p-4 sm:p-5 border-2 border-slate-800 shadow-xl">
      <div className="flex items-center justify-between mb-3 text-white">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#00FF87]" />
          <span className="font-extrabold text-sm tracking-wider uppercase" style={{ fontFamily: "var(--font-rajdhani)" }}>
            SUBSTITUTES BENCH
          </span>
        </div>
        <span className="text-xs text-slate-300 font-mono">4 PLAYERS</span>
      </div>

      <div className="grid grid-cols-4 gap-2 sm:gap-4 max-w-xl mx-auto">
        {bench.map((ep, idx) => (
          <div key={ep.pick.element} className="flex flex-col items-center">
            <span className="text-[10px] font-bold font-mono text-[#00FF87] bg-black/40 px-2 py-0.5 rounded-full mb-1">
              {benchLabels[idx] || `SUB`}
            </span>
            <FplPlayerCard ep={ep} onClick={() => onSelectPlayer(ep)} />
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Official FPL Dashboard Header ─────────────────────────────────────────────

function FplDashboardHeader({
  squadData,
  freeTransfers,
  onTransfersChange,
  currentCaptainId,
  onCaptainChange,
}: {
  squadData: SquadData
  freeTransfers: number
  onTransfersChange: (n: number) => void
  currentCaptainId: number | null
  onCaptainChange: (id: number) => void
}) {
  const [activeChip, setActiveChip] = useState<string | null>(null)

  // Compute live score dynamically based on active captain choice
  const rawScore = squadData.startingXI.reduce((sum, ep) => {
    const isCap = currentCaptainId ? ep.element.id === currentCaptainId : ep.pick.is_captain
    const mult = isCap ? 2 : 1
    return sum + ep.prediction.predictedPoints * mult
  }, 0)
  const liveScore = Math.round(rawScore * 10) / 10
  const displayScore = useCountUp(liveScore, 1, 0.9)

  const squadValue = squadData.startingXI.concat(squadData.bench).reduce((acc, p) => acc + p.element.now_cost, 0) / 10

  return (
    <div className="bg-[#37003C] text-white rounded-2xl p-6 sm:p-8 mb-8 border-2 border-slate-800 shadow-2xl relative overflow-hidden">
      {/* Background graphic */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#00FF87]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Banner: GW & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-[#00FF87] text-[#37003C] text-xs font-black px-2.5 py-0.5 rounded uppercase tracking-wider">
              MY TEAM &bull; GW{squadData.gameweek}
            </span>
            <span className="text-xs text-slate-300 font-mono">DEADLINE SAT 15 FEB</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ fontFamily: "var(--font-rajdhani)" }}>
            FPL TACTICAL ASSISTANT
          </h1>
        </div>

        {/* Predicted Points Counter */}
        <div className="bg-black/40 border border-white/10 rounded-xl px-5 py-3 flex items-center gap-4">
          <div>
            <p className="text-[10px] text-slate-400 font-mono uppercase">Predicted GW Score</p>
            <div className="text-3xl font-black text-[#00FF87] font-mono leading-none">
              {displayScore}
            </div>
          </div>
          <div className="text-right border-l border-white/10 pl-4">
            <p className="text-[10px] text-slate-400 font-mono uppercase">Target</p>
            <p className="text-xl font-extrabold text-white font-mono">80.0</p>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-5 border-b border-white/10">
        <div>
          <p className="text-[10px] text-slate-300 font-mono uppercase">Free Transfers</p>
          <div className="flex items-center gap-2 mt-1">
            <button
              onClick={() => onTransfersChange(Math.max(0, freeTransfers - 1))}
              className="w-6 h-6 bg-white/10 rounded hover:bg-white/20 font-bold text-xs cursor-pointer"
            >
              -
            </button>
            <span className="font-extrabold text-lg text-[#00FF87] font-mono">{freeTransfers}</span>
            <button
              onClick={() => onTransfersChange(Math.min(5, freeTransfers + 1))}
              className="w-6 h-6 bg-white/10 rounded hover:bg-white/20 font-bold text-xs cursor-pointer"
            >
              +
            </button>
          </div>
        </div>

        <div>
          <p className="text-[10px] text-slate-300 font-mono uppercase">In Bank</p>
          <p className="text-lg font-extrabold text-white font-mono mt-1">£{(squadData.bank / 10).toFixed(1)}m</p>
        </div>

        <div>
          <p className="text-[10px] text-slate-300 font-mono uppercase">Squad Value</p>
          <p className="text-lg font-extrabold text-white font-mono mt-1">£{squadValue.toFixed(1)}m</p>
        </div>

        <div>
          <p className="text-[10px] text-slate-300 font-mono uppercase">Captain Choice</p>
          <select
            value={currentCaptainId || squadData.startingXI.find(p => p.pick.is_captain)?.element.id}
            onChange={e => onCaptainChange(Number(e.target.value))}
            className="mt-1 bg-black/60 border border-white/20 rounded px-2 py-1 text-xs font-bold text-[#00FF87] focus:outline-none cursor-pointer"
          >
            {squadData.startingXI.map(ep => (
              <option key={ep.element.id} value={ep.element.id} className="bg-slate-900 text-white">
                {ep.element.web_name} (xP: {ep.prediction.predictedPoints.toFixed(1)})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* FPL Chips Bar */}
      <div className="mt-4 flex items-center justify-between gap-2 flex-wrap">
        <span className="text-xs font-mono font-bold text-slate-300">FPL CHIPS:</span>
        <div className="flex items-center gap-2 flex-wrap">
          {["Wildcard", "Free Hit", "Triple Captain", "Bench Boost"].map(chip => {
            const active = activeChip === chip
            return (
              <button
                key={chip}
                onClick={() => setActiveChip(active ? null : chip)}
                className={`px-3 py-1 rounded text-xs font-bold font-mono transition-all cursor-pointer ${
                  active
                    ? "bg-[#00FF87] text-[#37003C] shadow-lg scale-105"
                    : "bg-white/10 text-white hover:bg-white/20 border border-white/10"
                }`}
              >
                {chip} {active && "✓"}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── Interactive Player Action Modal ───────────────────────────────────────────

function FplPlayerModal({
  ep,
  isCaptain,
  isViceCaptain,
  onSetCaptain,
  onSetViceCaptain,
  onClose,
}: {
  ep: EnrichedPick
  isCaptain: boolean
  isViceCaptain: boolean
  onSetCaptain: () => void
  onSetViceCaptain: () => void
  onClose: () => void
}) {
  const { element, team, prediction, nextFixture } = ep
  const displayPts = prediction.predictedPoints * (isCaptain ? 2 : 1)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md bg-[#37003C] border-2 border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-white"
      >
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-start justify-between bg-black/30">
          <div className="flex items-center gap-4">
            <Jersey teamCode={team.code} teamShortName={team.short_name} isGK={element.element_type === 1} size={60} />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-black bg-[#00FF87] text-[#37003C] px-2 py-0.5 rounded">
                  £{(element.now_cost / 10).toFixed(1)}m
                </span>
                <span className="text-xs text-slate-300 font-mono">{team.name}</span>
              </div>
              <h3 className="text-2xl font-black" style={{ fontFamily: "var(--font-rajdhani)" }}>
                {element.first_name} {element.second_name}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg border border-white/20 flex items-center justify-center text-slate-300 hover:text-white cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onSetCaptain}
              className={`py-2.5 px-3 rounded-xl font-extrabold text-xs cursor-pointer transition-all ${
                isCaptain
                  ? "bg-[#00FF87] text-[#37003C]"
                  : "bg-white/10 hover:bg-white/20 text-white border border-white/20"
              }`}
            >
              {isCaptain ? "CAPTAIN (2x Pts) ✓" : "MAKE CAPTAIN"}
            </button>
            <button
              onClick={onSetViceCaptain}
              className={`py-2.5 px-3 rounded-xl font-extrabold text-xs cursor-pointer transition-all ${
                isViceCaptain
                  ? "bg-slate-200 text-[#37003C]"
                  : "bg-white/10 hover:bg-white/20 text-white border border-white/20"
              }`}
            >
              {isViceCaptain ? "VICE CAPTAIN ✓" : "MAKE VICE CAPTAIN"}
            </button>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-black/40 p-4 rounded-xl border border-white/10">
              <p className="text-slate-400 text-[10px] font-mono uppercase">Predicted xP</p>
              <p className="text-3xl font-black text-[#00FF87] font-mono mt-1">{displayPts.toFixed(1)}</p>
              {isCaptain && <p className="text-[10px] text-[#00FF87]">Captain Double Points</p>}
            </div>
            <div className="bg-black/40 p-4 rounded-xl border border-white/10">
              <p className="text-slate-400 text-[10px] font-mono uppercase">Form (5 GWs)</p>
              <p className="text-3xl font-black text-white font-mono mt-1">{element.form}</p>
              <p className="text-[10px] text-slate-400">Pts per game</p>
            </div>
          </div>

          <div className="bg-black/40 p-4 rounded-xl border border-white/10 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Ownership:</span>
              <span className="font-mono font-bold text-white">{element.selected_by_percent}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Total Points:</span>
              <span className="font-mono font-bold text-white">{element.total_points}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Next Match:</span>
              <FixturePill fixture={nextFixture} />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// ── Auth Gate Teaser ──────────────────────────────────────────────────────────

function AuthGate({ startingXI }: { startingXI: EnrichedPick[] }) {
  return (
    <div className="relative">
      <div style={{ filter: "blur(6px)", pointerEvents: "none" }}>
        <OfficialPitch startingXI={startingXI} onSelectPlayer={() => {}} />
      </div>

      <div className="absolute inset-0 flex items-center justify-center z-20">
        <div className="bg-[#37003C] border-2 border-slate-700 rounded-2xl p-8 text-center max-w-md mx-4 shadow-2xl text-white">
          <div className="w-12 h-12 rounded-full bg-[#00FF87] text-[#37003C] font-black text-xl flex items-center justify-center mx-auto mb-4">
            FPL
          </div>
          <h3 className="text-2xl font-black mb-2" style={{ fontFamily: "var(--font-rajdhani)" }}>
            SIGN IN TO SEE YOUR FPL TEAM
          </h3>
          <p className="text-slate-300 text-sm leading-relaxed mb-6">
            Get personalized player projections, captain recommendations, and data-driven transfer target suggestions.
          </p>
          <a
            href="/login?mode=signup"
            className="block w-full py-3 bg-[#00FF87] text-[#37003C] font-black rounded-xl text-sm hover:opacity-90 transition-opacity mb-3"
          >
            CREATE FREE ACCOUNT
          </a>
          <a href="/login" className="text-xs text-slate-300 hover:text-white underline">
            Already have an account? Sign in
          </a>
        </div>
      </div>
    </div>
  )
}

// ── Main Squad View Component ──────────────────────────────────────────────────

export default function SquadView({
  squadData,
  isAuthenticated,
}: {
  squadData: SquadData
  isAuthenticated: boolean
}) {
  const [freeTransfers, setFreeTransfers] = useState(2)
  const [selectedPlayer, setSelectedPlayer] = useState<EnrichedPick | null>(null)
  const [injectedSwap, setInjectedSwap] = useState<SingleSwap | null>(null)
  const [captainId, setCaptainId] = useState<number | null>(
    squadData.startingXI.find(p => p.pick.is_captain)?.element.id || null
  )
  const [viceCaptainId, setViceCaptainId] = useState<number | null>(
    squadData.startingXI.find(p => p.pick.is_vice_captain)?.element.id || null
  )

  // Dynamically enrich starting XI with captain selections
  const enrichedStartingXI = squadData.startingXI.map(ep => ({
    ...ep,
    pick: {
      ...ep.pick,
      is_captain: captainId ? ep.element.id === captainId : ep.pick.is_captain,
      is_vice_captain: viceCaptainId ? ep.element.id === viceCaptainId : ep.pick.is_vice_captain,
      multiplier: (captainId ? ep.element.id === captainId : ep.pick.is_captain) ? 2 : 1,
    },
  }))

  return (
    <>
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-12">
        {/* FPL Header */}
        <FplDashboardHeader
          squadData={squadData}
          freeTransfers={freeTransfers}
          onTransfersChange={setFreeTransfers}
          currentCaptainId={captainId}
          onCaptainChange={setCaptainId}
        />

        {isAuthenticated ? (
          <>
            {/* Pitch View */}
            <div className="mb-6">
              <OfficialPitch
                startingXI={enrichedStartingXI}
                onSelectPlayer={setSelectedPlayer}
              />
            </div>

            {/* Bench Dugout */}
            <FplBenchDugout
              bench={squadData.bench}
              onSelectPlayer={setSelectedPlayer}
            />
          </>
        ) : (
          <AuthGate startingXI={enrichedStartingXI} />
        )}
      </section>

      {/* Selected Player Quick Actions Modal */}
      {selectedPlayer && (
        <FplPlayerModal
          ep={selectedPlayer}
          isCaptain={captainId === selectedPlayer.element.id}
          isViceCaptain={viceCaptainId === selectedPlayer.element.id}
          onSetCaptain={() => {
            setCaptainId(selectedPlayer.element.id)
            if (viceCaptainId === selectedPlayer.element.id) setViceCaptainId(null)
          }}
          onSetViceCaptain={() => {
            setViceCaptainId(selectedPlayer.element.id)
            if (captainId === selectedPlayer.element.id) setCaptainId(null)
          }}
          onClose={() => setSelectedPlayer(null)}
        />
      )}

      {/* Transfer Suggestions & Player Comparison — authenticated only */}
      {isAuthenticated && (
        <>
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="h-px bg-line mb-8" />
          </div>
          <TransferSuggestions
            squadData={squadData}
            freeTransfers={freeTransfers}
            injectedSwap={injectedSwap}
          />

          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="h-px bg-line mb-8" />
          </div>
          <PlayerComparison
            squadData={squadData}
            onInjectSwap={setInjectedSwap}
          />
        </>
      )}
    </>
  )
}