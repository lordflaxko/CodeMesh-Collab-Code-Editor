import { Panel } from './components/Panel'
import { useCallback, useEffect, useState } from 'react'
import {
  fetchGitStatus,
  fetchGitLog,
  fetchGitDiff,
  commitAll,
  fetchBranches,
  createBranch,
  switchBranch,
  pushBranch,
  pullBranch,
  restoreVersion,
  listPullRequests,
  createPullRequest,
  type GitStatus,
  type GitCommit,
  type GitDiff,
  type GitBranches,
  type PullRequest,
} from './git'

interface SourceControlPanelProps {
  room: string
  canEdit: boolean
  sessionToken: string | null
  onClose: () => void
}

type ChangeKind = 'untracked' | 'modified' | 'added' | 'deleted' | 'conflicted'
type Tab = 'changes' | 'history' | 'remote'

function diffLineClass(line: string): string {
  if (line.startsWith('@@')) return 'sc-diff-hunk'
  if (line.startsWith('+') && !line.startsWith('+++')) return 'sc-diff-add'
  if (line.startsWith('-') && !line.startsWith('---')) return 'sc-diff-del'
  return ''
}

function DiffView({ diff }: { diff: GitDiff | null }) {
  if (!diff) return <div className="sc-loading px-2 py-6 text-center text-sm text-muted-foreground">Loading diff…</div>
  const lines = diff.isNewFile ? diff.diff.split('\n').map((l) => `+${l}`) : diff.diff.split('\n')
  return (
    <pre className="sc-diff">
      {lines.map((line, i) => (
        <div key={i} className={`sc-diff-line ${diffLineClass(line)}`}>
          {line}
        </div>
      ))}
    </pre>
  )
}

// Local control styling. The sc-* class names that remain below are kept purely
// as hooks the end-to-end suite selects on -- their rules have been removed from
// App.css and all appearance now comes from the utilities alongside them.
// Selects deliberately omit the `text-input` hook: the suite scopes queries
// like `.invite-section .text-input` to a single field, and putting the hook on
// a neighbouring <select> makes that selector match two elements and fail
// Playwright's strict mode.
const SELECT =
  'w-full rounded-md border border-border bg-card px-2.5 py-1.5 text-sm outline-none transition-colors focus:border-primary'
const FIELD =
  'text-input w-full rounded-md border border-border bg-card px-2.5 py-1.5 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary'
const BTN =
  'inline-flex shrink-0 items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs transition-colors hover:border-primary/50 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50'
const BTN_PRIMARY =
  'inline-flex shrink-0 items-center rounded-md bg-gradient-primary px-3 py-1.5 text-xs font-medium text-[hsl(var(--on-brand))] transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50'
const TAB = 'rounded-md px-2.5 py-1 text-xs transition-colors hover:text-primary'
const SECTION_CARD = 'rounded-md border border-border bg-muted/30 p-2.5'

