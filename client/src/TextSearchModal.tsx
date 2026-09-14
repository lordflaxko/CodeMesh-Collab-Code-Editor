import { useMemo, useState, type KeyboardEvent } from 'react'
import { useEscapeToClose } from './useEscapeToClose'
import { searchProjectText, type TextMatch } from './textSearch'

interface TextSearchModalProps {
  getAllFiles: () => { id: string; name: string; content: string }[]
  onJump: (match: { fileId: string; from: number }) => void
  onClose: () => void
}

function TextSearchModal({ getAllFiles, onJump, onClose }: TextSearchModalProps) {
  useEscapeToClose(onClose)
  const [query, setQuery] = useState('')
  const [highlighted, setHighlighted] = useState(0)

  const results = useMemo(() => {
    const trimmed = query.trim()
    return trimmed ? searchProjectText(getAllFiles(), trimmed) : []
    // getAllFiles reads live content on demand -- it's intentionally not a
    // dependency here, since its identity changing shouldn't by itself
    // re-run a search against a query that hasn't changed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  function jump(match: TextMatch) {
    onJump(match)
    onClose()
  }

  function handleKeyDown(e: KeyboardEvent) {
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
      <div className="symbol-search-modal text-search-modal w-full max-w-xl overflow-hidden rounded-lg border border-border bg-card/95 shadow-elegant backdrop-blur-md" onClick={(e) => e.stopPropagation()}>
        <input
          className="text-input w-full border-0 border-b border-border bg-transparent px-4 py-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary"
          autoFocus
          placeholder="Find in files…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setHighlighted(0)
          }}
          onKeyDown={handleKeyDown}
        />
        <ul className="max-h-[50vh] overflow-y-auto p-1.5">
          {query.trim() === '' ? (
            <li className="sc-empty px-4 py-8 text-center text-sm text-muted-foreground">Type to search across all files</li>
          ) : results.length === 0 ? (
            <li className="sc-empty px-4 py-8 text-center text-sm text-muted-foreground">No matches</li>
          ) : (
            results.map((m, i) => (
              <li
                key={`${m.fileId}:${m.from}`}
                className={`symbol-result flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors ${
                  i === highlighted ? 'bg-primary/15 text-primary' : 'hover:bg-muted'
                }`}
                onMouseEnter={() => setHighlighted(i)}
                onClick={() => jump(m)}
              >
                <span className="symbol-location text-search-location">
                  {m.fileName}:{m.line}
                </span>
                <span className="symbol-name text-search-snippet">{m.lineText.trim()}</span>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  )
}

export default TextSearchModal
