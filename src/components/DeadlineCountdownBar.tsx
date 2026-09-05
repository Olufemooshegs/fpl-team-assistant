import { useEffect, useState, useCallback } from "react"
import { useReducedMotion } from "motion/react"
import type { BootstrapResponse, FplEvent } from "../types"

function fplApiUrl(path: string): string {
  return `${import.meta.env.BASE_URL}api/fpl/${path}`
}

interface Countdown {
  days: number
  hours: number
  minutes: number
  seconds: number
  totalMs: number
  isExpired: boolean
}

function calculateCountdown(deadlineIso: string): Countdown {
  const target = new Date(deadlineIso).getTime()
  const now = Date.now()
  const totalMs = target - now

  if (isNaN(target) || totalMs <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0, isExpired: true }
  }

  const days = Math.floor(totalMs / (1000 * 60 * 60 * 24))
  const hours = Math.floor((totalMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((totalMs % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((totalMs % (1000 * 60)) / 1000)

  return { days, hours, minutes, seconds, totalMs, isExpired: false }
}

function pad(num: number): string {
  return String(num).padStart(2, "0")
}

export default function DeadlineCountdownBar() {
  const [event, setEvent] = useState<FplEvent | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [countdown, setCountdown] = useState<Countdown | null>(null)
  const reducedMotion = useReducedMotion()

  const fetchBootstrap = useCallback(async () => {
    try {
      const res = await fetch(fplApiUrl("bootstrap"))
      if (!res.ok) return
      const data: BootstrapResponse = await res.json()
      if (!data.events || data.events.length === 0) return

      const nextEvent =
        data.events.find(e => e.is_next) ||
        data.events.find(e => e.is_current) ||
        data.events.find(e => !e.finished)

      if (nextEvent) {
        setEvent(nextEvent)
        setCountdown(calculateCountdown(nextEvent.deadline_time))
      }
    } catch {
      // Ignore network errors gracefully
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBootstrap()
  }, [fetchBootstrap])

  useEffect(() => {
    if (!event || !event.deadline_time) return

    const timer = setInterval(() => {
      const updated = calculateCountdown(event.deadline_time)
      setCountdown(updated)

      if (updated.isExpired) {
        fetchBootstrap()
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [event, fetchBootstrap])

  if (loading || !event || !countdown) return null

  const isUnder24Hours = !countdown.isExpired && countdown.totalMs < 24 * 60 * 60 * 1000
  const isUnder1Hour = !countdown.isExpired && countdown.totalMs < 60 * 60 * 1000
  const shouldPulseSeconds = isUnder1Hour && !reducedMotion

  return (
    <div
      className={`w-full border-b backdrop-blur-xl shadow-xl transition-all duration-300 relative overflow-hidden ${
        isUnder24Hours
          ? "bg-gradient-to-r from-[#2c080d] via-[#1f0a02] to-[#180508] border-amber-500/50 text-amber-100"
          : "bg-gradient-to-r from-[#1E002B] via-[#0D182E] to-[#002D1E] border-emerald-500/30 text-white"
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-3 relative z-10">
        
        {/* Left Side Label & Gameweek badge */}
        <div className="flex items-center gap-2.5 text-center sm:text-left flex-wrap justify-center sm:justify-start">
          <div className="relative flex items-center justify-center">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                countdown.isExpired
                  ? "bg-slate-400"
                  : isUnder24Hours
                  ? "bg-amber-400 shadow-[0_0_10px_#f59e0b]"
                  : "bg-[#00FF87] shadow-[0_0_10px_#00FF87]"
              }`}
            />
            {!countdown.isExpired && (
              <span
                className={`absolute w-4 h-4 rounded-full animate-ping opacity-75 ${
                  isUnder24Hours ? "bg-amber-400" : "bg-[#00FF87]"
                }`}
              />
            )}
          </div>

          <span
            className="font-extrabold text-sm sm:text-base tracking-tight uppercase text-white"
            style={{ fontFamily: "var(--font-rajdhani)" }}
          >
            Gameweek {event.id} Deadline
          </span>

          {event.is_current || countdown.isExpired ? (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-[#00FF87]">
              <span className="w-2 h-2 rounded-full bg-[#00FF87] shadow-[0_0_10px_#00FF87] animate-pulse" />
              <span className="text-xs font-mono font-extrabold uppercase tracking-wider">
                LIVE GAMEWEEK {event.id} IN PROGRESS
              </span>
            </div>
          ) : (
            <span
              className={`text-[11px] font-mono font-extrabold px-2 py-0.5 rounded border hidden md:inline ${
                isUnder24Hours
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                  : "bg-[#00FF87]/20 text-[#00FF87] border-[#00FF87]/40"
              }`}
            >
              {new Date(event.deadline_time).toLocaleDateString(undefined, {
                weekday: "short",
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
        </div>

        {/* Right Side Segmented Boxed Countdown */}
        {!countdown.isExpired && (
          <div className="flex items-center gap-1.5 sm:gap-2">
            
            {/* Days */}
            <div className="flex flex-col items-center bg-slate-950/90 border border-white/20 rounded-xl px-2.5 py-1 min-w-[50px] sm:min-w-[58px] shadow-lg">
              <span
                className={`font-black text-lg sm:text-2xl leading-none font-mono ${
                  isUnder24Hours ? "text-amber-300" : "text-[#00FF87]"
                }`}
                style={{ fontFamily: "var(--font-rajdhani)", fontWeight: 800 }}
              >
                {pad(countdown.days)}
              </span>
              <span className="text-[9px] font-mono font-black tracking-widest text-slate-300 uppercase mt-0.5">
                DAYS
              </span>
            </div>

            <span className="font-extrabold text-base text-white/60">:</span>

            {/* Hours */}
            <div className="flex flex-col items-center bg-slate-950/90 border border-white/20 rounded-xl px-2.5 py-1 min-w-[50px] sm:min-w-[58px] shadow-lg">
              <span
                className={`font-black text-lg sm:text-2xl leading-none font-mono ${
                  isUnder24Hours ? "text-amber-300" : "text-[#00FF87]"
                }`}
                style={{ fontFamily: "var(--font-rajdhani)", fontWeight: 800 }}
              >
                {pad(countdown.hours)}
              </span>
              <span className="text-[9px] font-mono font-black tracking-widest text-slate-300 uppercase mt-0.5">
                HRS
              </span>
            </div>

            <span className="font-extrabold text-base text-white/60">:</span>

            {/* Minutes */}
            <div className="flex flex-col items-center bg-slate-950/90 border border-white/20 rounded-xl px-2.5 py-1 min-w-[50px] sm:min-w-[58px] shadow-lg">
              <span
                className={`font-black text-lg sm:text-2xl leading-none font-mono ${
                  isUnder24Hours ? "text-amber-300" : "text-[#00FF87]"
                }`}
                style={{ fontFamily: "var(--font-rajdhani)", fontWeight: 800 }}
              >
                {pad(countdown.minutes)}
              </span>
              <span className="text-[9px] font-mono font-black tracking-widest text-slate-300 uppercase mt-0.5">
                MIN
              </span>
            </div>

            <span className="font-extrabold text-base text-white/60">:</span>

            {/* Seconds */}
            <div
              className={`flex flex-col items-center bg-slate-950/90 border rounded-xl px-2.5 py-1 min-w-[50px] sm:min-w-[58px] shadow-lg transition-all ${
                shouldPulseSeconds
                  ? "animate-pulse border-amber-400 bg-amber-500/30 ring-2 ring-amber-400"
                  : "border-white/20"
              }`}
            >
              <span
                className={`font-black text-lg sm:text-2xl leading-none font-mono ${
                  shouldPulseSeconds
                    ? "text-amber-200"
                    : isUnder24Hours
                    ? "text-amber-300"
                    : "text-[#00FF87]"
                }`}
                style={{ fontFamily: "var(--font-rajdhani)", fontWeight: 800 }}
              >
                {pad(countdown.seconds)}
              </span>
              <span className="text-[9px] font-mono font-black tracking-widest text-slate-300 uppercase mt-0.5">
                SEC
              </span>
            </div>

          </div>
        )}
      </div>
    </div>
  )
}