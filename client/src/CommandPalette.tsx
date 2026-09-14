import { useMemo, useState } from 'react'
import { useEscapeToClose } from './useEscapeToClose'

export interface Command {
  id: string
  label: string
  group: string
  disabled?: boolean
  run: () => void
}

interface CommandPaletteProps {
  commands: Command[]
  onClose: () => void
}

function CommandPalette({ commands, onClose }: CommandPaletteProps) {
  useEscapeToClose(onClose)
  const [query, setQuery] = useState('')
  const [highlighted, setHighlighted] = useState(0)

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    const available = commands.filter((c) => !c.disabled)
    if (!q) return available
    return available.filter(
      (c) => c.label.toLowerCase().includes(q) || c.group.toLowerCase().includes(q),
    )
  }, [commands, query])

  function run(command: Command) {
    onClose()
    command.run()
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlighted((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlighted((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && results[highlighted]) {
      run(results[highlighted])
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 pt-[12vh] backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-xl overflow-hidden rounded-lg border border-border bg-card/95 shadow-elegant backdrop-blur-md" onClick={(e) => e.stopPropagation()}>
        <input
          className="text-input w-full border-0 border-b border-border bg-transparent px-4 py-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary"
          autoFocus
          placeholder="Type a command…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setHighlighted(0)
          }}
          onKeyDown={handleKeyDown}
        />
        <ul className="max-h-[50vh] overflow-y-auto p-1.5">
          {results.length === 0 ? (
            <li className="sc-empty px-4 py-8 text-center text-sm text-muted-foreground">No matching commands</li>
          ) : (
            results.map((c, i) => (
              <li
                key={c.id}
                className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors ${
                  i === highlighted ? 'bg-primary/15 text-primary' : 'hover:bg-muted'
                }`}
                onMouseEnter={() => setHighlighted(i)}
                onClick={() => run(c)}
              >
                <span className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{c.group}</span>
                <span className="flex-1 truncate">{c.label}</span>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  )
}

export default CommandPalette
