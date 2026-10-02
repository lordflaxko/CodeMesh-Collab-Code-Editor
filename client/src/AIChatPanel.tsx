import { FileText } from 'lucide-react'
import { Panel } from './components/Panel'
import { useEffect, useRef, useState } from 'react'
import type * as Y from 'yjs'
import { useAiChat, useAiStreaming, askAssistant } from './aiChat'

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

/** "Context: main.js" under an answer, so it is clear what the model was shown. */
function Sources({ sources }: { sources?: string[] }) {
  if (!sources || sources.length === 0) return null
  return (
    <span className="ai-message-sources mt-1.5 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
      <FileText aria-hidden="true" size={12} />
      Context:
      {sources.map((name) => (
        <code key={name} className="rounded bg-muted px-1 py-0.5 font-mono text-[0.7rem]">
          {name}
        </code>
      ))}
    </span>
  )
}

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
  const streaming = useAiStreaming(ydoc)
  const [draft, setDraft] = useState('')
  const [asking, setAsking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (prefill !== undefined) setDraft(prefill)
    // Only re-run when a new debug request comes in (prefillKey changes),
    // not on every keystroke of the user's own edits to the draft.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefillKey])

  // Follow the conversation as it grows, including while a reply streams in --
  // otherwise the newest text writes itself just below the fold.
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages.length, streaming?.text])

  function submit() {
    const question = draft.trim()
    if (!question || asking) return
    setAsking(true)
    setError(null)
    setDraft('')
    askAssistant(room, question, sessionToken, activeFileId)
      .catch((err) =>
        setError(err instanceof Error ? err.message : 'The assistant could not be reached'),
      )
      .finally(() => setAsking(false))
  }

  // A reply is already visible once it starts streaming, so the generic
  // "Thinking…" line only belongs in the gap before the first token lands.
  const waiting = asking && !streaming

  return (
    <Panel
      title="AI Assistant"
      onClose={onClose}
      className="ai-chat-panel h-fit max-h-[80vh] w-[340px] shrink-0"
      bodyClassName="space-y-3 p-3"
    >
      <div className="chat-messages max-h-[320px] space-y-3 overflow-y-auto">
        {messages.length === 0 && !streaming ? (
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
              {message.role === 'assistant' && !message.error && (
                <Sources sources={message.sources} />
              )}
            </div>
          ))
        )}

        {streaming && (
          <div className="chat-message ai-message ai-message-streaming">
            <span className="text-sm font-semibold">{streaming.author}</span>{' '}
            <span className="text-xs text-muted-foreground">answering…</span>
            <p className="comment-text ai-message-text">
              {streaming.text}
              {/* Caret on the end of the partial text, so a pause between
                  chunks reads as thinking rather than as a stall. */}
              <span className="ml-0.5 inline-block h-3.5 w-[2px] translate-y-[2px] animate-pulse bg-primary align-middle" />
            </p>
            <Sources sources={streaming.sources} />
          </div>
        )}

        {waiting && (
          <div className="sc-loading px-2 py-6 text-center text-sm text-muted-foreground">
            Thinking…
          </div>
        )}
        <div ref={endRef} />
      </div>

      {error && (
        <div className="format-error rounded-md border border-destructive/30 bg-destructive/10 p-2 text-xs text-destructive">
          {error}
        </div>
      )}

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
        <button
          type="submit"
          className="shrink-0 rounded-md bg-gradient-primary px-3 py-1.5 text-xs font-medium text-[hsl(var(--on-brand))] transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={asking || !draft.trim()}
        >
          {asking ? 'Asking…' : 'Ask'}
        </button>
      </form>
    </Panel>
  )
}

export default AIChatPanel
