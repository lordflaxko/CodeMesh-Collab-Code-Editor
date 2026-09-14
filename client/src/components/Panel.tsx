import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface PanelProps {
  title: ReactNode
  onClose?: () => void
  /** Controls rendered in the header, to the left of the close button. */
  actions?: ReactNode
  children: ReactNode
  className?: string
  /** Applied to the scrolling body, for panels that need their own padding. */
  bodyClassName?: string
}

/**
 * The shared frame every side panel sits in.
 *
 * Panels used to each bring their own root class (.deploy-panel, .run-panel,
 * .members-panel, …) while sharing a header class confusingly named
 * .chat-panel-header, so the same chrome was described in a dozen places and
 * drifted between them. One component now owns it.
 *
 * The close control keeps the accessible name "Close" even though it renders as
 * an icon: the end-to-end suite clicks getByRole('button', { name: 'Close' }),
 * and more importantly an icon-only button with no name is unusable with a
 * screen reader.
 */
export function Panel({ title, onClose, actions, children, className, bodyClassName }: PanelProps) {
  return (
    <div
      className={cn(
        'flex min-h-0 flex-col overflow-hidden rounded-lg border border-border bg-card/70 shadow-elegant backdrop-blur-sm',
        className,
      )}
    >
      {/* 2px of brand gradient along the top edge, carried over from the old
          .members-panel rule -- it marks the panel as part of the app's chrome
          rather than as another flat card. */}
      <span aria-hidden="true" className="h-[2px] shrink-0 bg-gradient-primary" />

      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border px-3 py-2">
        <span className="truncate text-sm font-semibold">{title}</span>
        <div className="flex shrink-0 items-center gap-1.5">
          {actions}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X aria-hidden="true" size={15} />
            </button>
          )}
        </div>
      </div>

      <div className={cn('min-h-0 flex-1 overflow-y-auto', bodyClassName)}>{children}</div>
    </div>
  )
}

/** Small status pill — roles, counts, states. */
export function Pill({
  children,
  tone = 'brand',
  className,
}: {
  children: ReactNode
  tone?: 'brand' | 'accent' | 'muted' | 'danger'
  className?: string
}) {
  const tones = {
    brand: 'bg-primary/15 text-primary',
    accent: 'bg-accent/15 text-accent',
    muted: 'bg-muted text-muted-foreground',
    danger: 'bg-destructive/15 text-destructive',
  }
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-pill px-2 py-0.5 text-xs font-medium',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

/** Placeholder shown when a panel or list has nothing to show yet. */
export function EmptyState({
  icon,
  title,
  hint,
  className,
}: {
  icon?: ReactNode
  title: ReactNode
  hint?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('px-6 py-10 text-center', className)}>
      {icon && <span className="inline-flex text-muted-foreground">{icon}</span>}
      <p className="mt-3 text-sm font-medium">{title}</p>
      {hint && <span className="mt-1 block text-xs text-muted-foreground">{hint}</span>}
    </div>
  )
}

/** Pulsing placeholder rows, so a list keeps its shape while it loads. */
export function SkeletonRows({ rows = 3, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn('space-y-2 p-3', className)} aria-hidden="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-9 animate-pulse rounded-md bg-muted/60" />
      ))}
    </div>
  )
}
