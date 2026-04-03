import Dexie, { type Table } from 'dexie'
import type { Document } from '../types'

export class ReadFlowDB extends Dexie {
  documents!: Table<Document, string>

  constructor() {
    super('ReadFlowDB')
    this.version(1).stores({
      // Index: id (primary), title, tags (multi-entry), createdAt, lastReadAt
      documents: 'id, title, *tags, createdAt, lastReadAt',
    })
  }
}

export const db = new ReadFlowDB()
