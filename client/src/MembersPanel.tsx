import { Panel } from './components/Panel'
import { useCallback, useEffect, useState } from 'react'
import {
  createInviteLink,
  changeRole,
  removeMember,
  setVisibility,
  deleteProject,
  transferOwnership,
  listMembers,
  atLeast,
  type Project,
  type Role,
} from './projects'

interface MembersPanelProps {
  token: string
  project: Project
  role: Role
  onClose: () => void
  onProjectDeleted: () => void
  onProjectUpdated: (project: Project) => void
}

// Selects deliberately omit the `text-input` hook: the suite scopes queries
// like `.invite-section .text-input` to a single field, and putting the hook on
// a neighbouring <select> makes that selector match two elements and fail
// Playwright's strict mode.
const SELECT =
  'w-full rounded-md border border-border bg-card px-2.5 py-1.5 text-sm outline-none transition-colors focus:border-primary'
const FIELD =
  'text-input w-full rounded-md border border-border bg-card px-2.5 py-1.5 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary'
const BTN =
  'inline-flex shrink-0 items-center gap-1 rounded-md border border-border px-2 py-1 text-xs transition-colors hover:border-primary/50 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50'

function MembersPanel({ token, project, role, onClose, onProjectDeleted, onProjectUpdated }: MembersPanelProps) {
  const [error, setError] = useState<string | null>(null)
  const [inviteRole, setInviteRole] = useState<Role>('editor')
  const [inviteLink, setInviteLink] = useState<string | null>(null)
  // The project prop reflects whatever this client last fetched, which can
  // be stale the moment someone else joins via an invite link on a
  // different session -- refetching on open (and after mutations) keeps the
  // member list honest rather than showing a snapshot from page load.
  const [members, setMembers] = useState(project.members)
  const isAdmin = atLeast(role, 'admin')
  const isOwner = role === 'owner'

  const refreshMembers = useCallback(() => {
    listMembers(token, project.id)
      .then((data) => setMembers(data.members))
      .catch(() => {})
  }, [token, project.id])

  useEffect(() => {
    refreshMembers()
  }, [refreshMembers])

  function handle<T>(promise: Promise<{ project: Project } & T>) {
    promise
      .then(({ project: p }) => {
        setMembers(p.members)
        onProjectUpdated(p)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Action failed'))
  }

  function handleGenerateInvite() {
    createInviteLink(token, project.id, inviteRole)
      .then(({ inviteToken }) => setInviteLink(`${window.location.origin}/join/${inviteToken}`))
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not create invite link'))
  }

  function handleRoleChange(target: string, newRole: Role) {
    handle(changeRole(token, project.id, target, newRole))
  }

  function handleRemove(target: string) {
    if (!window.confirm(`Remove ${target} from this project?`)) return
    handle(removeMember(token, project.id, target))
  }

  function handleVisibility(v: 'public' | 'private') {
    handle(setVisibility(token, project.id, v))
  }

  function handleTransfer(target: string) {
    if (!window.confirm(`Transfer ownership to ${target}? You will become an admin.`)) return
    handle(transferOwnership(token, project.id, target))
  }

  function handleDelete() {
    if (!window.confirm('Delete this project permanently? This cannot be undone.')) return
    deleteProject(token, project.id)
      .then(onProjectDeleted)
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not delete project'))
  }

  return (
    <Panel
      title="Members"
      onClose={onClose}
      bodyClassName="space-y-3 p-3"
      className="mb-4"
      actions={
        <button type="button" className={BTN} onClick={refreshMembers}>
          Refresh
        </button>
      }
    >
      {error && <div className="format-error rounded-md border border-destructive/30 bg-destructive/10 p-2 text-xs text-destructive">{error}</div>}
      <ul className="space-y-1">
        {Object.entries(members).map(([name, r]) => (
          <li key={name} className="member-item flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/60">
            <span className="min-w-0 flex-1 truncate">{name}</span>
            {isAdmin && name !== project.ownerUsername ? (
              <select className={SELECT} value={r} onChange={(e) => handleRoleChange(name, e.target.value as Role)}>
                <option value="viewer">viewer</option>
                <option value="editor">editor</option>
                <option value="admin">admin</option>
              </select>
            ) : (
              <span className="role-badge">{r}</span>
            )}
            {isAdmin && name !== project.ownerUsername && (
              <button type="button" className={BTN} onClick={() => handleRemove(name)}>
                Remove
              </button>
            )}
            {isOwner && name !== project.ownerUsername && (
              <button type="button" className={BTN} onClick={() => handleTransfer(name)}>
                Make owner
              </button>
            )}
          </li>
        ))}
      </ul>

      {isAdmin && (
        <div className="invite-section space-y-2 border-t border-border pt-3">
          <select className={SELECT} value={inviteRole} onChange={(e) => setInviteRole(e.target.value as Role)}>
            <option value="viewer">Viewer</option>
            <option value="editor">Editor</option>
            <option value="admin">Admin</option>
          </select>
          <button type="button" className={BTN} onClick={handleGenerateInvite}>
            Generate invite link
          </button>
          {inviteLink && (
            <input
              className={FIELD}
              readOnly
              value={inviteLink}
              onFocus={(e) => e.target.select()}
            />
          )}
        </div>
      )}

      {isAdmin && (
        <div className="flex items-center gap-2 border-t border-border pt-3">
          <span className="text-xs text-muted-foreground">Visibility:</span>
          <button
            type="button"
            className={`${BTN} ${project.visibility === 'private' ? 'border-primary/50 bg-primary/15 text-primary' : ''}`}
            onClick={() => handleVisibility('private')}
          >
            Private
          </button>
          <button
            type="button"
            className={`${BTN} ${project.visibility === 'public' ? 'border-primary/50 bg-primary/15 text-primary' : ''}`}
            onClick={() => handleVisibility('public')}
          >
            Public
          </button>
        </div>
      )}

      {isOwner && (
        <button type="button" className="btn btn-small btn-danger" onClick={handleDelete}>
          Delete project
        </button>
      )}
    </Panel>
  )
}

export default MembersPanel
