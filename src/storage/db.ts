import Dexie, { type Table } from 'dexie'
import type { Document } from '../types'

export const activeAccount = localStorage.getItem('readflow-active-account')
const legacyOwner = localStorage.getItem('readflow-legacy-owner')
const databaseName = activeAccount && activeAccount !== legacyOwner
  ? `ReadFlowDB-${activeAccount}`
  : legacyOwner && !activeAccount ? 'ReadFlowDB-guest' : 'ReadFlowDB'

export class ReadFlowDB extends Dexie {
  documents!: Table<Document, string>
  deletions!: Table<{ id: string; updatedAt: number }, string>

  constructor() {
    super(databaseName)
    this.version(1).stores({
      // Index: id (primary), title, tags (multi-entry), createdAt, lastReadAt
      documents: 'id, title, *tags, createdAt, lastReadAt',
    })
    this.version(2).stores({ deletions: 'id' })
  }
}

export const db = new ReadFlowDB()
