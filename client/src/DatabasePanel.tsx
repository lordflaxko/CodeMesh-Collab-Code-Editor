import { Panel } from './components/Panel'
import { useState } from 'react'
import { runDatabaseQuery, type DbQueryResult } from './database'

interface DatabasePanelProps {
  room: string
  sessionToken: string | null
  onClose: () => void
}

// PostgreSQL only, read-only (enforced server-side via a READ ONLY
// transaction, not a client-side check). The connection string is never
// stored -- same "re-enter it every time" pattern as the GitHub token in
// Source Control's Remote tab -- and this only reaches the server at all
// because a browser can't speak Postgres's wire protocol directly; the
// server itself connects outbound on your behalf, which is why this needs
// editor access on a private project (enforced server-side regardless of
// what this panel does or doesn't show).
const FIELD =
  'text-input w-full rounded-md border border-border bg-card px-2.5 py-1.5 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary'

function DatabasePanel({ room, sessionToken, onClose }: DatabasePanelProps) {
  const [connectionString, setConnectionString] = useState('')
  const [query, setQuery] = useState('')
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<DbQueryResult | null>(null)

  function handleRun() {
    if (!connectionString.trim() || !query.trim() || running) return
    setRunning(true)
    setError(null)
    setResult(null)
    runDatabaseQuery(room, sessionToken, connectionString.trim(), query.trim())
      .then(setResult)
      .catch((err) => setError(err instanceof Error ? err.message : 'Query failed'))
      .finally(() => setRunning(false))
  }

  return (
    <Panel
      title="Database"
      onClose={onClose}
      className="h-fit max-h-[80vh] w-[340px] shrink-0"
      bodyClassName="space-y-3 p-3"
    >
      <div className="space-y-3">
        <input
          className={FIELD}
          type="password"
          value={connectionString}
          onChange={(e) => setConnectionString(e.target.value)}
          placeholder="postgres://user:password@host:5432/dbname"
        />
        <div className="rounded-md bg-muted/40 p-2 text-xs text-muted-foreground">Never stored -- re-enter each time you open this panel.</div>
        <textarea
          className="comment-textarea database-query-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="SELECT * FROM ..."
        />
        <button
          type="button"
          className="shrink-0 rounded-md bg-gradient-primary px-3 py-1.5 text-xs font-medium text-[hsl(var(--on-brand))] transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={handleRun}
          disabled={running || !connectionString.trim() || !query.trim()}
        >
          {running ? 'Running…' : 'Run Query (read-only)'}
        </button>
        {error && <div className="format-error rounded-md border border-destructive/30 bg-destructive/10 p-2 text-xs text-destructive">{error}</div>}
        {result && (
          <div className="database-results">
            {result.truncated && (
              <div className="rounded-md bg-muted/40 p-2 text-xs text-muted-foreground">
                Showing first {result.rows.length} of {result.rowCount} rows.
              </div>
            )}
            {result.rows.length === 0 ? (
              <div className="sc-empty px-2 py-6 text-center text-sm text-muted-foreground">No rows returned</div>
            ) : (
              <div className="database-table-wrap">
                <table className="database-table">
                  <thead>
                    <tr>
                      {result.fields.map((f) => (
                        <th key={f}>{f}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.rows.map((row, i) => (
                      <tr key={i}>
                        {result.fields.map((f) => (
                          <td key={f}>{row[f] === null || row[f] === undefined ? '' : String(row[f])}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </Panel>
  )
}

export default DatabasePanel
