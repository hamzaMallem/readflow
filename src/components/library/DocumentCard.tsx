import { useNavigate } from 'react-router-dom'
import type { Document } from '../../types'

interface DocumentCardProps {
  doc: Document
  onDelete: (id: string) => void
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function progressPercent(doc: Document): number {
  if (!doc.readingPosition || doc.paragraphs.length === 0) return 0
  return Math.round((doc.readingPosition.paragraphIndex / (doc.paragraphs.length - 1)) * 100)
}

export function DocumentCard({ doc, onDelete }: DocumentCardProps) {
  const navigate = useNavigate()
  const progress = progressPercent(doc)

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => navigate(`/read/${doc.id}`)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate(`/read/${doc.id}`) }}
      className="relative bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm select-none cursor-pointer active:scale-[0.984] active:bg-gray-50 dark:active:bg-gray-800/60 transition-transform duration-100"
    >
      {/* Delete — absolute top-right, stops card click */}
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(doc.id) }}
        aria-label="Delete document"
        className="absolute top-3.5 right-3.5 w-7 h-7 flex items-center justify-center rounded-lg text-gray-300 dark:text-gray-600 active:text-red-500 dark:active:text-red-400 transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Title — larger, bolder, leaves room for delete icon */}
      <h3 className="text-[17px] font-bold text-gray-900 dark:text-white leading-snug mb-1.5 line-clamp-2 pr-7">
        {doc.title}
      </h3>

      {/* Metadata — clearly secondary */}
      <p className="text-xs text-gray-400 dark:text-gray-500 mb-4 leading-relaxed">
        {doc.wordCount.toLocaleString()} words · {doc.estimatedReadMinutes} min read · {formatDate(doc.createdAt)}
      </p>

      {/* Progress bar — only shown once reading has started */}
      {progress > 0 && (
        <div className="h-[3px] bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mb-4">
          <div
            className="h-full bg-gray-900 dark:bg-white rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Tags */}
      {doc.tags.length > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          {doc.tags.map((tag) => (
            <span
              key={tag}
              className="text-[11px] px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