function SourceControlPanel({ room, canEdit, sessionToken, onClose }: SourceControlPanelProps) {
  const [tab, setTab] = useState<Tab>('changes')
  const [status, setStatus] = useState<GitStatus | null>(null)
  const [commits, setCommits] = useState<GitCommit[]>([])
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [diff, setDiff] = useState<GitDiff | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [branches, setBranches] = useState<GitBranches | null>(null)
  const [newBranchName, setNewBranchName] = useState('')
  const [commitMessage, setCommitMessage] = useState('')
  const [committing, setCommitting] = useState(false)

  // Deliberately not persisted anywhere (not even sessionStorage) -- this is
  // a real credential with repo write access, so it only ever lives in this
  // component's state and is gone as soon as the panel unmounts or reloads.
  const [remoteUrl, setRemoteUrl] = useState('')
  const [token, setToken] = useState('')
  const [remoteBusy, setRemoteBusy] = useState(false)
  const [remoteMessage, setRemoteMessage] = useState<string | null>(null)
  const [remoteError, setRemoteError] = useState<string | null>(null)
  const [pullRequests, setPullRequests] = useState<PullRequest[]>([])
  const [prTitle, setPrTitle] = useState('')
  const [prBase, setPrBase] = useState('master')
  const [prBody, setPrBody] = useState('')

  const refreshStatus = useCallback(() => {
    setLoading(true)
    setError(null)
    fetchGitStatus(room)
      .then(setStatus)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load status'))
      .finally(() => setLoading(false))
  }, [room])

  const refreshLog = useCallback(() => {
    setLoading(true)
    setError(null)
    fetchGitLog(room)
      .then((data) => setCommits(data.commits))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load history'))
      .finally(() => setLoading(false))
  }, [room])

  const refreshBranches = useCallback(() => {
    fetchBranches(room).then(setBranches).catch(() => {})
  }, [room])

  useEffect(() => {
    refreshBranches()
  }, [refreshBranches])

  useEffect(() => {
    if (tab === 'changes') refreshStatus()
    else if (tab === 'history') refreshLog()
  }, [tab, refreshStatus, refreshLog])

  function viewDiff(path: string) {
    setSelectedFile(path)
    setDiff(null)
    fetchGitDiff(room, path)
      .then(setDiff)
      .catch(() => setDiff({ diff: 'Failed to load diff', isNewFile: false }))
  }

  function handleCommit() {
    if (!commitMessage.trim()) return
    setCommitting(true)
    setError(null)
    commitAll(room, commitMessage.trim(), sessionToken)
      .then(() => {
        setCommitMessage('')
        setSelectedFile(null)
        setDiff(null)
        refreshStatus()
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Commit failed'))
      .finally(() => setCommitting(false))
  }

  function handleCreateBranch() {
    if (!newBranchName.trim()) return
    createBranch(room, newBranchName.trim(), sessionToken)
      .then((b) => {
        setBranches(b)
        setNewBranchName('')
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not create branch'))
  }

  function handleSwitchBranch(name: string) {
    if (name === branches?.current) return
    if (
      !window.confirm(
        `Switch to "${name}"? This changes the file contents everyone in this room sees, not just you.`,
      )
    ) {
      return
    }
    switchBranch(room, name, sessionToken)
      .then((b) => {
        setBranches(b)
        setSelectedFile(null)
        setDiff(null)
        if (tab === 'changes') refreshStatus()
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not switch branch'))
  }

  function handleRestore(hash: string) {
    if (
      !window.confirm(
        'Restore this version? This replaces the current files for everyone in this room with this version\'s contents (recorded as a new commit, so nothing already committed is lost).',
      )
    ) {
      return
    }
    setError(null)
    restoreVersion(room, hash, sessionToken)
      .then((data) => {
        setCommits(data.commits)
        if (tab === 'changes') refreshStatus()
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Restore failed'))
  }

  function handlePush() {
    if (!remoteUrl.trim() || !token.trim() || !branches?.current) return
    setRemoteBusy(true)
    setRemoteError(null)
    setRemoteMessage(null)
    pushBranch(room, remoteUrl.trim(), token.trim(), branches.current, sessionToken)
      .then(() => setRemoteMessage(`Pushed ${branches.current} to remote.`))
      .catch((err) => setRemoteError(err instanceof Error ? err.message : 'Push failed'))
      .finally(() => setRemoteBusy(false))
  }

  function handlePull() {
    if (!remoteUrl.trim() || !token.trim() || !branches?.current) return
    setRemoteBusy(true)
    setRemoteError(null)
    setRemoteMessage(null)
    pullBranch(room, remoteUrl.trim(), token.trim(), branches.current, sessionToken)
      .then((result) => {
        setRemoteMessage(
          result.conflict
            ? 'Pulled with conflicts -- resolve the markers left in the affected files, then commit.'
            : `Pulled ${branches.current} from remote.`,
        )
        if (tab === 'changes') refreshStatus()
      })
      .catch((err) => setRemoteError(err instanceof Error ? err.message : 'Pull failed'))
      .finally(() => setRemoteBusy(false))
  }

  function refreshPullRequests() {
    if (!remoteUrl.trim() || !token.trim()) return
    setRemoteBusy(true)
    setRemoteError(null)
    listPullRequests(remoteUrl.trim(), token.trim())
      .then((data) => setPullRequests(data.pullRequests))
      .catch((err) => setRemoteError(err instanceof Error ? err.message : 'Could not load pull requests'))
      .finally(() => setRemoteBusy(false))
  }

  function handleCreatePr() {
    if (!remoteUrl.trim() || !token.trim() || !branches?.current || !prTitle.trim()) return
    setRemoteBusy(true)
    setRemoteError(null)
    createPullRequest(remoteUrl.trim(), token.trim(), {
      title: prTitle.trim(),
      head: branches.current,
      base: prBase.trim() || 'master',
      body: prBody.trim(),
    })
      .then((pr) => {
        setRemoteMessage(`Opened PR #${pr.number}: ${pr.url}`)
        setPrTitle('')
        setPrBody('')
        refreshPullRequests()
      })
      .catch((err) => setRemoteError(err instanceof Error ? err.message : 'Could not create pull request'))
      .finally(() => setRemoteBusy(false))
  }

  const changedFiles: Array<{ path: string; kind: ChangeKind }> = status
    ? [
        ...status.conflicted.map((path) => ({ path, kind: 'conflicted' as const })),
        ...status.notAdded.map((path) => ({ path, kind: 'untracked' as const })),
        ...status.modified
          .filter((path) => !status.conflicted.includes(path))
          .map((path) => ({ path, kind: 'modified' as const })),
        ...status.created.map((path) => ({ path, kind: 'added' as const })),
        ...status.deleted.map((path) => ({ path, kind: 'deleted' as const })),
      ]
    : []

  return (
    <Panel
      title="Source Control"
      onClose={onClose}
      // h-fit: the workspace row is items-stretch, so without it the panel
      // stretches to the editor's full height and its controls float in a tall
      // empty box. The original .source-control-panel rule had the same.
      className="h-fit max-h-[80vh] w-[340px] shrink-0"
      bodyClassName="space-y-3 p-3"
    >
      <div className="sc-branch-bar flex items-center gap-2">
        <select
          className={`sc-branch-select min-w-0 flex-1 ${SELECT}`}
          value={branches?.current ?? ''}
          disabled={!canEdit}
          onChange={(e) => handleSwitchBranch(e.target.value)}
        >
          {(branches?.all ?? []).map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
        {canEdit && (
          <>
            <input
              className={`sc-branch-input min-w-0 flex-1 ${FIELD}`}
              value={newBranchName}
              onChange={(e) => setNewBranchName(e.target.value)}
              placeholder="New branch name"
            />
            <button type="button" className={BTN} onClick={handleCreateBranch}>
              Create
            </button>
          </>
        )}
      </div>
      <div className="flex items-center gap-1 border-b border-border pb-2">
        <button
          type="button"
          className={`${TAB} ${tab === 'changes' ? 'bg-primary/15 text-primary' : 'text-muted-foreground'}`}
          onClick={() => setTab('changes')}
        >
          Changes
        </button>
        <button
          type="button"
          className={`${TAB} ${tab === 'history' ? 'bg-primary/15 text-primary' : 'text-muted-foreground'}`}
          onClick={() => setTab('history')}
        >
          History
        </button>
        <button
          type="button"
          className={`${TAB} ${tab === 'remote' ? 'bg-primary/15 text-primary' : 'text-muted-foreground'}`}
          onClick={() => setTab('remote')}
        >
          Remote
        </button>
        {tab !== 'remote' && (
          <button
            type="button"
            className={`ml-auto ${BTN}`}
            onClick={tab === 'changes' ? refreshStatus : refreshLog}
          >
            Refresh
          </button>
        )}
      </div>
      {error && <div className="rounded-md border border-destructive/30 bg-destructive/10 p-2 text-xs text-destructive">{error}</div>}
      {loading && tab !== 'remote' && <div className="sc-loading px-2 py-6 text-center text-sm text-muted-foreground">Loading…</div>}
      {tab === 'changes' && !loading && (
        <>
          <div className="space-y-1">
            {changedFiles.length === 0 ? (
              <div className="sc-empty px-2 py-6 text-center text-sm text-muted-foreground">No changes</div>
            ) : (
              changedFiles.map(({ path, kind }) => (
                <button
                  key={path}
                  type="button"
                  className={`sc-file-item flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors ${selectedFile === path ? 'bg-primary/15 text-primary' : 'hover:bg-muted'}`}
                  onClick={() => viewDiff(path)}
                >
                  <span className={`sc-file-kind-${kind} grid h-[1.1rem] w-[1.1rem] shrink-0 place-items-center rounded-sm text-[0.65rem] font-semibold ${kind === 'untracked' || kind === 'added' ? 'bg-accent/20 text-accent' : kind === 'deleted' ? 'bg-destructive/20 text-destructive' : 'bg-primary/20 text-primary'}`}>{kind[0].toUpperCase()}</span>
                  {path}
                </button>
              ))
            )}
          </div>
          {canEdit && (
            <div className={`sc-commit-box flex items-center gap-2 ${SECTION_CARD}`}>
              <input
                className={FIELD}
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                placeholder="Commit message"
              />
              <button
                type="button"
                className={BTN_PRIMARY}
                onClick={handleCommit}
                disabled={committing || !commitMessage.trim()}
              >
                {committing ? 'Committing…' : 'Commit'}
              </button>
            </div>
          )}
        </>
      )}
      {tab === 'history' && !loading && (
        <div className="space-y-2">
          {commits.length === 0 ? (
            <div className="sc-empty px-2 py-6 text-center text-sm text-muted-foreground">No commits yet</div>
          ) : (
            commits.map((c) => (
              <div key={c.hash} className={`sc-commit-item ${SECTION_CARD}`}>
                <div className="text-sm font-medium">{c.message}</div>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <div className="text-xs text-muted-foreground">
                    {c.authorName} · {c.hash.slice(0, 7)} · {new Date(c.date).toLocaleString()}
                  </div>
                  {canEdit && (
                    <button
                      type="button"
                      className="btn btn-small"
                      onClick={() => handleRestore(c.hash)}
                    >
                      Restore
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
      {tab === 'remote' && (
        <div className="space-y-2">
          <input
            className={FIELD}
            value={remoteUrl}
            onChange={(e) => setRemoteUrl(e.target.value)}
            placeholder="https://github.com/owner/repo.git"
          />
          <input
            className={FIELD}
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Personal access token"
          />
          <div className="rounded-md bg-muted/40 p-2 text-xs text-muted-foreground">Never stored -- re-enter each time you open this panel.</div>
          {canEdit && (
            <div className="flex gap-2">
              <button type="button" className={BTN} onClick={handlePush} disabled={remoteBusy}>
                Push
              </button>
              <button type="button" className={BTN} onClick={handlePull} disabled={remoteBusy}>
                Pull
              </button>
            </div>
          )}
          {remoteError && <div className="rounded-md border border-destructive/30 bg-destructive/10 p-2 text-xs text-destructive">{remoteError}</div>}
          {remoteMessage && <div className="rounded-md border border-accent/30 bg-accent/10 p-2 text-xs text-accent">{remoteMessage}</div>}

          <div className="space-y-2 border-t border-border pt-3">
            <div className="flex items-center justify-between text-sm font-semibold">
              <span>Pull requests</span>
              <button type="button" className={BTN} onClick={refreshPullRequests} disabled={remoteBusy}>
                Refresh
              </button>
            </div>
            <div className="space-y-1">
              {pullRequests.length === 0 ? (
                <div className="sc-empty px-2 py-6 text-center text-sm text-muted-foreground">No open pull requests loaded</div>
              ) : (
                pullRequests.map((pr) => (
                  <a key={pr.number} className="block rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted hover:text-primary" href={pr.url} target="_blank" rel="noreferrer">
                    #{pr.number} {pr.title} <span className="text-xs text-muted-foreground">{pr.head} → {pr.base}</span>
                  </a>
                ))
              )}
            </div>
            {canEdit && (
              <div className="space-y-2">
                <input
                  className={FIELD}
                  value={prTitle}
                  onChange={(e) => setPrTitle(e.target.value)}
                  placeholder="Pull request title"
                />
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{branches?.current ?? '…'} →</span>
                  <input
                    className={FIELD}
                    value={prBase}
                    onChange={(e) => setPrBase(e.target.value)}
                    placeholder="base branch"
                  />
                </div>
                <textarea
                  className={`${FIELD} min-h-[70px] resize-y`}
                  value={prBody}
                  onChange={(e) => setPrBody(e.target.value)}
                  placeholder="Description (optional)"
                />
                <button
                  type="button"
                  className="btn btn-small"
                  onClick={handleCreatePr}
                  disabled={remoteBusy || !prTitle.trim()}
                >
                  Open pull request
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      {selectedFile && tab === 'changes' && (
        <div className="mt-2 overflow-hidden rounded-md border border-border">
          <div className="border-b border-border bg-muted/40 px-2.5 py-1.5 font-mono text-xs">{selectedFile}</div>
          <DiffView diff={diff} />
        </div>
      )}
    </Panel>
  )
}

export default SourceControlPanel
