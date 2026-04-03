import { v4 as uuidv4 } from 'uuid'
import { localAdapter } from '../../storage/localAdapter'
import { splitParagraphs, countWords, estimateReadMinutes } from '../../lib/paragraphs'
import type { Document } from '../../types'

export const documentService = {
  async create(title: string, content: string, tags: string[]): Promise<Document> {
    const paragraphs = splitParagraphs(content)
    const wordCount = countWords(content)
    const now = Date.now()
    const doc: Document = {
      id: uuidv4(),
      title: title.trim(),
      content,
      paragraphs,
      tags: tags.map((t) => t.trim()).filter(Boolean),
      wordCount,
      estimatedReadMinutes: estimateReadMinutes(wordCount),
      createdAt: now,
      updatedAt: now,
      lastReadAt: null,
      readingPosition: null,
    }
    await localAdapter.save(doc)
    return doc
  },

  async getAll(): Promise<Document[]> {
    return localAdapter.getAll()
  },

  async getById(id: string): Promise<Document | undefined> {
    return localAdapter.getById(id)
  },

  async savePosition(id: string, paragraphIndex: number): Promise<void> {
    await localAdapter.update(id, {
      readingPosition: { paragraphIndex },
      lastReadAt: Date.now(),
    })
  },

  async delete(id: string): Promise<void> {
    await localAdapter.delete(id)
  },
}
