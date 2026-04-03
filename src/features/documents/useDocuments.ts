import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../storage/db'
import { documentService } from './documentService'
import { indexDocuments } from '../../lib/search'
import { useEffect } from 'react'

export function useDocuments() {
  const documents = useLiveQuery(() => db.documents.orderBy('createdAt').reverse().toArray(), [])

  // Keep search index in sync
  useEffect(() => {
    if (documents) indexDocuments(documents)
  }, [documents])

  return {
    documents: documents ?? [],
    isLoading: documents === undefined,
    deleteDocument: documentService.delete,
  }
}
