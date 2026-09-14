import { AlertCircle, FolderGit2, Link2, Plus, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Reveal } from './components/Reveal'
import { EmptyState, Pill } from './components/Panel'
import { createProject, joinViaInvite, myProjects, type Project } from './projects'
import { PROJECT_TEMPLATES } from './templates'
import {
  listCustomTemplates,
  deleteCustomTemplate,
  type CustomTemplateSummary,
} from './customTemplates'

interface DashboardProps {
  token: string
  username: string
  onOpenProject: (id: string) => void
}

function extractInviteToken(input: string): string {
  const trimmed = input.trim()
  const slash = trimmed.lastIndexOf('/')
  return slash === -1 ? trimmed : trimmed.slice(slash + 1)
}

/** Shared styling for the native <select>s and text inputs. */
const FIELD_CLASS =
  'w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary'

const SELECT_CLASS =
  'w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary'

const CARD_CLASS = 'rounded-lg border border-border bg-card/70 p-5 backdrop-blur-sm'

function Dashboard({ token, username, onOpenProject }: DashboardProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [visibility, setVisibility] = useState<'public' | 'private'>('private')
  const [templateId, setTemplateId] = useState('blank')
  const [creating, setCreating] = useState(false)
  const [inviteInput, setInviteInput] = useState('')
  const [joining, setJoining] = useState(false)
  const [customTemplates, setCustomTemplates] = useState<CustomTemplateSummary[]>([])

  const refresh = useCallback(() => {
    setLoading(true)
    myProjects(token)
      .then((data) => setProjects(data.projects))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load projects'))
      .finally(() => setLoading(false))
  }, [token])

  const refreshTemplates = useCallback(() => {
    listCustomTemplates()
      .then((data) => setCustomTemplates(data.templates))
      .catch(() => {})
  }, [])

  useEffect(() => {
    refresh()
    refreshTemplates()
  }, [refresh, refreshTemplates])

  function handleDeleteTemplate(templateIdToDelete: string) {
    deleteCustomTemplate(token, templateIdToDelete)
      .then(() => {
        refreshTemplates()
        setTemplateId((current) => (current === `custom:${templateIdToDelete}` ? 'blank' : current))
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not delete template'))
  }

  function handleCreate(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setCreating(true)
    setError(null)
    createProject(token, name.trim(), visibility, templateId)
      .then(({ project }) => onOpenProject(project.id))
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not create project'))
      .finally(() => setCreating(false))
  }

  function handleJoin(e: FormEvent) {
    e.preventDefault()
    const inviteToken = extractInviteToken(inviteInput)
    if (!inviteToken) return
    setJoining(true)
    setError(null)
    joinViaInvite(token, inviteToken)
      .then(({ project }) => onOpenProject(project.id))
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not join that project'))
      .finally(() => setJoining(false))
  }

  return (
    <div className="relative px-6 py-10">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_50%_45%_at_50%_0%,black_20%,transparent_100%)]"
      >
        <div className="absolute left-1/2 top-[-12rem] h-[30rem] w-[30rem] -translate-x-1/2 rounded-full bg-primary/15 blur-[120px]" />
      </div>

      <div className="mx-auto max-w-6xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back,{' '}
            <span className="bg-gradient-primary bg-clip-text px-[0.16em] font-script text-4xl text-transparent -mx-[0.16em]">
              {username}
            </span>
          </h1>
          <p className="mt-2 text-muted-foreground">Here's what you're working on.</p>
        </header>

        {error && (
          <div className="mb-6 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle aria-hidden="true" size={16} className="mt-0.5 shrink-0" />
            {error}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          {/* ------------------------------------------------------ Projects */}
          <section>
            <h2 className="mb-4 text-lg font-semibold">My Projects</h2>

            {loading ? (
              <ul className="grid gap-4 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <li
                    key={i}
                    aria-hidden="true"
                    className="h-24 animate-pulse rounded-lg border border-border bg-card/50"
                  />
                ))}
                <li className="sr-only">Loading…</li>
              </ul>
            ) : projects.length === 0 ? (
              <div className={CARD_CLASS}>
                <EmptyState
                  icon={<FolderGit2 aria-hidden="true" size={26} />}
                  title="No projects yet"
                  hint="Create one, or join with an invite link."
                />
              </div>
            ) : (
              <ul className="grid gap-4 sm:grid-cols-2">
                {projects.map((p, i) => (
                  <Reveal key={p.id} delay={Math.min(i, 8) * 0.04}>
                    <li>
                      <button
                        type="button"
                        onClick={() => onOpenProject(p.id)}
                        className="group relative h-full w-full overflow-hidden rounded-lg border border-border bg-card/70 p-5 text-left backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-glow"
                      >
                        <div
                          aria-hidden="true"
                          className="absolute inset-0 -z-10 bg-gradient-primary opacity-0 transition-opacity duration-300 group-hover:opacity-[0.07]"
                        />
                        <span className="block truncate text-base font-semibold">{p.name}</span>
                        <span className="mt-3 flex items-center gap-2">
                          <Pill>{p.members[username]}</Pill>
                          <Pill tone="muted">{p.visibility}</Pill>
                        </span>
                      </button>
                    </li>
                  </Reveal>
                ))}
              </ul>
            )}
          </section>

          {/* --------------------------------------------------- Side actions */}
          <div className="space-y-6">
            <form onSubmit={handleCreate} className={CARD_CLASS}>
              <h3 className="mb-4 flex items-center gap-2 font-semibold">
                <Plus aria-hidden="true" size={16} className="text-primary" />
                Create a project
              </h3>
              <div className="space-y-4">
                {/* The suite fills this by placeholder, so it keeps one even
                    though the floating label would otherwise replace it. */}
                <input
                  className={FIELD_CLASS}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Project name"
                  aria-label="Project name"
                />
                <select
                  className={`visibility-select ${SELECT_CLASS}`}
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value as 'public' | 'private')}
                  aria-label="Project visibility"
                >
                  <option value="private">Private</option>
                  <option value="public">Public</option>
                </select>
                {/* .template-select is how the suite picks a template. */}
                <select
                  className={`template-select ${SELECT_CLASS}`}
                  value={templateId}
                  onChange={(e) => setTemplateId(e.target.value)}
                  aria-label="Project template"
                >
                  {PROJECT_TEMPLATES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                  {customTemplates.length > 0 && (
                    <optgroup label="Custom templates">
                      {customTemplates.map((t) => (
                        <option key={t.id} value={`custom:${t.id}`}>
                          {t.name} (by {t.savedBy})
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
                <button
                  type="submit"
                  disabled={creating || !name.trim()}
                  className="w-full rounded-lg bg-gradient-primary py-2.5 text-sm font-medium text-[hsl(var(--on-brand))] shadow-glow transition-all duration-300 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {creating ? 'Creating…' : 'Create'}
                </button>
              </div>
            </form>

            {customTemplates.length > 0 && (
              <div className={CARD_CLASS}>
                <h3 className="mb-4 font-semibold">Custom templates</h3>
                <ul className="space-y-2">
                  {customTemplates.map((t) => (
                    <li
                      key={t.id}
                      className="template-list-item flex items-center gap-3 rounded-lg bg-muted/50 px-3 py-2"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{t.name}</span>
                        <span className="block text-xs text-muted-foreground">
                          by {t.savedBy} · {t.fileCount} file
                          {t.fileCount === 1 ? '' : 's'}
                        </span>
                      </span>
                      {t.savedBy === username && (
                        <button
                          type="button"
                          onClick={() => handleDeleteTemplate(t.id)}
                          aria-label={`Delete ${t.name}`}
                          className="inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 aria-hidden="true" size={13} />
                          Delete
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <form onSubmit={handleJoin} className={CARD_CLASS}>
              <h3 className="mb-4 flex items-center gap-2 font-semibold">
                <Link2 aria-hidden="true" size={16} className="text-primary" />
                Join via invite link
              </h3>
              <div className="space-y-4">
                <input
                  className={FIELD_CLASS}
                  value={inviteInput}
                  onChange={(e) => setInviteInput(e.target.value)}
                  placeholder="Paste an invite link or token"
                  aria-label="Invite link or token"
                />
                <button
                  type="submit"
                  disabled={joining || !inviteInput.trim()}
                  className="w-full rounded-lg border border-border py-2.5 text-sm font-medium transition-colors hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {joining ? 'Joining…' : 'Join'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
