import MiniSearch from 'minisearch'
import type { Document } from '../types'

export const miniSearch = new MiniSearch<Document>({
  fields: ['title', 'tags', 'content'],
  storeFields: ['id', 'title', 'tags', 'wordCount', 'estimatedReadMinutes', 'lastReadAt', 'readingPosition'],
  searchOptions: {
    boost: { title: 3, tags: 2 },
    fuzzy: 0.2,
    prefix: true,
  },
})

export function indexDocuments(docs: Document[]) {
  if (miniSearch.documentCount > 0) {
    miniSearch.removeAll()
  }
  miniSearch.addAll(docs)
}

export function searchDocuments(query: string): string[] {
  if (!query.trim()) return []
  return miniSearch.search(query).map((r) => r.id)
}
