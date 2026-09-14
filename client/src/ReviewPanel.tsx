import { Panel } from './components/Panel'
import { useEffect, useState } from 'react'
import type * as Y from 'yjs'
import {
  fetchBranches,
  fetchReviewChangedFiles,
  fetchReviewFileDiff,
  type GitBranches,
  type ReviewChangedFile,
} from './git'
import { useReview, requestReview, addReviewDecision, closeReview } from './reviews'

interface ReviewPanelProps {
  ydoc: Y.Doc
  room: string
  user: { name: string }
  canEdit: boolean
  onClose: () => void
}

function diffLineClass(line: string): string {
  if (line.startsWith('@@')) return 'sc-diff-hunk'
  if (line.startsWith('+') && !line.startsWith('+++')) return 'sc-diff-add'
  if (line.startsWith('-') && !line.startsWith('---')) return 'sc-diff-del'
  return ''
}

function fileKindFor(status: string): string {
  if (status === 'A') return 'added'
  if (status === 'D') return 'deleted'
  return 'modified'
}

const FIELD =
  'text-input w-full rounded-md border border-border bg-card px-2.5 py-1.5 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary'
const BTN =
  'inline-flex shrink-0 items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs transition-colors hover:border-primary/50 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50'

function ReviewPanel({ ydoc, room, user, canEdit, onClose }: ReviewPanelProps) {
  const [branches, setBranches] = useState<GitBranches | null>(null)
  const [baseBranch, setBaseBranch] = useState('')
  const [changedFiles, setChangedFiles] = useState<ReviewChangedFile[] | null>(null)
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [diff, setDiff] = useState<string | null>(null)
  const [comment, setComment] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchBranches(room).then(setBranches).catch(() => {})
  }, [room])

  const currentBranch = branches?.current ?? ''
  const review = useReview(ydoc, currentBranch)

  useEffect(() => {
    if (!review) {
      setChangedFiles(null)
      setSelectedFile(null)
      setDiff(null)
      return
    }
    setError(null)
    fetchReviewChangedFiles(room, review.baseBranch)
      .then((data) => setChangedFiles(data.files))
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load changes'))
    // review.id changes on every new request, so a closed-then-reopened
    // review against the same branch still refetches instead of reusing
    // stale changedFiles from the last one.
  }, [room, review?.baseBranch, review?.id])

  function viewDiff(path: string) {
    if (!review) return
    setSelectedFile(path)
    setDiff(null)
    fetchReviewFileDiff(room, review.baseBranch, path)
      .then((data) => setDiff(data.diff))
      .catch(() => setDiff('Failed to load diff'))
  }

  function handleRequest() {
    if (!baseBranch || baseBranch === currentBranch) return
    requestReview(ydoc, currentBranch, baseBranch, user.name)
    setBaseBranch('')
  }

  function handleDecision(verdict: 'approved' | 'changes_requested') {
    if (!review) return
    addReviewDecision(ydoc, review.branch, user.name, verdict, comment.trim())
    setComment('')
  }

  function handleClose() {
    if (!review) return
    closeReview(ydoc, review.branch, user.name)
  }

  return (
    <Panel
      title="Review"
      onClose={onClose}
      className="review-panel h-fit max-h-[80vh] w-[340px] shrink-0"
      bodyClassName="space-y-3 p-3"
    >
      <div className="space-y-3">
        {!review && (
          <div className="review-request-form">
            <div className="sc-empty px-2 py-6 text-center text-sm text-muted-foreground">No open review for branch "{currentBranch || '…'}".</div>
            {canEdit && (
              <div className="review-request-row">
                <select
                  className={FIELD}
                  value={baseBranch}
                  onChange={(e) => setBaseBranch(e.target.value)}
                >
                  <option value="">Compare against…</option>
                  {(branches?.all ?? [])
                    .filter((b) => b !== currentBranch)
                    .map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                </select>
                <button
                  type="button"
                  className="shrink-0 rounded-md bg-gradient-primary px-3 py-1.5 text-xs font-medium text-[hsl(var(--on-brand))] transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={handleRequest}
                  disabled={!baseBranch}
                >
                  Request Review
                </button>
              </div>
            )}
          </div>
        )}
        {review && (
          <>
            <div className="review-meta">
              <div>
                <strong>{review.branch}</strong> vs <strong>{review.baseBranch}</strong>
              </div>
              <div className="text-xs text-muted-foreground">Requested by {review.requestedBy}</div>
              <span className={`review-status review-status-${review.status}`}>
                {review.status === 'open'
                  ? 'Awaiting review'
                  : review.status === 'approved'
                    ? 'Approved'
                    : 'Changes requested'}
              </span>
            </div>
            {error && <div className="rounded-md border border-destructive/30 bg-destructive/10 p-2 text-xs text-destructive">{error}</div>}
            <div className="space-y-1">
              {(changedFiles ?? []).map((f) => (
                <button
                  key={f.path}
                  type="button"
                  className={`sc-file-item${selectedFile === f.path ? ' sc-file-item-active' : ''}`}
                  onClick={() => viewDiff(f.path)}
                >
                  <span className={`sc-file-kind sc-file-kind-${fileKindFor(f.status)}`}>
                    {f.status[0]}
                  </span>
                  {f.path}
                </button>
              ))}
              {changedFiles && changedFiles.length === 0 && (
                <div className="sc-empty px-2 py-6 text-center text-sm text-muted-foreground">No differences from {review.baseBranch}</div>
              )}
            </div>
            {selectedFile && (
              <div className="overflow-hidden rounded-md border border-border">
                <div className="border-b border-border bg-muted/40 px-2.5 py-1.5 font-mono text-xs">{selectedFile}</div>
                <pre className="sc-diff">
                  {(diff ?? 'Loading diff…').split('\n').map((line, i) => (
                    <div key={i} className={`sc-diff-line ${diffLineClass(line)}`}>
                      {line}
                    </div>
                  ))}
                </pre>
              </div>
            )}
            <div className="review-decisions">
              {review.decisions.map((d) => (
                <div key={d.id} className="review-decision-item">
                  <span className="text-sm font-semibold">{d.reviewer}</span>{' '}
                  <span className={`review-verdict review-verdict-${d.verdict}`}>
                    {d.verdict === 'approved' ? 'approved' : 'requested changes'}
                  </span>
                  {d.comment && <p className="mt-1 whitespace-pre-wrap break-words text-sm">{d.comment}</p>}
                </div>
              ))}
            </div>
            {canEdit && (
              <div className="review-actions">
                <textarea
                  className={`${FIELD} min-h-[70px] resize-y`}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Optional comment"
                />
                <div className="review-action-buttons">
                  <button type="button" className={BTN} onClick={() => handleDecision('approved')}>
                    Approve
                  </button>
                  <button
                    type="button"
                    className={BTN}
                    onClick={() => handleDecision('changes_requested')}
                  >
                    Request changes
                  </button>
                  <button type="button" className={BTN} onClick={handleClose}>
                    Close review
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Panel>
  )
}

export default ReviewPanel
