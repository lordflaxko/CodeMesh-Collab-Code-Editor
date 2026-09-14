import { useState, type CSSProperties } from 'react'
import type { Coords } from './CodeEditor'
import { saveCustomTemplate } from './customTemplates'
import { useEscapeToClose } from './useEscapeToClose'

interface SaveTemplatePopoverProps {
  coords: Coords
  room: string
  sessionToken: string | null
  onClose: () => void
}

function SaveTemplatePopover({ coords, room, sessionToken, onClose }: SaveTemplatePopoverProps) {
  useEscapeToClose(onClose)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const style = { top: coords.bottom + 6, left: coords.left } as CSSProperties

  function handleSave() {
    if (!name.trim() || saving) return
    setSaving(true)
    setError(null)
    saveCustomTemplate(sessionToken, room, name.trim())
      .then(() => setSaved(true))
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not save template'))
      .finally(() => setSaving(false))
  }

  return (
    <div className="save-template-popover z-50 w-[280px] space-y-2 rounded-lg border border-border bg-card/95 p-3 shadow-elegant backdrop-blur-md" style={style}>
      <div className="text-sm font-semibold">
        <span>Save as Template</span>
        <button type="button" className="rounded-md border border-border px-2.5 py-1 text-xs transition-colors hover:border-primary/50 hover:text-primary" onClick={onClose}>
          Close
        </button>
      </div>
      {saved ? (
        <div className="sc-empty px-4 py-8 text-center text-sm text-muted-foreground">Saved -- it'll show up in the template list on the dashboard.</div>
      ) : (
        <>
          <input
            className="w-full rounded-md border border-border bg-card px-2.5 py-1.5 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Template name"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave()
            }}
          />
          {error && <div className="rounded-md border border-destructive/30 bg-destructive/10 p-2 text-xs text-destructive">{error}</div>}
          <div className="flex items-center justify-end gap-1.5">
            <button
              type="button"
              className="rounded-md border border-border px-2.5 py-1 text-xs transition-colors hover:border-primary/50 hover:text-primary"
              onClick={handleSave}
              disabled={saving || !name.trim()}
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default SaveTemplatePopover
