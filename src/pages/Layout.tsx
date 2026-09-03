import { Outlet, Link, useNavigate, useLocation } from "react-router"
import { useEffect, useState } from "react"
import { motion, AnimatePresence, useReducedMotion } from "motion/react"
import { useAuth } from "../contexts/AuthContext"

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
    <header className="bg-nav border-b sticky top-0 z-10" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
      <div className="max-w-5xl mx-auto px-5 py-3 flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2.5">
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
        </Link>

        <div className="ml-auto flex items-center gap-2">
          {/* Auth control */}
          {user ? (
            <div className="relative">
              <button
                onClick={e => { e.stopPropagation(); setDropdownOpen(prev => !prev) }}
                className="flex items-center gap-1.5 text-white/80 hover:text-white text-sm transition-colors cursor-pointer px-2 py-1.5 rounded-lg hover:bg-white/10"
              >
                <span className="max-w-[120px] truncate">{displayName}</span>
                <ChevronDownIcon />
              </button>
              {dropdownOpen && (
                <div
                  className="absolute right-0 top-full mt-2 w-52 bg-surface border border-line rounded-xl overflow-hidden z-20"
                  onClick={e => e.stopPropagation()}
                >
                  <p className="px-4 py-3 text-ink-3 text-xs truncate border-b border-line">{user.email}</p>
                  <button
                    onClick={handleSignOut}
                    className="w-full px-4 py-3 text-ink-2 text-sm text-left hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="text-white/70 hover:text-white text-sm transition-colors px-2 py-1.5"
            >
              Sign in
            </Link>
          )}

          {/* Dark mode toggle */}
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

// ── Layout ────────────────────────────────────────────────────────────────────

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
      <footer className="border-t border-line py-6 mt-6">
        <p className="text-center text-ink-3 text-xs leading-relaxed">
          FPL Team Assistant &mdash; not affiliated with Fantasy Premier League or the Premier League.
        </p>
      </footer>
    </div>
  )
}
