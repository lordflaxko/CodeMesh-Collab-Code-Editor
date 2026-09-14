import { AnimatePresence, motion } from 'motion/react'
import {
  ArrowRight,
  Check,
  GitBranch,
  MessageSquare,
  Play,
  Plus,
  Sparkles,
  Terminal,
  Users,
} from 'lucide-react'
import { useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Reveal } from './components/Reveal'
import { ShimmerButton } from './components/watermelon/shimmer-button'

interface LandingPageProps {
  onGetStarted: () => void
  onOpenLegal: (kind: 'privacy' | 'terms') => void
}

// Rendered as one <div> per line (rather than raw '\n' text nodes mixed with
// inline <span>s) so each line's tokens lay out predictably regardless of
// whitespace handling -- relying on '\n' inside a flex/inline layout caused
// lines to run together and overflow the card.
const PREVIEW_LINES: { text: string; tok?: string }[][] = [
  [{ text: '// two people, one file', tok: 'text-muted-foreground' }],
  [
    { text: 'function ', tok: 'text-primary' },
    { text: 'sync', tok: 'text-accent' },
    { text: '(' },
    { text: 'team', tok: 'text-primary/70' },
    { text: ') {' },
  ],
  [
    { text: '  return ', tok: 'text-primary' },
    { text: 'team.' },
    { text: 'map', tok: 'text-accent' },
    { text: '(p => p.' },
    { text: 'cursor', tok: 'text-primary/70' },
    { text: ')' },
  ],
  [{ text: '}' }],
]

const FEATURES: {
  icon: LucideIcon
  title: string
  body: string
  bullets: string[]
}[] = [
  {
    icon: Users,
    title: 'Live collaboration',
    body: 'See teammates’ cursors, selections, and edits land in real time.',
    bullets: ['Live cursors & presence', 'Inline comment threads', 'Room chat with mentions'],
  },
  {
    icon: Play,
    title: 'Run & debug instantly',
    body: 'Execute code in a real sandbox without leaving the editor.',
    bullets: ['Interactive stdin terminal', 'Real step-through debugging', 'Set breakpoints & logpoints'],
  },
  {
    icon: GitBranch,
    title: 'Git built in',
    body: 'Commit, branch, and review against a real repo.',
    bullets: ['Commit & branch history', 'Diff review before merging', 'No separate tool needed'],
  },
  {
    icon: Sparkles,
    title: 'AI assistant',
    body: 'Ask questions or get an explanation of any selection.',
    bullets: ['Explain any selection', 'Ask about the whole project', 'Answers stay in the room chat'],
  },
]

