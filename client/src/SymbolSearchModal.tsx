import { useMemo, useState } from 'react'
import type { ProjectSymbol } from './symbolIndex'
import { useEscapeToClose } from './useEscapeToClose'

interface SymbolSearchModalProps {
  symbols: ProjectSymbol[]
  onJump: (symbol: ProjectSymbol) => void
  onClose: () => void
}

function SymbolSearchModal({ symbols, onJump, onClose }: SymbolSearchModalProps) {
  useEscapeToClose(onClose)
  const [query, setQuery] = useState('')
  const [highlighted, setHighlighted] = useState(0)

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    const matches = q ? symbols.filter((s) => s.name.toLowerCase().includes(q)) : symbols
    return matches
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name) || a.fileName.localeCompare(b.fileName))
      .slice(0, 50)
  }, [symbols, query])

  function jump(symbol: ProjectSymbol) {
    onJump(symbol)
    onClose()
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlighted((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlighted((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && results[highlighted]) {
      jump(results[highlighted])
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 pt-[12vh] backdrop-blur-sm" onClick={onClose}>
      <div className="symbol-search-modal w-full max-w-xl overflow-hidden rounded-lg border border-border bg-card/95 shadow-elegant backdrop-blur-md" onClick={(e) => e.stopPropagation()}>
        <input
          className="text-input w-full border-0 border-b border-border bg-transparent px-4 py-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary"
          autoFocus
          placeholder="Go to symbol…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setHighlighted(0)
          }}
          onKeyDown={handleKeyDown}
        />
        <ul className="max-h-[50vh] overflow-y-auto p-1.5">
          {results.length === 0 ? (
            <li className="sc-empty px-4 py-8 text-center text-sm text-muted-foreground">No matching symbols</li>
          ) : (
            results.map((s, i) => (
              <li
                key={`${s.fileId}:${s.from}`}
                className={`symbol-result flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors ${
                  i === highlighted ? 'bg-primary/15 text-primary' : 'hover:bg-muted'
                }`}
                onMouseEnter={() => setHighlighted(i)}
                onClick={() => jump(s)}
              >
                <span className="shrink-0 rounded bg-accent/15 px-1.5 py-0.5 font-mono text-[0.65rem] text-accent">{s.kind}</span>
                <span className="min-w-0 flex-1 truncate font-mono">{s.name}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {s.fileName}:{s.line}
                </span>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  )
}

export default SymbolSearchModal
