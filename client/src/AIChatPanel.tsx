import { Panel } from './components/Panel'
import { useEffect, useState } from 'react'
import type * as Y from 'yjs'
import { useAiChat, askAssistant } from './aiChat'

interface AIChatPanelProps {
  ydoc: Y.Doc
  room: string
  sessionToken: string | null
  activeFileId: string | null
  onClose: () => void
  // "Debug with AI" buttons elsewhere (Run/Test failures) fill this in to
  // seed the draft with a ready-made question -- prefillKey changes on every
  // request so clicking it again re-fills the box even with the same text.
  prefill?: string
  prefillKey?: number
}

function timeLabel(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const FIELD =
  'text-input w-full rounded-md border border-border bg-card px-2.5 py-1.5 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary'

function AIChatPanel({
  ydoc,
  room,
  sessionToken,
  activeFileId,
  onClose,
  prefill,
  prefillKey,
}: AIChatPanelProps) {
  const messages = useAiChat(ydoc)
  const [draft, setDraft] = useState('')
  const [asking, setAsking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (prefill !== undefined) setDraft(prefill)
    // Only re-run when a new debug request comes in (prefillKey changes),
    // not on every keystroke of the user's own edits to the draft.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefillKey])

  function submit() {
    const question = draft.trim()
    if (!question || asking) return
    setAsking(true)
    setError(null)
    setDraft('')
    askAssistant(room, question, sessionToken, activeFileId).catch((err) =>
      setError(err instanceof Error ? err.message : 'The assistant could not be reached'),
    ).finally(() => setAsking(false))
  }

  return (
    <Panel
      title="AI Assistant"
      onClose={onClose}
      className="ai-chat-panel h-fit max-h-[80vh] w-[340px] shrink-0"
      bodyClassName="space-y-3 p-3"
    >
      <div className="chat-messages max-h-[320px] space-y-3 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="sc-empty px-2 py-6 text-center text-sm text-muted-foreground">
            Ask a question about the currently open file, or about this project in general.
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`chat-message${message.role === 'assistant' ? ' ai-message' : ''}`}
            >
              <span className="text-sm font-semibold">
                {message.role === 'assistant' ? 'Assistant' : message.author}
              </span>{' '}
              <span className="text-xs text-muted-foreground">{timeLabel(message.timestamp)}</span>
              <p className={`comment-text ai-message-text${message.error ? ' ai-message-error' : ''}`}>
                {message.text}
              </p>
            </div>
          ))
        )}
        {asking && <div className="sc-loading px-2 py-6 text-center text-sm text-muted-foreground">Thinking…</div>}
      </div>
      {error && <div className="format-error rounded-md border border-destructive/30 bg-destructive/10 p-2 text-xs text-destructive">{error}</div>}
      <form
        className="chat-compose"
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
      >
        <input
          className={FIELD}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Ask about this code…"
          disabled={asking}
        />
        <button type="submit" className="shrink-0 rounded-md bg-gradient-primary px-3 py-1.5 text-xs font-medium text-[hsl(var(--on-brand))] transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50" disabled={asking || !draft.trim()}>
          {asking ? 'Asking…' : 'Ask'}
        </button>
      </form>
    </Panel>
  )
}

export default AIChatPanel
