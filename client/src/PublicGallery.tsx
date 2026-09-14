import { AlertCircle, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Reveal } from './components/Reveal'
import { listPublicProjects, type PublicProjectSummary } from './projects'

interface PublicGalleryProps {
  onOpenProject: (id: string) => void
}

function PublicGallery({ onOpenProject }: PublicGalleryProps) {
  const [projects, setProjects] = useState<PublicProjectSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    listPublicProjects()
      .then((data) => setProjects(data.projects))
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load public projects'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="relative px-6 py-12">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_50%_45%_at_50%_0%,black_20%,transparent_100%)]"
      >
        <div className="absolute left-1/2 top-[-12rem] h-[30rem] w-[30rem] -translate-x-1/2 rounded-full bg-primary/15 blur-[120px]" />
      </div>

      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Explore{' '}
          <span className="bg-gradient-primary bg-clip-text px-[0.16em] font-script text-4xl text-transparent sm:text-5xl -mx-[0.16em]">
            public projects
          </span>
        </h1>
        <p className="mt-3 text-muted-foreground">Browse projects other people have made public.</p>
      </div>

      {error && (
        <div className="format-error mx-auto mb-6 flex max-w-md items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle aria-hidden="true" size={16} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        // Skeletons rather than a "Loading…" line: the cards keep their eventual
        // shape, so the grid doesn't jump when the real data arrives.
        <ul className="mx-auto grid max-w-6xl gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <li
              key={i}
              className="h-32 animate-pulse rounded-lg border border-border bg-card/50"
              aria-hidden="true"
            />
          ))}
          <li className="sr-only">Loading…</li>
        </ul>
      ) : projects.length === 0 ? (
        <div className="mx-auto max-w-md rounded-lg border border-border bg-card/60 p-10 text-center backdrop-blur-sm">
          <span className="bg-gradient-primary bg-clip-text text-4xl text-transparent">◆</span>
          <p className="mt-4 font-medium">No public projects yet</p>
          <span className="mt-2 block text-sm text-muted-foreground">
            Projects marked "Public" will show up here for anyone to browse.
          </span>
        </div>
      ) : (
        <ul className="mx-auto grid max-w-6xl gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p, i) => (
            <Reveal key={p.id} delay={Math.min(i, 8) * 0.05}>
              <li>
                <button
                  type="button"
                  onClick={() => onOpenProject(p.id)}
                  className="group relative h-full w-full overflow-hidden rounded-lg border border-border bg-card/60 p-5 text-left backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-glow"
                >
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 -z-10 bg-gradient-primary opacity-0 transition-opacity duration-300 group-hover:opacity-[0.07]"
                  />
                  <span className="block truncate text-lg font-semibold">{p.name}</span>
                  <span className="mt-1 block text-sm text-muted-foreground">
                    by {p.ownerUsername}
                  </span>
                  <span className="mt-4 inline-flex items-center gap-1.5 rounded-pill bg-primary/15 px-2.5 py-1 text-xs font-medium text-primary">
                    <Users aria-hidden="true" size={13} />
                    {p.memberCount} member{p.memberCount === 1 ? '' : 's'}
                  </span>
                </button>
              </li>
            </Reveal>
          ))}
        </ul>
      )}
    </div>
  )
}

export default PublicGallery
