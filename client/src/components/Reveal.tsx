import { motion, useReducedMotion } from 'motion/react'
import type { ReactNode } from 'react'

interface RevealProps {
  children: ReactNode
  /** Stagger position within a group, in seconds. */
  delay?: number
  className?: string
}

/**
 * Fades and lifts its children into place the first time they scroll into view.
 *
 * `once: true` matters: without it the animation replays every time the user
 * scrolls back up, which reads as the page glitching rather than as motion.
 * The 120px bottom margin starts the transition slightly before the element
 * reaches the viewport, so it has finished by the time it is properly on
 * screen instead of animating under the reader's eye.
 *
 * Respects prefers-reduced-motion by rendering the end state immediately --
 * the content must never depend on the animation to become visible.
 */
export function Reveal({ children, delay = 0, className }: RevealProps) {
  const reduced = useReducedMotion()

  if (reduced) return <div className={className}>{children}</div>

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -120px 0px' }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}
