import { db } from './db'
import type { IStorageAdapter } from './interface'

export const localAdapter: IStorageAdapter = {
  async getAll() {
    return db.documents.orderBy('createdAt').reverse().toArray()
  },

  async getById(id) {
    return db.documents.get(id)
  },

  async save(doc) {
    await db.documents.put(doc)
  },

  async update(id, changes) {
    await db.documents.update(id, changes)
  },

  async delete(id) {
    await db.transaction('rw', db.documents, db.deletions, async () => {
      await db.deletions.put({ id, updatedAt: Date.now() })
      await db.documents.delete(id)
    })
  },
}
