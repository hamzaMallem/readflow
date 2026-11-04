import { liveQuery } from 'dexie'
import { collection, doc, onSnapshot, runTransaction } from 'firebase/firestore'
import { firestore } from '../../lib/firebase'
import { db } from '../../storage/db'
import type { Document } from '../../types'
import { resolveConflict } from './resolveConflict'

type Deleted = { id: string; updatedAt: number; deleted: true }
type Record = Document | Deleted
export type SyncState = { status: 'signed-out' | 'connecting' | 'syncing' | 'synced' | 'offline' | 'error'; error?: string }
let state: SyncState = { status: 'signed-out' }
const listeners = new Set<() => void>()
export const getSyncState = () => state
export function subscribeSync(listener: () => void) {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}
function publish(next: SyncState) {
  state = next
  listeners.forEach((listener) => listener())
}
let session: { uid: string; stop: () => void } | null = null
function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical)
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => [key, canonical(item)]))
  }
  return value
}
const equal = (a: unknown, b: unknown) => JSON.stringify(canonical(a)) === JSON.stringify(canonical(b))
const deleted = (value: Record): value is Deleted => 'deleted' in value && value.deleted === true

export function startSync(uid: string) {
  if (session?.uid === uid) return
  stopSync()
  let active = true
  let serverReady = false
  let running = false
  let dirty = false
  const remote = new Map<string, Record>()
  const ref = collection(firestore, 'users', uid, 'documents')
  const fail = (error: unknown) => {
    if (active) publish({ status: navigator.onLine ? 'error' : 'offline', error: error instanceof Error ? error.message : 'Sync failed. Try again.' })
  }

  // Local records are a durable retry queue, including deletion markers. Wait
  // for a server snapshot so an empty offline cache cannot resurrect old data.
  async function reconcile() {
    dirty = true
    if (running || !active || !serverReady || !navigator.onLine) return
    running = true
    publish({ status: 'syncing' })
    try {
      while (dirty && active && navigator.onLine) {
        dirty = false
        const [documents, deletions] = await Promise.all([db.documents.toArray(), db.deletions.toArray()])
        const local = new Map<string, Record>(documents.map((value) => [value.id, value]))
        deletions.forEach((value) => local.set(value.id, { ...value, deleted: true }))
        for (const id of new Set([...local.keys(), ...remote.keys()])) {
          if (!active) return
          const candidate = local.get(id)
          const cloud = remote.get(id)
          if (equal(candidate, cloud)) continue
          const winner = await runTransaction(firestore, async (transaction) => {
            const target = doc(ref, id)
            const snapshot = await transaction.get(target)
            if (!active) throw new Error('Sync session changed')
            const latest = snapshot.exists() ? snapshot.data() as Record : undefined
            const merged = !candidate ? latest : !latest ? candidate
              : deleted(latest) ? latest : deleted(candidate) ? candidate
              : resolveConflict(candidate, latest)
            if (merged && !equal(merged, latest)) transaction.set(target, merged)
            return merged
          })
          if (!active) return
          if (!winner) continue
          remote.set(id, winner)
          await db.transaction('rw', db.documents, db.deletions, async () => {
            if (!active) return
            if (deleted(winner)) {
              await db.deletions.put({ id, updatedAt: winner.updatedAt })
              await db.documents.delete(id)
            } else if (!(await db.deletions.get(id))) {
              const current = await db.documents.get(id)
              const merged = current ? resolveConflict(current, winner) : winner
              if (!equal(current, merged)) await db.documents.put(merged)
              if (!equal(merged, winner)) dirty = true
            } else {
              dirty = true
            }
          })
        }
      }
      if (active) publish({ status: navigator.onLine ? 'synced' : 'offline' })
    } catch (error) {
      fail(error)
    } finally {
      running = false
    }
  }
  publish({ status: navigator.onLine ? 'connecting' : 'offline' })
  const unsubscribe = onSnapshot(ref, { includeMetadataChanges: true }, (snapshot) => {
    if (!active || snapshot.metadata.fromCache || snapshot.metadata.hasPendingWrites) return
    remote.clear()
    snapshot.docs.forEach((item) => remote.set(item.id, item.data() as Record))
    serverReady = true
    void reconcile()
  }, fail)
  const localSubscription = liveQuery(() => Promise.all([db.documents.toArray(), db.deletions.toArray()]))
    .subscribe({ next: () => { void reconcile() }, error: fail })
  const online = () => { void reconcile() }
  const offline = () => publish({ status: 'offline' })
  window.addEventListener('online', online)
  window.addEventListener('offline', offline)
  session = { uid, stop: () => {
    active = false
    unsubscribe()
    localSubscription.unsubscribe()
    window.removeEventListener('online', online)
    window.removeEventListener('offline', offline)
  } }
}

export function stopSync() {
  session?.stop()
  session = null
  publish({ status: 'signed-out' })
}

export function retrySync() {
  const uid = session?.uid
  if (uid) { stopSync(); startSync(uid) }
}
