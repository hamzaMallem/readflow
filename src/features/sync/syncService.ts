import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore'
import { firestore } from '../../lib/firebase'
import { db } from '../../storage/db'
import type { Document } from '../../types'
import { resolveConflict } from './resolveConflict'

let currentUid: string | null = null
let unsubscribeSnapshot: Unsubscribe | null = null
let hooksInstalled = false

// Writes applied by the pull side must not be re-pushed by the Dexie hooks below.
const applyingRemoteIds = new Set<string>()

function userDocsRef(uid: string) {
  return collection(firestore, 'users', uid, 'documents')
}

async function pushDoc(uid: string, document: Document) {
  await setDoc(doc(userDocsRef(uid), document.id), document)
}

async function pushDelete(uid: string, id: string) {
  await deleteDoc(doc(userDocsRef(uid), id))
}

async function applyRemoteDoc(document: Document) {
  applyingRemoteIds.add(document.id)
  try {
    await db.documents.put(document)
  } finally {
    applyingRemoteIds.delete(document.id)
  }
}

async function applyRemoteDelete(id: string) {
  applyingRemoteIds.add(id)
  try {
    await db.documents.delete(id)
  } finally {
    applyingRemoteIds.delete(id)
  }
}

function installHooksOnce() {
  if (hooksInstalled) return
  hooksInstalled = true

  db.documents.hook('creating', function (primKey, obj) {
    this.onsuccess = () => {
      if (currentUid && !applyingRemoteIds.has(primKey as string)) {
        void pushDoc(currentUid, obj as Document)
      }
    }
  })

  db.documents.hook('updating', function (modifications, primKey, obj) {
    this.onsuccess = () => {
      if (currentUid && !applyingRemoteIds.has(primKey as string)) {
        void pushDoc(currentUid, { ...(obj as Document), ...modifications })
      }
    }
  })

  db.documents.hook('deleting', function (primKey) {
    this.onsuccess = () => {
      if (currentUid && !applyingRemoteIds.has(primKey as string)) {
        void pushDelete(currentUid, primKey as string)
      }
    }
  })
}

export async function startSync(uid: string) {
  if (currentUid === uid) return
  if (currentUid) stopSync()

  installHooksOnce()
  currentUid = uid

  const [localDocs, remoteSnapshot] = await Promise.all([
    db.documents.toArray(),
    getDocs(userDocsRef(uid)),
  ])
  const remoteDocs = new Map(remoteSnapshot.docs.map((d) => [d.id, d.data() as Document]))
  const localIds = new Set(localDocs.map((d) => d.id))

  // Union pass: anything only one side has gets copied to the other; where
  // both sides already have it, the newer one is left as the source of truth.
  await Promise.all(
    localDocs.map((local) => {
      const remote = remoteDocs.get(local.id)
      if (!remote || resolveConflict(local, remote) === local) {
        return pushDoc(uid, local)
      }
      return undefined
    }),
  )
  await Promise.all(
    [...remoteDocs.entries()]
      .filter(([id]) => !localIds.has(id))
      .map(([, remote]) => applyRemoteDoc(remote)),
  )

  unsubscribeSnapshot = onSnapshot(userDocsRef(uid), (snapshot) => {
    snapshot.docChanges().forEach(async (change) => {
      if (change.type === 'removed') {
        await applyRemoteDelete(change.doc.id)
        return
      }
      const remote = change.doc.data() as Document
      const local = await db.documents.get(change.doc.id)
      if (!local || resolveConflict(local, remote) === remote) {
        await applyRemoteDoc(remote)
      }
    })
  })
}

export function stopSync() {
  unsubscribeSnapshot?.()
  unsubscribeSnapshot = null
  currentUid = null
}
