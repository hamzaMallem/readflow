import type { Document } from '../types'

export interface IStorageAdapter {
  getAll(): Promise<Document[]>
  getById(id: string): Promise<Document | undefined>
  save(doc: Document): Promise<void>
  update(id: string, changes: Partial<Document>): Promise<void>
  delete(id: string): Promise<void>
}
