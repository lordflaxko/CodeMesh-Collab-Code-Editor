import { Panel } from './components/Panel'
import { useState } from 'react'
import type * as Y from 'yjs'
import { Smile } from 'lucide-react'
import { useChat, sendMessage, replyToMessage, toggleChatReaction } from './chat'
import { extractMentions } from './mentions'
import { notifyMention } from './notifications'
import MentionInput from './MentionInput'
import MentionText from './MentionText'
import Reactions from './Reactions'
import EmojiPickerButton from './EmojiPickerButton'
import type { Author } from './threadHelpers'

interface ChatPanelProps {
  ydoc: Y.Doc
  user: Author
  room: string
  participants: string[]
  onClose?: () => void
}

function timeLabel(createdAt: number) {
  return new Date(createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function notifyMentionsIn(text: string, user: Author, room: string) {
  for (const name of extractMentions(text)) {
    notifyMention(name, user.name, room, text)
  }
}

const FIELD =
  'text-input w-full rounded-md border border-border bg-card px-2.5 py-1.5 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary'
const BTN =
  'inline-flex shrink-0 items-center gap-1 rounded-md border border-border px-2 py-1 text-xs transition-colors hover:border-primary/50 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50'

function ChatPanel({ ydoc, user, room, participants, onClose }: ChatPanelProps) {
  const messages = useChat(ydoc)
  const [draft, setDraft] = useState('')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({})

  function toggleExpanded(id: string) {
    setExpanded((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function submitMessage() {
    if (!draft.trim()) return
    sendMessage(ydoc, user, draft.trim())
    notifyMentionsIn(draft.trim(), user, room)
    setDraft('')
  }

  function appendToReply(messageId: string, emoji: string) {
    setReplyDrafts((current) => ({ ...current, [messageId]: (current[messageId] ?? '') + emoji }))
  }

  function submitReply(messageId: string) {
    const text = (replyDrafts[messageId] ?? '').trim()
    if (!text) return
    replyToMessage(ydoc, messageId, user, text)
    notifyMentionsIn(text, user, room)
    setReplyDrafts((current) => ({ ...current, [messageId]: '' }))
  }

  return (
    <Panel title="Chat" onClose={onClose} bodyClassName="flex flex-col">
      <div className="chat-messages max-h-[320px] flex-1 space-y-3 overflow-y-auto p-3">
        {messages.map((message) => (
          <div key={message.id} className="chat-message rounded-md bg-muted/30 p-2.5">
            <span className="text-sm font-semibold" style={{ color: message.color }}>
              {message.author}
            </span>{' '}
            <span className="text-xs text-muted-foreground">{timeLabel(message.createdAt)}</span>
            <p className="mt-1 whitespace-pre-wrap break-words text-sm">
              <MentionText text={message.text} />
            </p>
            <Reactions
              reactions={message.reactions}
              currentUser={user.name}
              onToggle={(emoji) => toggleChatReaction(ydoc, message.id, emoji, user.name)}
            />
            <button
              type="button"
              className="mt-1.5 text-xs text-muted-foreground transition-colors hover:text-primary"
              onClick={() => toggleExpanded(message.id)}
            >
              {message.replies.length > 0
                ? `${message.replies.length} ${message.replies.length === 1 ? 'reply' : 'replies'}`
                : 'Reply'}
            </button>
            {expanded.has(message.id) && (
              <div className="chat-thread mt-2 space-y-2 border-l-2 border-border pl-2.5">
                {message.replies.map((reply) => (
                  <div key={reply.id} className="chat-message rounded-md bg-muted/40 p-2">
                    <span className="text-sm font-semibold" style={{ color: reply.color }}>
                      {reply.author}
                    </span>{' '}
                    <span className="text-xs text-muted-foreground">{timeLabel(reply.createdAt)}</span>
                    <p className="mt-1 whitespace-pre-wrap break-words text-sm">
                      <MentionText text={reply.text} />
                    </p>
                    <Reactions
                      reactions={reply.reactions}
                      currentUser={user.name}
                      onToggle={(emoji) => toggleChatReaction(ydoc, reply.id, emoji, user.name)}
                    />
                  </div>
                ))}
                <form
                  className="comment-reply-form"
                  onSubmit={(e) => {
                    e.preventDefault()
                    submitReply(message.id)
                  }}
                >
                  <MentionInput
                    className={FIELD}
                    value={replyDrafts[message.id] ?? ''}
                    onChange={(value) =>
                      setReplyDrafts((current) => ({ ...current, [message.id]: value }))
                    }
                    participants={participants}
                    placeholder="Reply…"
                  />
                  <EmojiPickerButton
                    onPick={(emoji) => appendToReply(message.id, emoji)}
                    label="Add emoji to reply"
                    className={`${BTN} h-8 w-8 justify-center p-0`}
                  >
                    <Smile size={14} aria-hidden="true" />
                  </EmojiPickerButton>
                  <button
                    type="submit"
                    className="btn btn-small"
                    disabled={!(replyDrafts[message.id] ?? '').trim()}
                  >
                    Reply
                  </button>
                </form>
              </div>
            )}
          </div>
        ))}
      </div>
      <form
        className="chat-compose flex shrink-0 items-center gap-2 border-t border-border p-2.5"
        onSubmit={(e) => {
          e.preventDefault()
          submitMessage()
        }}
      >
        <MentionInput
          className={FIELD}
          value={draft}
          onChange={setDraft}
          participants={participants}
          placeholder="Message the room…"
        />
        <EmojiPickerButton
          onPick={(emoji) => setDraft((current) => current + emoji)}
          label="Add emoji"
          className="btn btn-small compose-emoji-btn"
        >
          <Smile size={14} aria-hidden="true" />
        </EmojiPickerButton>
        <button
          type="submit"
          className="shrink-0 rounded-md bg-gradient-primary px-3 py-1.5 text-xs font-medium text-[hsl(var(--on-brand))] transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!draft.trim()}
        >
          Send
        </button>
      </form>
    </Panel>
  )
}

export default ChatPanel
