import { AlertCircle, ArrowLeft, MailCheck } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { FloatingInput } from './components/watermelon/floating-input'

type AuthMode = 'login' | 'signup' | 'forgot'

interface LoginPageProps {
  initialMode: 'login' | 'signup'
  error: string | null
  onLogin: (username: string, password: string) => Promise<void>
  onSignup: (username: string, password: string, email: string) => Promise<void>
  onRequestPasswordReset: (email: string) => Promise<void>
  onDone: () => void
}

const HEADINGS: Record<AuthMode, { title: string; blurb: string }> = {
  login: { title: 'Welcome back', blurb: 'Log in to reach your projects and your team.' },
  signup: { title: 'Create your account', blurb: 'Free to join — invite your team whenever you’re ready.' },
  forgot: { title: 'Reset your password', blurb: 'We’ll email you a link to set a new one.' },
}

function LoginPage({ initialMode, error, onLogin, onSignup, onRequestPasswordReset, onDone }: LoginPageProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode)
  const [usernameInput, setUsernameInput] = useState('')
  const [emailInput, setEmailInput] = useState('')
  const [passwordInput, setPasswordInput] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [resetRequested, setResetRequested] = useState(false)

  function switchMode(next: AuthMode) {
    setMode(next)
    setResetRequested(false)
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      if (mode === 'signup') {
        await onSignup(usernameInput, passwordInput, emailInput)
        onDone()
      } else if (mode === 'forgot') {
        await onRequestPasswordReset(emailInput)
        setResetRequested(true)
      } else {
        await onLogin(usernameInput, passwordInput)
        onDone()
      }
      setPasswordInput('')
    } catch {
      // error is surfaced via the `error` prop
    } finally {
      setSubmitting(false)
    }
  }

  const heading = HEADINGS[mode]

  return (
    <div className="relative flex min-h-[70vh] items-center justify-center px-6 py-16">
      {/* Same treatment as the landing hero: a brand wash faded to transparent
          on every side, so it never meets the page background on a hard edge. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_50%_55%_at_50%_35%,black_25%,transparent_100%)]"
      >
        <div className="absolute left-1/2 top-[-10rem] h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute bottom-[-8rem] right-[2rem] h-[22rem] w-[22rem] rounded-full bg-accent/15 blur-[120px]" />
      </div>

      <div className="w-full max-w-md rounded-lg border border-border bg-card/80 p-8 shadow-elegant backdrop-blur-md">
        <span className="flex items-center gap-2 text-lg font-semibold">
          <span className="bg-gradient-primary bg-clip-text text-transparent">◆</span>
          CodeMesh
        </span>

        <h2 className="mt-6 text-2xl font-bold tracking-tight">{heading.title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{heading.blurb}</p>

        <form className="mt-8 space-y-5" onSubmit={submit}>
          {mode === 'forgot' ? (
            resetRequested ? (
              <p className="flex items-start gap-2 rounded-lg border border-accent/30 bg-accent/10 p-4 text-sm">
                <MailCheck aria-hidden="true" size={18} className="mt-0.5 shrink-0 text-accent" />
                If an account exists for that email, we've sent a link to reset your password.
              </p>
            ) : (
              <FloatingInput
                label="Email"
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                aria-label="Account email"
                autoFocus
              />
            )
          ) : (
            <>
              <FloatingInput
                label="Username"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                aria-label="Account username"
                autoFocus
              />
              {mode === 'signup' && (
                <FloatingInput
                  label="Email"
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  aria-label="Account email"
                />
              )}
              <FloatingInput
                label="Password"
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                aria-label="Account password"
              />
            </>
          )}

          {error && (
            <span className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle aria-hidden="true" size={16} className="mt-0.5 shrink-0" />
              {error}
            </span>
          )}

          {!(mode === 'forgot' && resetRequested) && (
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-gradient-primary py-3 font-medium text-[hsl(var(--on-brand))] shadow-glow transition-all duration-300 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {mode === 'signup' ? 'Sign up' : mode === 'forgot' ? 'Send reset link' : 'Log in'}
            </button>
          )}

          <div className="flex flex-col items-center gap-2 pt-2 text-sm">
            {mode === 'login' && (
              <button
                type="button"
                className="text-muted-foreground transition-colors hover:text-primary"
                onClick={() => switchMode('forgot')}
              >
                Forgot password?
              </button>
            )}
            {(mode === 'login' || mode === 'signup') && (
              <button
                type="button"
                className="font-medium text-primary transition-opacity hover:opacity-80"
                onClick={() => switchMode(mode === 'signup' ? 'login' : 'signup')}
              >
                {mode === 'signup' ? 'Have an account? Log in' : "Don't have an account? Sign up"}
              </button>
            )}
            {mode === 'forgot' && (
              <button
                type="button"
                className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-primary"
                onClick={() => switchMode('login')}
              >
                <ArrowLeft aria-hidden="true" size={14} />
                Back to log in
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

export default LoginPage
