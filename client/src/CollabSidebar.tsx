import type { CSSProperties } from 'react'
import type { Awareness } from 'y-protocols/awareness'
import type * as Y from 'yjs'
import { usePresence } from './usePresence'
import ChatPanel from './ChatPanel'
import type { Author } from './threadHelpers'

interface CollabSidebarProps {
  awareness: Awareness
  ydoc: Y.Doc
  user: Author
  room: string
  participants: string[]
}

// Always-visible, unlike the other side panels -- who's here and the room
// chat are the two things worth seeing at a glance the whole time you're
// working, not something to dig for behind a toggle.
function CollabSidebar({ awareness, ydoc, user, room, participants }: CollabSidebarProps) {
  const users = usePresence(awareness)

  return (
    <div className="relative h-fit w-[220px] shrink-0 overflow-hidden rounded-lg border border-border bg-card/70 shadow-elegant backdrop-blur-sm before:absolute before:inset-x-0 before:top-0 before:h-[2px] before:bg-gradient-primary before:content-['']">
      <div className="space-y-1">
        <div className="border-b border-border px-3.5 py-2.5 text-sm font-semibold">Collaborators</div>
        <ul className="space-y-1 p-2">
          {users.map((u) => (
            <li key={u.clientId} className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm">
              <span
                className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-[10px] font-semibold text-[hsl(var(--on-brand))]"
                style={{ '--chip-color': u.color } as CSSProperties}
              >
                {u.name.slice(0, 1).toUpperCase()}
              </span>
              {u.name}
            </li>
          ))}
        </ul>
      </div>
      <ChatPanel ydoc={ydoc} user={user} room={room} participants={participants} />
    </div>
  )
}

export default CollabSidebar
