import { Outlet, Link, useNavigate, useLocation } from "react-router"
import { useEffect, useState } from "react"
import { motion, AnimatePresence, useReducedMotion } from "motion/react"
import { useAuth } from "../contexts/AuthContext"
import DeadlineCountdownBar from "../components/DeadlineCountdownBar"

// ── Dark mode ─────────────────────────────────────────────────────────────────

function useDarkMode(): [boolean, () => void] {
  const [dark, setDark] = useState<boolean>(() => {
    const stored = localStorage.getItem("fpl-theme")
    if (stored) return stored === "dark"
    return window.matchMedia("(prefers-color-scheme: dark)").matches
  })

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark)
    document.documentElement.classList.toggle("light", !dark)
    localStorage.setItem("fpl-theme", dark ? "dark" : "light")
  }, [dark])

  return [dark, () => setDark(d => !d)]
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

function ChevronDownIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
}

// ── Header ────────────────────────────────────────────────────────────────────

function Header({ dark, onToggle }: { dark: boolean; onToggle: () => void }) {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [dropdownOpen, setDropdownOpen] = useState(false)

  useEffect(() => {
    if (!dropdownOpen) return
    const close = () => setDropdownOpen(false)
    document.addEventListener("click", close)
    return () => document.removeEventListener("click", close)
  }, [dropdownOpen])

  async function handleSignOut() {
    await signOut()
    setDropdownOpen(false)
    navigate("/")
  }

  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "Account"

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-line">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        
        {/* Brand logo & Live status pill */}
        <div className="flex items-center gap-3 sm:gap-4">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-emerald-500 p-0.5 shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform duration-200">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-emerald-400">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className="text-ink font-bold tracking-tight text-lg sm:text-xl leading-none"
                  style={{ fontFamily: "var(--font-rajdhani)" }}
                >
                  FPL ENGINE
                </span>
                <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-extrabold tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase">
                  v2.4
                </span>
              </div>
              <p className="text-[10px] text-ink-3 tracking-wider font-medium hidden sm:block">AI GAMWEEK PREDICTOR</p>
            </div>
          </Link>

          {/* Engine indicator */}
          <div className="hidden lg:flex items-center gap-2 pl-3 border-l border-line text-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-ink-2 text-[11px] font-mono">LIVE PREDICTION MATRIX</span>
          </div>
        </div>

        {/* Right tools */}
        <div className="flex items-center gap-2.5">
          {/* Auth control */}
          {user ? (
            <div className="relative">
              <button
                onClick={e => { e.stopPropagation(); setDropdownOpen(prev => !prev) }}
                className="flex items-center gap-2 text-ink hover:text-white text-xs font-semibold transition-all cursor-pointer px-3 py-1.5 rounded-xl bg-surface-2 border border-line hover:border-primary/40 shadow-sm"
              >
                <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-blue-500 to-emerald-400 flex items-center justify-center text-[10px] font-bold text-slate-950 uppercase">
                  {displayName.charAt(0)}
                </div>
                <span className="max-w-[100px] sm:max-w-[140px] truncate">{displayName}</span>
                <ChevronDownIcon />
              </button>
              {dropdownOpen && (
                <div
                  className="absolute right-0 top-full mt-2 w-56 bg-surface border border-line rounded-xl overflow-hidden shadow-2xl z-50 p-1"
                  onClick={e => e.stopPropagation()}
                >
                  <div className="px-3 py-2.5 bg-surface-2/50 rounded-lg mb-1">
                    <p className="text-ink font-semibold text-xs truncate">{displayName}</p>
                    <p className="text-ink-3 text-[11px] font-mono truncate">{user.email}</p>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="w-full px-3 py-2 text-red-400 text-xs font-medium text-left hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer flex items-center gap-2"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="text-ink-2 hover:text-ink text-xs font-semibold transition-colors px-3 py-1.5 rounded-xl hover:bg-surface-2"
            >
              Sign in
            </Link>
          )}

          {/* Theme toggle */}
          <button
            onClick={onToggle}
            className="w-9 h-9 rounded-xl border border-line bg-surface-2/60 flex items-center justify-center text-ink-2 hover:text-ink hover:border-primary/40 transition-all cursor-pointer"
            aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {dark ? <SunIcon /> : <MoonIcon />}
          </button>
        </div>
      </div>
    </header>
  )
}

// ── Layout ────────────────────────────────────────────────────────────────────

import Footer from "../components/Footer"

export default function Layout() {
  const [dark, toggleDark] = useDarkMode()
  const location = useLocation()
  const reduced = useReducedMotion()

  const transition = reduced
    ? { duration: 0 }
    : { duration: 0.22, ease: [0.22, 1, 0.36, 1] as const }

  return (
    <div className="min-h-full flex flex-col bg-base">
      <Header dark={dark} onToggle={toggleDark} />
      <DeadlineCountdownBar />
      <main className="flex-1">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            initial={reduced ? { opacity: 1 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? { opacity: 1 } : { opacity: 0, y: -8 }}
            transition={transition}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  )
}
