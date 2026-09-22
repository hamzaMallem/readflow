import { useNavigate } from 'react-router-dom'
import { useDocuments } from '../features/documents/useDocuments'
import { useSearch } from '../features/search/useSearch'
import { SearchBar } from '../components/library/SearchBar'
import { TagFilter } from '../components/library/TagFilter'
import { DocumentCard } from '../components/library/DocumentCard'
import { Spinner } from '../components/ui/Spinner'
import { IconButton } from '../components/ui/IconButton'

export default function LibraryPage() {
  const navigate = useNavigate()
  const { documents, isLoading, deleteDocument } = useDocuments()
  const { query, setQuery, activeTag, setActiveTag, allTags, results } = useSearch(documents)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-950 px-4 pt-safe-top pb-3 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">ReadFlow</h1>
          <div className="flex items-center gap-1">
            <IconButton label="Settings" onClick={() => navigate('/settings')}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </IconButton>
            <button
              onClick={() => navigate('/new')}
              aria-label="New document"
              className="w-11 h-11 flex items-center justify-center rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xl font-light active:opacity-70 transition-opacity"
            >
              +
            </button>
          </div>
        </div>
        <SearchBar value={query} onChange={setQuery} />
        {allTags.length > 0 && (
          <div className="mt-2">
            <TagFilter tags={allTags} activeTag={activeTag} onSelect={setActiveTag} />
          </div>
        )}
      </header>

      {/* Content */}
      <main className="px-4 py-4">
        {isLoading ? (
          <Spinner />
        ) : results.length === 0 ? (
          <EmptyState hasQuery={query.length > 0 || activeTag !== null} onNew={() => navigate('/new')} />
        ) : (
          <div className="flex flex-col gap-3">
            {results.map((doc) => (
              <DocumentCard key={doc.id} doc={doc} onDelete={deleteDocument} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

function EmptyState({ hasQuery, onNew }: { hasQuery: boolean; onNew: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-6">
      <p className="text-4xl mb-4">📖</p>
      {hasQuery ? (
        <p className="text-gray-500 dark:text-gray-400">No documents match your search.</p>
      ) : (
        <>
          <p className="text-gray-800 dark:text-gray-200 font-medium mb-1">No documents yet</p>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Paste a translated transcript to get started.</p>
          <button
            onClick={onNew}
            className="px-5 h-11 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-medium text-sm active:opacity-70"
          >
            Add your first document
          </button>
        </>
      )}
    </div>
  )
}
