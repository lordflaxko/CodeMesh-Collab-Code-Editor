import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merges class names the way every shadcn/Watermelon component expects.
 *
 * clsx flattens conditionals and arrays; twMerge then resolves Tailwind
 * conflicts so a later class wins instead of both landing in the DOM and
 * leaving the winner to CSS source order. Without it, passing `className`
 * into a component to override a built-in style silently does nothing.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
