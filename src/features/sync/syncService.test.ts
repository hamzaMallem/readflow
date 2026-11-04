import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import type { Document } from '../../types'

const mock = vi.hoisted(() => ({
  local: new Map<string, unknown>(), tombstones: new Map<string, unknown>(), cloud: new Map<string, unknown>(),
  snapshot: (_value: unknown) => { void _value }, localChange: () => {}, fail: false, writes: 0,
}))
vi.mock('../../lib/firebase', () => ({ firestore: {} }))
vi.mock('dexie', () => ({ liveQuery: () => ({ subscribe: (observer: { next: () => void }) => {
  mock.localChange = observer.next
  return { unsubscribe: vi.fn() }
} }) }))
vi.mock('../../storage/db', () => ({ db: {
  documents: {
    toArray: async () => [...mock.local.values()], get: async (id: string) => mock.local.get(id),
    put: async (value: Document) => { mock.local.set(value.id, value) },
    delete: async (id: string) => { mock.local.delete(id) },
  },
  deletions: {
    toArray: async () => [...mock.tombstones.values()], get: async (id: string) => mock.tombstones.get(id),
    put: async (value: { id: string }) => { mock.tombstones.set(value.id, value) },
  },
  transaction: async (_mode: string, _docs: unknown, _deletions: unknown, action: () => Promise<void>) => action(),
} }))
vi.mock('firebase/firestore', () => ({
  collection: (_db: unknown, ...path: string[]) => path.join('/'), doc: (_ref: string, id: string) => id,
  onSnapshot: (_ref: unknown, _options: unknown, callback: typeof mock.snapshot) => {
    mock.snapshot = callback
    return vi.fn()
  },
  runTransaction: async (_db: unknown, action: (tx: unknown) => Promise<unknown>) => {
    if (mock.fail) throw new Error('Permission denied')
    return action({
      get: async (id: string) => ({ exists: () => mock.cloud.has(id), data: () => mock.cloud.get(id) }),
      set: (id: string, value: unknown) => { mock.writes++; mock.cloud.set(id, value) },
    })
  },
}))
import { startSync, stopSync, getSyncState, retrySync } from './syncService'
const document = (overrides: Partial<Document> = {}): Document => ({
  id: 'one', title: 'Test', content: 'Text', paragraphs: ['Text'], tags: [], wordCount: 1,
  estimatedReadMinutes: 1, createdAt: 1, updatedAt: 1, lastReadAt: null, readingPosition: null, ...overrides,
})
function snapshot(fromCache = false) {
  mock.snapshot({ metadata: { fromCache, hasPendingWrites: false },
    docs: [...mock.cloud].map(([id, value]) => ({ id, data: () => value })) })
}
const settled = () => vi.waitFor(() => expect(getSyncState().status).toBe('synced'))
beforeEach(() => {
  mock.local.clear(); mock.cloud.clear(); mock.tombstones.clear(); mock.fail = false; mock.writes = 0
  vi.stubGlobal('navigator', { onLine: true })
  vi.stubGlobal('window', new EventTarget())
})
afterEach(() => { stopSync(); vi.unstubAllGlobals() })
describe('device synchronization', () => {
  it('merges local-only and cloud-only libraries', async () => {
    mock.local.set('one', document())
    mock.cloud.set('two', document({ id: 'two' }))
    startSync('account'); snapshot(); await settled()
    expect(mock.local.size).toBe(2); expect(mock.cloud.size).toBe(2)
  })
  it('restores newer reading progress without losing newer content', async () => {
    mock.local.set('one', document({ updatedAt: 5, title: 'Edited' }))
    mock.cloud.set('one', document({ lastReadAt: 10, readingPosition: { paragraphIndex: 4 } }))
    startSync('account'); snapshot(); await settled()
    expect(mock.local.get('one')).toMatchObject({ title: 'Edited', readingPosition: { paragraphIndex: 4 } })
    expect(mock.cloud.get('one')).toEqual(mock.local.get('one'))
  })
  it('does not resurrect a document deleted on another device', async () => {
    mock.local.set('one', document({ updatedAt: 99 }))
    mock.cloud.set('one', { id: 'one', updatedAt: 2, deleted: true })
    startSync('account'); snapshot(); await settled()
    expect(mock.local.has('one')).toBe(false)
    expect(mock.tombstones.has('one')).toBe(true)
  })
  it('uploads a deletion saved before a reload', async () => {
    mock.tombstones.set('one', { id: 'one', updatedAt: 2 })
    mock.cloud.set('one', document())
    startSync('account'); snapshot(); await settled()
    expect(mock.cloud.get('one')).toMatchObject({ deleted: true })
  })
  it('waits for the server instead of trusting an empty cache', async () => {
    mock.local.set('one', document())
    startSync('account'); snapshot(true)
    await Promise.resolve()
    expect(mock.writes).toBe(0)
    snapshot(); await settled(); expect(mock.writes).toBe(1)
  })
  it('keeps offline edits and resumes after reconnecting', async () => {
    startSync('account'); snapshot(); await settled()
    vi.stubGlobal('navigator', { onLine: false })
    window.dispatchEvent(new Event('offline'))
    mock.local.set('one', document()); mock.localChange()
    expect(getSyncState().status).toBe('offline'); expect(mock.writes).toBe(0)
    vi.stubGlobal('navigator', { onLine: true })
    window.dispatchEvent(new Event('online')); await settled()
    expect(mock.cloud.has('one')).toBe(true)
  })
  it('reports failed writes and retries without losing local data', async () => {
    mock.local.set('one', document()); mock.fail = true
    startSync('account'); snapshot()
    await vi.waitFor(() => expect(getSyncState().status).toBe('error'))
    expect(mock.local.has('one')).toBe(true)
    mock.fail = false; retrySync(); snapshot(); await settled()
    expect(mock.cloud.has('one')).toBe(true)
  })
  it('ignores old snapshot callbacks after sign-out', async () => {
    startSync('account'); stopSync()
    mock.cloud.set('one', document()); snapshot()
    await Promise.resolve()
    expect(mock.local.size).toBe(0); expect(getSyncState().status).toBe('signed-out')
  })
  it('does not rewrite equal records with different field order', async () => {
    const value = document()
    mock.local.set('one', value)
    mock.cloud.set('one', Object.fromEntries(Object.entries(value).reverse()))
    startSync('account'); snapshot(); await settled()
    expect(mock.writes).toBe(0)
  })
})
