import { useState, type FormEvent } from 'react'
import type { FileMeta } from './useFileTree'

interface FileTreeProps {
  files: FileMeta[]
  activeId: string | null
  readOnly: boolean
  onSelect: (id: string) => void
  onCreate: (name: string) => void
  onRename: (id: string, name: string) => void
  onDelete: (id: string) => void
}

function FileTree({ files, activeId, readOnly, onSelect, onCreate, onRename, onDelete }: FileTreeProps) {
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')

  function submitCreate(e: FormEvent) {
    e.preventDefault()
    const name = newName.trim()
    if (!name) return
    onCreate(name)
    setNewName('')
    setCreating(false)
  }

  function startRename(file: FileMeta) {
    setRenamingId(file.id)
    setRenameValue(file.name)
  }

  function submitRename(e: FormEvent) {
    e.preventDefault()
    const name = renameValue.trim()
    if (name && renamingId) onRename(renamingId, name)
    setRenamingId(null)
  }

  return (
    <div className="file-tree relative h-fit w-[200px] shrink-0 overflow-hidden rounded-lg border border-border bg-card/70 shadow-elegant backdrop-blur-sm before:absolute before:inset-x-0 before:top-0 before:z-10 before:h-[2px] before:bg-gradient-primary before:content-['']">
      <div className="file-tree-header flex items-center justify-between border-b border-border px-3.5 py-2.5 text-xs font-semibold">
        <span>Files</span>
        {!readOnly && (
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
            onClick={() => setCreating(true)}
          >
            + New
          </button>
        )}
      </div>
      {!readOnly && creating && (
        <form className="border-b border-border p-1.5" onSubmit={submitCreate}>
          <input
            className="w-full rounded-md border border-border bg-card px-2 py-1 text-sm outline-none focus:border-primary"
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onBlur={() => !newName && setCreating(false)}
            placeholder="filename.ext"
          />
        </form>
      )}
      <ul className="max-h-[480px] list-none overflow-y-auto p-1.5">
        {files.map((file) => (
          <li
            key={file.id}
            className={`group flex items-center gap-1 rounded-md pr-1 transition-colors ${
              file.id === activeId ? 'is-active bg-primary/15 text-primary' : 'hover:bg-muted'
            }`}
          >
            {renamingId === file.id ? (
              <form onSubmit={submitRename}>
                <input
                  className="w-full rounded-md border border-border bg-card px-2 py-1 text-sm outline-none focus:border-primary"
                  autoFocus
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onBlur={submitRename}
                />
              </form>
            ) : (
              <>
                <button
                  type="button"
                  className="file-tree-item min-w-0 flex-1 truncate px-2 py-1.5 text-left text-sm"
                  onClick={() => onSelect(file.id)}
                  onDoubleClick={readOnly ? undefined : () => startRename(file)}
                  title={readOnly ? undefined : 'Double-click to rename'}
                >
                  {file.name}
                </button>
                {!readOnly && (
                  <button
                    type="button"
                    className="shrink-0 rounded px-1 text-muted-foreground opacity-0 transition-all hover:text-destructive group-hover:opacity-100"
                    title="Delete file"
                    onClick={() => {
                      if (files.length <= 1) return
                      if (window.confirm(`Delete ${file.name}?`)) onDelete(file.id)
                    }}
                  >
                    ×
                  </button>
                )}
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default FileTree
