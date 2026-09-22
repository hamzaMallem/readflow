import type { Document } from '../../types'

// Same person, own devices: whichever side saved most recently wins outright.
export function resolveConflict(local: Document, remote: Document): Document {
  return remote.updatedAt >= local.updatedAt ? remote : local
}
