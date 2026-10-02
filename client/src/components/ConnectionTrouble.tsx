import { AlertTriangle, RefreshCw } from 'lucide-react'
import { WS_SERVER_URL } from '../api'

interface ConnectionTroubleProps {
  onRetry: () => void
}

/** The hostname the editor is actually failing to reach, for the message below. */
const host = (() => {
  try {
    return new URL(WS_SERVER_URL).host
  } catch {
    return WS_SERVER_URL
  }
})()

/**
 * Shown when the editor has been unable to connect for several seconds.
 *
 * It used to sit on "Connecting…" indefinitely with no explanation, which took
 * a browser-to-browser comparison to diagnose: an ad blocker was dropping every
 * request to the API host, because the server runs on a dynamic-DNS domain and
 * some blocklists ban those wholesale (they are commonly abused for malware).
 * Nothing about the old UI hinted at that, so the site simply looked broken.
 *
 * The causes are ordered by how often they are the answer, and the host is
 * named so it can be allowlisted without guessing.
 */
export function ConnectionTrouble({ onRetry }: ConnectionTroubleProps) {
  return (
    <div
      role="status"
      className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm"
    >
      <div className="flex items-start gap-2">
        <AlertTriangle aria-hidden="true" size={16} className="mt-0.5 shrink-0 text-destructive" />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-destructive">Can't reach the collaboration server</p>
          <p className="mt-1 text-muted-foreground">
            Still trying to connect to <code className="font-mono text-foreground">{host}</code>.
            Your edits won't sync until it connects. The usual causes:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
            <li>
              <span className="text-foreground">An ad blocker or privacy extension.</span> Some
              blocklists ban dynamic-DNS domains wholesale, which covers this host. Allowlisting it
              fixes it — in uBlock Origin, add{' '}
              <code className="rounded bg-muted px-1 font-mono text-xs">@@||{host}^</code> under
              “My filters”.
            </li>
            <li>
              <span className="text-foreground">A network that blocks WebSockets</span> — common on
              school and workplace Wi-Fi.
            </li>
            <li>
              <span className="text-foreground">The server restarting.</span> That clears on its own
              within a few seconds.
            </li>
          </ul>
          <button
            type="button"
            onClick={onRetry}
            className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs transition-colors hover:border-primary/50 hover:text-primary"
          >
            <RefreshCw aria-hidden="true" size={13} />
            Try again
          </button>
        </div>
      </div>
    </div>
  )
}
