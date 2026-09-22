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
