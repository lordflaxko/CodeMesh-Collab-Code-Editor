import { useEffect, useState } from 'react'
import Workspace from './Workspace'
import MembersPanel from './MembersPanel'
import { getProject, type Project, type Role } from './projects'
import { SERVER_URL } from './api'

interface ProjectViewProps {
  projectId: string
  token: string | null
  user: { name: string; color: string }
  isDark: boolean
  onGoToDashboard: () => void
}

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; project: Project; role: Role }

function ProjectView({ projectId, token, user, isDark, onGoToDashboard }: ProjectViewProps) {
  const [state, setState] = useState<LoadState>({ status: 'loading' })
  const [membersOpen, setMembersOpen] = useState(false)

  useEffect(() => {
    setState({ status: 'loading' })
    getProject(token, projectId)
      .then(({ project, role }) => setState({ status: 'ready', project, role }))
      .catch((err) =>
        setState({ status: 'error', message: err instanceof Error ? err.message : 'Could not load project' }),
      )
  }, [projectId, token])

  if (state.status === 'loading') {
    return (
      <div className="workspace-page">
        <div className="sc-loading">Loading project…</div>
      </div>
    )
  }

  if (state.status === 'error') {
    return (
      <div className="workspace-page">
        <div className="unlock-gate">
          <p>{state.message}</p>
          <button type="button" className="rounded-md border border-border bg-card/70 px-3 py-1.5 text-sm transition-colors hover:border-primary/50 hover:text-primary" onClick={onGoToDashboard}>
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  const { project, role } = state

  return (
    <div className="workspace-page">
      <div className="workspace-glow" aria-hidden="true" />
      <div className="relative mb-5 flex flex-wrap items-center gap-2 overflow-hidden rounded-lg border border-border bg-card/70 px-4 py-3 shadow-elegant backdrop-blur-sm before:absolute before:inset-x-0 before:top-0 before:h-[2px] before:bg-gradient-primary before:content-['']">
        <span className="doc-id mr-auto flex items-center gap-2 text-sm">
          Project: <code>{project.name}</code> <span className="role-badge rounded-pill bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
            {role}
          </span>
        </span>
        <button
          type="button"
          className="rounded-md border border-border bg-card/70 px-3 py-1.5 text-sm transition-colors hover:border-primary/50 hover:text-primary"
          onClick={() => navigator.clipboard.writeText(window.location.href)}
        >
          Copy link
        </button>
        <a
          className="rounded-md border border-border bg-card/70 px-3 py-1.5 text-sm transition-colors hover:border-primary/50 hover:text-primary"
          href={`${SERVER_URL}/export/${encodeURIComponent(project.id)}?token=${encodeURIComponent(token ?? '')}`}
        >
          Download .zip
        </a>
        <button type="button" className="rounded-md border border-border bg-card/70 px-3 py-1.5 text-sm transition-colors hover:border-primary/50 hover:text-primary" onClick={() => setMembersOpen((v) => !v)}>
          Members
        </button>
        <button type="button" className="rounded-md border border-border bg-card/70 px-3 py-1.5 text-sm transition-colors hover:border-primary/50 hover:text-primary" onClick={onGoToDashboard}>
          Dashboard
        </button>
      </div>
      {membersOpen && token && (
        <MembersPanel
          token={token}
          project={project}
          role={role}
          onClose={() => setMembersOpen(false)}
          onProjectDeleted={onGoToDashboard}
          onProjectUpdated={(p) => setState({ status: 'ready', project: p, role })}
        />
      )}
      <Workspace
        key={project.id}
        room={project.id}
        token={token}
        user={user}
        role={role}
        isDark={isDark}
        onAccessRevoked={onGoToDashboard}
      />
    </div>
  )
}

export default ProjectView
