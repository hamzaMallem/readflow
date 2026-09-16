import { useState, useMemo } from 'react'
import { searchDocuments } from '../../lib/search'
import type { Document } from '../../types'

export function useSearch(documents: Document[]) {
  const [query, setQuery] = useState('')
  const [activeTag, setActiveTag] = useState<string | null>(null)

  const allTags = useMemo(() => {
    const set = new Set<string>()
    documents.forEach((d) => d.tags.forEach((t) => set.add(t)))
    return Array.from(set).sort()
  }, [documents])

  const results = useMemo(() => {
    let filtered = documents

    if (query.trim()) {
      const matchIds = new Set(searchDocuments(query))
      filtered = filtered.filter((d) => matchIds.has(d.id))
    }

    if (activeTag) {
      filtered = filtered.filter((d) => d.tags.includes(activeTag))
    }

    return filtered
  }, [documents, query, activeTag])

  return { query, setQuery, activeTag, setActiveTag, allTags, results }
}
