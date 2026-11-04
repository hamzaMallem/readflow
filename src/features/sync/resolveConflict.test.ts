import { describe, it, expect } from 'vitest'
import { resolveConflict } from './resolveConflict'
import type { Document } from '../../types'

function makeDoc(overrides: Partial<Document>): Document {
  return {
    id: '1',
    title: 'Title',
    content: 'Content',
    paragraphs: ['Content'],
    tags: [],
    wordCount: 1,
    estimatedReadMinutes: 1,
    createdAt: 0,
    updatedAt: 0,
    lastReadAt: null,
    readingPosition: null,
    ...overrides,
  }
}

describe('resolveConflict', () => {
  it('preserves newer reading progress independently of content changes', () => {
    const local = makeDoc({ updatedAt: 100, lastReadAt: 300, readingPosition: { paragraphIndex: 8 } })
    const remote = makeDoc({ updatedAt: 200, title: 'Edited elsewhere', lastReadAt: 150 })
    expect(resolveConflict(local, remote)).toMatchObject({ title: 'Edited elsewhere', lastReadAt: 300, readingPosition: { paragraphIndex: 8 } })
  })

  it('accepts a deliberate move backwards on another device', () => {
    const local = makeDoc({ lastReadAt: 100, readingPosition: { paragraphIndex: 8 } })
    const remote = makeDoc({ lastReadAt: 200, readingPosition: { paragraphIndex: 2 } })
    expect(resolveConflict(local, remote).readingPosition).toEqual({ paragraphIndex: 2 })
  })
  it('picks the remote doc when it was updated more recently', () => {
    const local = makeDoc({ updatedAt: 100 })
    const remote = makeDoc({ updatedAt: 200 })

    expect(resolveConflict(local, remote)).toBe(remote)
  })

  it('picks the local doc when it was updated more recently', () => {
    const local = makeDoc({ updatedAt: 200 })
    const remote = makeDoc({ updatedAt: 100 })

    expect(resolveConflict(local, remote)).toBe(local)
  })

  it('picks the remote doc on a tie', () => {
    const local = makeDoc({ updatedAt: 100 })
    const remote = makeDoc({ updatedAt: 100 })

    expect(resolveConflict(local, remote)).toBe(remote)
  })
})
