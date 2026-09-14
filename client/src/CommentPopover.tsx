import { useState, type CSSProperties, type FormEvent } from 'react'
import type { Coords } from './CodeEditor'
import type { CommentThreadData } from './comments'
import MentionInput from './MentionInput'
import MentionText from './MentionText'
import Reactions from './Reactions'
import { useEscapeToClose } from './useEscapeToClose'

interface NewThreadPopoverProps {
  mode: 'new'
  coords: Coords
  participants: string[]
  onSubmit: (text: string) => void
  onClose: () => void
}

interface ViewThreadPopoverProps {
  mode: 'view'
  coords: Coords
  thread: CommentThreadData
  participants: string[]
  currentUser: string
  onReply: (text: string) => void
  onToggleResolved: () => void
  onToggleReaction: (itemId: string, emoji: string) => void
  onClose: () => void
}

type CommentPopoverProps = NewThreadPopoverProps | ViewThreadPopoverProps

function timeLabel(createdAt: number) {
  return new Date(createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const FIELD =
  'text-input w-full rounded-md border border-border bg-card px-2.5 py-1.5 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary'
const BTN =
  'inline-flex shrink-0 items-center gap-1 rounded-md border border-border px-2 py-1 text-xs transition-colors hover:border-primary/50 hover:text-primary'

function CommentPopover(props: CommentPopoverProps) {
  useEscapeToClose(props.onClose)
  const [draft, setDraft] = useState('')
  const style = {
    top: props.coords.bottom + 6,
    left: props.coords.left,
  } as CSSProperties

  if (props.mode === 'new') {
    return (
      <div
      className="comment-popover z-50 w-[320px] overflow-hidden rounded-lg border border-border bg-card/95 shadow-elegant backdrop-blur-md"
      style={style}
    >
        <MentionInput
          className={`comment-textarea ${FIELD} min-h-[60px] resize-y`}
          value={draft}
          onChange={setDraft}
          participants={props.participants}
          placeholder="Leave a comment…"
          multiline
          autoFocus
        />
        <div className="comment-popover-actions flex items-center gap-1.5">
          <button
            type="button"
            className={BTN}
            disabled={!draft.trim()}
            onClick={() => draft.trim() && props.onSubmit(draft.trim())}
          >
            Comment
          </button>
          <button type="button" className={BTN} onClick={props.onClose}>
            Cancel
          </button>
        </div>
      </div>
    )
  }

  const { thread } = props

  function submitReply(e: FormEvent) {
    e.preventDefault()
    if (props.mode !== 'view' || !draft.trim()) return
    props.onReply(draft.trim())
    setDraft('')
  }

  return (
    <div
      className="comment-popover z-50 w-[320px] overflow-hidden rounded-lg border border-border bg-card/95 shadow-elegant backdrop-blur-md"
      style={style}
    >
      <div className="flex items-center justify-end gap-1.5 border-b border-border px-2.5 py-2">
        <button type="button" className={BTN} onClick={props.onToggleResolved}>
          {thread.resolved ? 'Reopen' : 'Resolve'}
        </button>
        <button type="button" className={BTN} onClick={props.onClose}>
          Close
        </button>
      </div>
      <ul className="max-h-[280px] space-y-2 overflow-y-auto p-2.5">
        <li className="rounded-md bg-muted/30 p-2.5">
          <span className="text-sm font-semibold" style={{ color: thread.color }}>
            {thread.author}
          </span>{' '}
          <span className="text-xs text-muted-foreground">{timeLabel(thread.createdAt)}</span>
          <p className="mt-1 whitespace-pre-wrap break-words text-sm">
            <MentionText text={thread.text} />
          </p>
          <Reactions
            reactions={thread.reactions}
            currentUser={props.currentUser}
            onToggle={(emoji) => props.onToggleReaction(thread.id, emoji)}
          />
        </li>
        {thread.replies.map((reply) => (
          <li key={reply.id} className="ml-3 rounded-md border-l-2 border-border bg-muted/40 p-2">
            <span className="text-sm font-semibold" style={{ color: reply.color }}>
              {reply.author}
            </span>{' '}
            <span className="text-xs text-muted-foreground">{timeLabel(reply.createdAt)}</span>
            <p className="mt-1 whitespace-pre-wrap break-words text-sm">
              <MentionText text={reply.text} />
            </p>
            <Reactions
              reactions={reply.reactions}
              currentUser={props.currentUser}
              onToggle={(emoji) => props.onToggleReaction(reply.id, emoji)}
            />
          </li>
        ))}
      </ul>
      <form className="comment-reply-form flex items-center gap-2 border-t border-border p-2.5" onSubmit={submitReply}>
        <MentionInput
          className={FIELD}
          value={draft}
          onChange={setDraft}
          participants={props.participants}
          placeholder="Reply…"
        />
        <button type="submit" className={BTN} disabled={!draft.trim()}>
          Reply
        </button>
      </form>
    </div>
  )
}

export default CommentPopover
