import { useState } from 'react'
import { useNotifications } from './notifications'

interface NotificationBellProps {
  token: string | null
  onOpenRoom: (room: string) => void
}

function timeLabel(createdAt: number) {
  return new Date(createdAt).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function NotificationBell({ token, onOpenRoom }: NotificationBellProps) {
  const { notifications, markAllRead } = useNotifications(token)
  const [open, setOpen] = useState(false)
  const unreadCount = notifications.filter((n) => !n.read).length

  if (!token) return null

  function toggle() {
    setOpen((v) => {
      const next = !v
      if (next && unreadCount > 0) markAllRead()
      return next
    })
  }

  return (
    <div className="notification-bell relative">
      <button type="button" className="relative rounded-md border border-border bg-card/70 px-2.5 py-1.5 text-sm transition-colors hover:border-primary/50 hover:text-primary" onClick={toggle}>
        🔔{unreadCount > 0 ? ` ${unreadCount}` : ''}
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 max-h-[320px] w-[300px] overflow-y-auto rounded-lg border border-border bg-card/95 p-1.5 shadow-elegant backdrop-blur-md">
          {notifications.length === 0 ? (
            <div className="px-3 py-6 text-center text-sm text-muted-foreground">No notifications yet</div>
          ) : (
            [...notifications]
              .sort((a, b) => b.createdAt - a.createdAt)
              .map((n) => (
                <button
                  key={n.id}
                  type="button"
                  className="notification-item w-full rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-muted"
                  onClick={() => {
                    onOpenRoom(n.room)
                    setOpen(false)
                  }}
                >
                  <span className="font-semibold">{n.fromName}</span> mentioned you
                  <p className="mt-0.5 block text-xs text-muted-foreground">{n.text}</p>
                  <span className="text-xs text-muted-foreground">{timeLabel(n.createdAt)}</span>
                </button>
              ))
          )}
        </div>
      )}
    </div>
  )
}

export default NotificationBell
