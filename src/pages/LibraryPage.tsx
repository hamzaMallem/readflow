import { useNavigate } from 'react-router-dom'
import { useDocuments } from '../features/documents/useDocuments'
import { useSearch } from '../features/search/useSearch'
import { SearchBar } from '../components/library/SearchBar'
import { TagFilter } from '../components/library/TagFilter'
import { DocumentCard } from '../components/library/DocumentCard'
import { Spinner } from '../components/ui/Spinner'

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
          <button
            onClick={() => navigate('/new')}
            aria-label="New document"
            className="w-11 h-11 flex items-center justify-center rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xl font-light active:opacity-70 transition-opacity"
          >
            +
          </button>
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
