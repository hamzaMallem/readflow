import { Link } from 'react-router-dom'
import type { Document } from '../../types'

interface DocumentCardProps {
  doc: Document
  onDelete: (id: string) => void
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export function DocumentCard({ doc, onDelete }: DocumentCardProps) {
  const progress = Math.max(0, Math.min(100, Math.round(
    ((doc.readingPosition?.paragraphIndex ?? 0) / Math.max(1, doc.paragraphs.length - 1)) * 100,
  )))

  return (
    <article className="document-card">
      <h3 className="document-title" dir="auto">
        <Link to={`/read/${doc.id}`} className="document-open">{doc.title}</Link>
      </h3>
      <button onClick={() => onDelete(doc.id)} aria-label={`Delete ${doc.title}`} className="document-delete">
        <svg aria-hidden="true" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18 18 6M6 6l12 12" />
        </svg>
      </button>
      <p className="document-meta">
        {doc.wordCount.toLocaleString()} words · {doc.estimatedReadMinutes} min read · {formatDate(doc.createdAt)}
      </p>
      {doc.tags.length > 0 && (
        <div className="document-tags">
          {doc.tags.map((tag) => <span key={tag} dir="auto">{tag}</span>)}
        </div>
      )}
      {progress > 0 && (
        <div className="document-progress">
          <div className="document-progress-track" role="progressbar" aria-label="Reading progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
            <div style={{ width: `${progress}%` }} />
          </div>
          <span>{progress}% read</span>
        </div>
      )}
    </article>
  )
}