const LANGUAGES = ['JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'Rust', 'Go']

const TIMELINE_STEPS = [
  { label: 'Sign up', body: 'Create a free account in seconds.' },
  { label: 'Create a project', body: 'Start blank or from a template.' },
  { label: 'Invite your team', body: 'Share a link, pick their role.' },
  { label: 'Code together', body: 'Live cursors, chat, comments, presence.' },
  { label: 'Run, review, ship', body: 'Execute, debug, commit, deploy.' },
]

const FAQS = [
  {
    q: 'Is it free to use?',
    a: 'Yes. Creating an account, creating projects, and using the editor are all free.',
  },
  {
    q: 'What languages are supported?',
    a: 'JavaScript, TypeScript, Python, Java, C++, Rust, and Go — each with real execution and formatting, not just syntax highlighting.',
  },
  {
    q: 'Do I need to install anything?',
    a: 'No. It runs entirely in your browser — open a project and start typing.',
  },
  {
    q: 'Is my code private?',
    a: 'Projects are private by default, visible only to people you invite. You can also mark a project public if you want anyone with the link to view it.',
  },
  {
    q: 'Can my whole team use one project?',
    a: 'Yes — invite teammates with a link, assign viewer, editor, or admin roles, and everyone edits, chats, and reviews together live.',
  },
]

/** Shared section heading: a plain phrase with the last word set in the script face. */
function SectionTitle({ lead, accent }: { lead: string; accent: string }) {
  return (
    <h2 className="text-balance text-center text-3xl font-bold tracking-tight sm:text-4xl">
      {lead}{' '}
      {/* The script face overhangs its box, so the padding/negative-margin pair
          gives the glyph room to render without the descender being clipped. */}
      <span className="bg-gradient-primary bg-clip-text px-[0.16em] font-script text-4xl text-transparent sm:text-5xl -mx-[0.16em]">
        {accent}
      </span>
    </h2>
  )
}

function FaqItem({ q, a, open, onToggle }: { q: string; a: string; open: boolean; onToggle: () => void }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card/60 backdrop-blur-sm transition-colors hover:border-primary/40">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-medium"
      >
        {q}
        <Plus
          aria-hidden="true"
          size={18}
          className={`shrink-0 text-primary transition-transform duration-300 ${open ? 'rotate-45' : ''}`}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            // Animating height rather than toggling display keeps the panel
            // from snapping open; overflow-hidden on the wrapper is what makes
            // the height transition actually clip the text while it expands.
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <p className="px-5 pb-5 text-muted-foreground">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function LandingPage({ onGetStarted, onOpenLegal }: LandingPageProps) {
  const [openFaq, setOpenFaq] = useState<string | null>(FAQS[0].q)

  return (
    <div className="w-full">
      {/* ---------------------------------------------------------------- Hero */}
      <section className="relative overflow-hidden px-6 pb-20 pt-16 sm:pt-24">
        {/* Decorative brand wash. Two offset radial tints in the brand pink and
            teal, plus a faint grid, so the hero reads as lit rather than as a
            flat panel. Pointer-events-none keeps it from eating clicks. */}
        {/* The page shell caps content at a max-width, so this layer is
            narrower than the viewport and would otherwise end in a visible
            rectangle -- a hard seam down the right side and across the bottom,
            obvious in light mode. Widening it to 100vw doesn't help because
            the section's overflow-hidden clips it straight back to the column.
            So instead of trying to reach the edges, it fades out before them:
            the radial mask takes the wash to fully transparent on every side,
            leaving no edge to see. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_50%_55%_at_50%_32%,black_25%,transparent_100%)]"
        >
          <div className="absolute left-1/2 top-[-18rem] h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-primary/20 blur-[120px]" />
          <div className="absolute right-[-10rem] top-[6rem] h-[28rem] w-[28rem] rounded-full bg-accent/20 blur-[120px]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border-hsl)/0.35)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border-hsl)/0.35)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
        </div>

        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
          <div>
            <Reveal>
              <span className="inline-flex items-center gap-2 rounded-pill border border-primary/30 bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                </span>
                Real-time collaborative coding
              </span>
            </Reveal>

            <Reveal delay={0.06}>
              <h1 className="mt-6 text-balance text-4xl font-bold leading-[1.1] tracking-tight sm:text-6xl">
                Code together,{' '}
                <span className="bg-gradient-primary bg-clip-text px-[0.16em] font-script text-5xl text-transparent sm:text-7xl -mx-[0.16em]">
                  in real time.
                </span>
              </h1>
            </Reveal>

            <Reveal delay={0.12}>
              <p className="mt-6 max-w-xl text-lg text-muted-foreground">
                One shared editor for your whole team — live cursors, chat, git, sandboxed
                execution, and an AI assistant, all in the same tab.
              </p>
            </Reveal>

            <Reveal delay={0.18}>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <ShimmerButton onClick={onGetStarted} className="shadow-glow text-[hsl(var(--on-brand))]">
                  <span className="inline-flex items-center gap-2">
                    Get started — it's free
                    <ArrowRight aria-hidden="true" size={18} />
                  </span>
                </ShimmerButton>
              </div>
              {/* Asserted verbatim by the end-to-end suite as the signed-out
                  marker on "/" -- keep the wording byte-for-byte. */}
              <p className="mt-4 text-sm text-muted-foreground">
                Sign in to create or manage your projects.
              </p>
            </Reveal>
          </div>

          {/* Editor preview */}
          <Reveal delay={0.24}>
            <div
              aria-hidden="true"
              className="rounded-lg border border-border bg-card/80 shadow-elegant backdrop-blur-md"
            >
              <div className="flex items-center gap-2 border-b border-border px-4 py-3">
                <span className="h-3 w-3 rounded-full bg-destructive/70" />
                <span className="h-3 w-3 rounded-full bg-primary/70" />
                <span className="h-3 w-3 rounded-full bg-accent/70" />
                <span className="ml-2 font-mono text-xs text-muted-foreground">main.js</span>
                <span className="ml-auto flex -space-x-2">
                  <span className="grid h-6 w-6 place-items-center rounded-full border-2 border-card bg-primary text-[10px] font-semibold text-primary-foreground">
                    A
                  </span>
                  <span className="grid h-6 w-6 place-items-center rounded-full border-2 border-card bg-accent text-[10px] font-semibold text-accent-foreground">
                    S
                  </span>
                </span>
              </div>
              <div className="space-y-1 p-5 font-mono text-sm leading-relaxed">
                {PREVIEW_LINES.map((line, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + i * 0.12, duration: 0.4 }}
                  >
                    {line.map((token, j) => (
                      <span key={j} className={token.tok}>
                        {token.text}
                      </span>
                    ))}
                  </motion.div>
                ))}
                <motion.span
                  className="inline-block h-4 w-[2px] translate-y-[3px] bg-primary"
                  animate={{ opacity: [1, 0] }}
                  transition={{ repeat: Infinity, repeatType: 'reverse', duration: 0.6 }}
                />
              </div>
            </div>
          </Reveal>
        </div>

        {/* Language strip */}
        <Reveal delay={0.3}>
          <div className="mx-auto mt-16 flex max-w-4xl flex-wrap items-center justify-center gap-x-6 gap-y-3">
            <span className="text-sm text-muted-foreground">Runs for real in</span>
            {LANGUAGES.map((lang) => (
              <span
                key={lang}
                className="rounded-pill border border-border bg-card/60 px-3 py-1 font-mono text-sm"
              >
                {lang}
              </span>
            ))}
          </div>
        </Reveal>
      </section>

      {/* --------------------------------------------------------- How it works */}
      <section className="px-6 py-20">
        <Reveal>
          <SectionTitle lead="How it" accent="works" />
          <p className="mt-4 text-center text-muted-foreground">
            From an empty dashboard to shipping code, together.
          </p>
        </Reveal>

        <div className="mx-auto mt-12 grid max-w-6xl gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {TIMELINE_STEPS.map((step, i) => (
            <Reveal key={step.label} delay={i * 0.07}>
              <div className="group h-full rounded-lg border border-border bg-card/60 p-5 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-glow">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-primary font-semibold text-primary-foreground">
                  {i + 1}
                </span>
                <h3 className="mt-4 font-semibold">{step.label}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{step.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------- Features */}
      <section className="px-6 py-20">
        <Reveal>
          <SectionTitle lead="Everything you need to" accent="ship" />
          <p className="mt-4 text-center text-muted-foreground">
            Real collaboration, a real sandbox, and real git — not a toy demo.
          </p>
        </Reveal>

        <div className="mx-auto mt-12 grid max-w-6xl gap-5 sm:grid-cols-2">
          {FEATURES.map((f, i) => {
            const Icon = f.icon
            return (
              <Reveal key={f.title} delay={i * 0.07}>
                <div className="group relative h-full overflow-hidden rounded-lg border border-border bg-card/60 p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-glow">
                  {/* Brand wash that only appears on hover, behind the content. */}
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 -z-10 bg-gradient-primary opacity-0 transition-opacity duration-300 group-hover:opacity-[0.06]"
                  />
                  <span className="inline-grid h-11 w-11 place-items-center rounded-lg bg-gradient-primary text-primary-foreground">
                    <Icon aria-hidden="true" size={20} />
                  </span>
                  <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
                  <p className="mt-1 text-muted-foreground">{f.body}</p>
                  <ul className="mt-4 space-y-2">
                    {f.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-2 text-sm">
                        <Check aria-hidden="true" size={16} className="mt-0.5 shrink-0 text-accent" />
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            )
          })}
        </div>
      </section>

      {/* -------------------------------------------------------- See it in action */}
      <section className="px-6 py-20">
        <Reveal>
          <SectionTitle lead="See it in" accent="action" />
          <p className="mt-4 text-center text-muted-foreground">
            A platform designed to feel like one shared room.
          </p>
        </Reveal>

        <div className="mx-auto mt-12 grid max-w-6xl gap-5 lg:grid-cols-3" aria-hidden="true">
          <Reveal>
            <div className="h-full rounded-lg border border-border bg-card/60 backdrop-blur-sm">
              <div className="flex items-center gap-2 border-b border-border px-4 py-3 text-sm font-medium">
                <Users aria-hidden="true" size={16} className="text-primary" />
                Presence
              </div>
              <div className="space-y-3 p-4">
                <div className="flex items-center gap-2 text-sm">
                  <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                  Alex
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="h-2.5 w-2.5 rounded-full bg-accent" />
                  Sam
                </div>
                <div className="rounded-lg bg-muted/60 p-3 text-sm">
                  <span className="mr-2 font-semibold text-accent">Sam</span>
                  can you check the auth flow?
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.08}>
            <div className="h-full rounded-lg border border-border bg-card/60 backdrop-blur-sm">
              <div className="flex items-center gap-2 border-b border-border px-4 py-3 text-sm font-medium">
                <Terminal aria-hidden="true" size={16} className="text-primary" />
                Terminal
              </div>
              <div className="space-y-1 p-4 font-mono text-sm">
                <div>$ npm test</div>
                <div className="text-accent">✓ all tests passed (12ms)</div>
                <div className="text-muted-foreground">exit code 0</div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.16}>
            <div className="h-full rounded-lg border border-border bg-card/60 backdrop-blur-sm">
              <div className="flex items-center gap-2 border-b border-border px-4 py-3 text-sm font-medium">
                <MessageSquare aria-hidden="true" size={16} className="text-primary" />
                My Projects
              </div>
              <div className="space-y-2 p-4">
                {[
                  { name: 'api-gateway', meta: 'private', role: 'editor' },
                  { name: 'design-system', meta: 'public', role: 'owner' },
                ].map((p) => (
                  <div
                    key={p.name}
                    className="flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-2 text-sm"
                  >
                    <span className="font-medium">{p.name}</span>
                    <span className="text-muted-foreground">{p.meta}</span>
                    <span className="ml-auto rounded-pill bg-primary/15 px-2 py-0.5 text-xs text-primary">
                      {p.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ------------------------------------------------------------------ FAQ */}
      <section className="px-6 py-20">
        <Reveal>
          <SectionTitle lead="Questions? We've got" accent="answers" />
        </Reveal>
        <div className="mx-auto mt-12 max-w-3xl space-y-3">
          {FAQS.map((item, i) => (
            <Reveal key={item.q} delay={i * 0.05}>
              <FaqItem
                q={item.q}
                a={item.a}
                open={openFaq === item.q}
                onToggle={() => setOpenFaq(openFaq === item.q ? null : item.q)}
              />
            </Reveal>
          ))}
        </div>
      </section>

      {/* -------------------------------------------------------------- Closing */}
      <section className="px-6 py-20">
        <Reveal>
          <div className="relative mx-auto max-w-4xl overflow-hidden rounded-lg border border-primary/25 bg-card/60 px-6 py-14 text-center backdrop-blur-sm">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 -z-10 bg-gradient-primary opacity-[0.07]"
            />
            <SectionTitle lead="Ready to start your next" accent="project?" />
            <p className="mt-4 text-muted-foreground">
              Free to join. Invite your team when you're ready.
            </p>
            <div className="mt-8 flex justify-center">
              <ShimmerButton onClick={onGetStarted} className="shadow-glow text-[hsl(var(--on-brand))]">
                <span className="inline-flex items-center gap-2">
                  Get started — it's free
                  <ArrowRight aria-hidden="true" size={18} />
                </span>
              </ShimmerButton>
            </div>
          </div>
        </Reveal>
      </section>

      {/* --------------------------------------------------------------- Footer */}
      <footer className="mt-10 flex flex-col items-center gap-4 border-t border-border px-6 py-10 text-sm text-muted-foreground sm:flex-row sm:justify-between">
        <span className="flex items-center gap-2 font-semibold text-foreground">
          <span className="bg-gradient-primary bg-clip-text text-transparent">◆</span>
          CodeMesh
        </span>
        <span>Real-time collaborative coding.</span>
        <nav className="flex gap-5">
          <button
            type="button"
            className="transition-colors hover:text-primary"
            onClick={() => onOpenLegal('privacy')}
          >
            Privacy
          </button>
          <button
            type="button"
            className="transition-colors hover:text-primary"
            onClick={() => onOpenLegal('terms')}
          >
            Terms
          </button>
        </nav>
      </footer>
    </div>
  )
}

export default LandingPage
