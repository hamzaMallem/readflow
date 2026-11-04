import type { Document } from '../../types'

// Same person, own devices: whichever side saved most recently wins outright.
export function resolveConflict(local: Document, remote: Document): Document {
  const content = remote.updatedAt >= local.updatedAt ? remote : local
  const progress = (remote.lastReadAt ?? 0) >= (local.lastReadAt ?? 0) ? remote : local
  if (content === progress || (content.lastReadAt === progress.lastReadAt && content.readingPosition?.paragraphIndex === progress.readingPosition?.paragraphIndex)) return content
  return { ...content, lastReadAt: progress.lastReadAt, readingPosition: progress.readingPosition }
}
