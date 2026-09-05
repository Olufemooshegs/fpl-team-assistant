import { useState, useEffect, type FormEvent } from "react"
import { useNavigate, useSearchParams, Link } from "react-router"
import { supabase } from "../lib/supabase"
import { useAuth } from "../contexts/AuthContext"

// ── Helpers ───────────────────────────────────────────────────────────────────

function mapAuthError(message: string): string {
  if (message.includes("Invalid login credentials")) return "Wrong email or password. Please check and try again."
  if (message.includes("User already registered") || message.includes("already been registered")) return "An account with this email already exists. Sign in instead."
  if (message.includes("Email not confirmed")) return "Please check your inbox and confirm your email address first."
  if (message.includes("Password should be") || message.includes("password")) return "Password must be at least 6 characters."
  if (message.includes("Unable to validate email") || message.includes("valid email")) return "Please enter a valid email address."
  if (message.includes("Signups not allowed") || message.includes("signup")) return "Sign-ups are currently disabled."
  if (message.includes("rate limit") || message.includes("too many")) return "Too many attempts. Please wait a moment and try again."
  return message
}

// ── Google icon ───────────────────────────────────────────────────────────────

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2a10.341 10.341 0 0 0-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" />
      <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" />
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" />
    </svg>
  )
}

// ── Login page ────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [mode, setMode] = useState<"signin" | "signup">(
    searchParams.get("mode") === "signup" ? "signup" : "signin"
  )
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [signupDone, setSignupDone] = useState(false)

  // Redirect already-signed-in users
  useEffect(() => {
    if (!loading && user) navigate("/")
  }, [user, loading, navigate])

  async function handleGoogleSignIn() {
    setError(null)
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    })
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (!email.trim() || !password) {
      setError("Please enter your email and password.")
      return
    }

    if (mode === "signup" && password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    setSubmitting(true)

    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
        if (error) {
          setError(mapAuthError(error.message))
        } else {
          navigate("/")
        }
      } else {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: window.location.origin },
        })
        if (error) {
          setError(mapAuthError(error.message))
        } else {
          setSignupDone(true)
        }
      }
    } finally {
      setSubmitting(false)
    }
  }

  function switchMode(next: "signin" | "signup") {
    setMode(next)
    setError(null)
    setSignupDone(false)
    setPassword("")
    setConfirmPassword("")
  }

  if (loading) return null

  return (
    <div className="min-h-[calc(100vh-120px)] flex items-center justify-center px-4 py-12 relative overflow-hidden">
      
      {/* Background radial glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">

        {/* Card */}
        <div className="bg-surface/90 border border-line rounded-2xl p-8 sm:p-10 shadow-2xl backdrop-blur-xl">

          {/* Logo mark */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-emerald-500 p-0.5 shadow-lg shadow-blue-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-emerald-400">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
            <div>
              <span
                className="text-ink font-bold text-xl tracking-tight leading-none block"
                style={{ fontFamily: "var(--font-rajdhani)" }}
              >
                FPL ENGINE
              </span>
              <span className="text-[10px] font-mono text-ink-3 uppercase tracking-wider">Tactical Auth Portal</span>
            </div>
          </div>

          {signupDone ? (
            /* ── Confirm email state ── */
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-2xl bg-easy-bg flex items-center justify-center mx-auto mb-5">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-easy">
                  <path d="M22 13V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h8" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  <path d="M16 19l2 2 4-4" />
                </svg>
              </div>
              <h2
                className="text-ink mb-2"
                style={{ fontFamily: "var(--font-rajdhani)", fontWeight: 700, fontSize: "24px" }}
              >
                Check your inbox
              </h2>
              <p className="text-ink-2 text-sm leading-relaxed mb-1">
                We sent a confirmation link to
              </p>
              <p className="text-primary text-sm font-medium mb-6 break-all">{email}</p>
              <p className="text-ink-3 text-xs leading-relaxed">
                Click the link in that email to complete sign-up. Check your spam folder if it does not arrive within a minute.
              </p>
            </div>
          ) : (
            /* ── Auth form ── */
            <>
              <h1
                className="text-ink mb-6"
                style={{ fontFamily: "var(--font-rajdhani)", fontWeight: 700, fontSize: "28px" }}
              >
                {mode === "signin" ? "Sign in" : "Create account"}
              </h1>

              {/* Google OAuth */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="w-full h-11 bg-surface border border-line rounded-lg flex items-center justify-center gap-3 text-ink text-sm font-medium hover:bg-surface-2 transition-colors cursor-pointer mb-5"
              >
                <GoogleIcon />
                Continue with Google
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 h-px bg-line" />
                <span className="text-ink-3 text-xs">or</span>
                <div className="flex-1 h-px bg-line" />
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label htmlFor="email" className="block text-ink-2 text-xs font-medium mb-1.5">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    disabled={submitting}
                    className="w-full h-11 bg-base border border-line rounded-lg px-4 text-ink text-sm placeholder-ink-3 focus:outline-none focus:border-primary focus:ring-2 transition-all disabled:opacity-50"
                    style={{ "--tw-ring-color": "rgba(36,84,255,0.12)" } as React.CSSProperties}
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-ink-2 text-xs font-medium mb-1.5">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    autoComplete={mode === "signin" ? "current-password" : "new-password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder={mode === "signup" ? "Min. 6 characters" : "••••••••"}
                    disabled={submitting}
                    className="w-full h-11 bg-base border border-line rounded-lg px-4 text-ink text-sm placeholder-ink-3 focus:outline-none focus:border-primary focus:ring-2 transition-all disabled:opacity-50"
                    style={{ "--tw-ring-color": "rgba(36,84,255,0.12)" } as React.CSSProperties}
                  />
                </div>

                {mode === "signup" && (
                  <div>
                    <label htmlFor="confirm-password" className="block text-ink-2 text-xs font-medium mb-1.5">
                      Confirm password
                    </label>
                    <input
                      id="confirm-password"
                      type="password"
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      disabled={submitting}
                      className="w-full h-11 bg-base border border-line rounded-lg px-4 text-ink text-sm placeholder-ink-3 focus:outline-none focus:border-primary focus:ring-2 transition-all disabled:opacity-50"
                      style={{ "--tw-ring-color": "rgba(36,84,255,0.12)" } as React.CSSProperties}
                    />
                  </div>
                )}

                {error && (
                  <div className="flex items-start gap-2.5 p-3 rounded-lg bg-hard-bg border border-hard/20">
                    <svg className="w-4 h-4 text-hard mt-0.5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-.75-9.25a.75.75 0 011.5 0v3.5a.75.75 0 01-1.5 0v-3.5zm.75 6a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
                    </svg>
                    <p className="text-hard text-sm">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-11 bg-primary text-white rounded-lg font-semibold text-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity mt-1"
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      {mode === "signin" ? "Signing in..." : "Creating account..."}
                    </span>
                  ) : mode === "signin" ? (
                    "Sign in"
                  ) : (
                    "Create free account"
                  )}
                </button>
              </form>

              {/* Mode toggle */}
              <p className="text-center text-ink-3 text-sm mt-6">
                {mode === "signin" ? (
                  <>
                    No account?{" "}
                    <button
                      type="button"
                      onClick={() => switchMode("signup")}
                      className="text-primary hover:underline cursor-pointer"
                    >
                      Sign up free
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => switchMode("signin")}
                      className="text-primary hover:underline cursor-pointer"
                    >
                      Sign in
                    </button>
                  </>
                )}
              </p>
            </>
          )}
        </div>

        {/* Back link */}
        <p className="text-center mt-5">
          <Link to="/" className="text-ink-3 text-sm hover:text-ink transition-colors">
            &larr; Back to app
          </Link>
        </p>
      </div>
    </div>
  )
}
