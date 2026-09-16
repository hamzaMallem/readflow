import { describe, it, expect } from 'vitest'
import { parseJsonImport, parseMarkdownImport } from './importParsers'

describe('parseJsonImport', () => {
  it('parses a valid object with array tags', () => {
    const text = JSON.stringify({
      title: 'Lex Fridman ep.400',
      tags: ['podcast', 'ai'],
      content: 'Hello world',
    })

    const result = parseJsonImport(text)

    expect(result).toEqual({
      title: 'Lex Fridman ep.400',
      tags: 'podcast, ai',
      content: 'Hello world',
    })
  })

  it('parses a valid object with string tags', () => {
    const text = JSON.stringify({
      title: 'Title',
      tags: 'podcast, ai',
      content: 'Body',
    })

    const result = parseJsonImport(text)

    expect(result.tags).toBe('podcast, ai')
  })

  it('defaults tags to an empty string when omitted', () => {
    const text = JSON.stringify({ title: 'Title', content: 'Body' })

    const result = parseJsonImport(text)

    expect(result.tags).toBe('')
  })

  it('throws on invalid JSON syntax', () => {
    expect(() => parseJsonImport('{not valid json')).toThrow(/invalid json/i)
  })

  it('throws when title is missing', () => {
    const text = JSON.stringify({ content: 'Body' })

    expect(() => parseJsonImport(text)).toThrow(/title/i)
  })

  it('throws when content is missing', () => {
    const text = JSON.stringify({ title: 'Title' })

    expect(() => parseJsonImport(text)).toThrow(/content/i)
  })
})

describe('parseMarkdownImport', () => {
  it('parses frontmatter with a comma-separated tags string', () => {
    const text = [
      '---',
      'title: Lex Fridman ep.400',
      'tags: podcast, ai',
      '---',
      'Hello world',
    ].join('\n')

    const result = parseMarkdownImport(text)

    expect(result).toEqual({
      title: 'Lex Fridman ep.400',
      tags: 'podcast, ai',
      content: 'Hello world',
    })
  })

  it('parses frontmatter with a YAML list for tags', () => {
    const text = [
      '---',
      'title: Title',
      'tags:',
      '  - podcast',
      '  - ai',
      '---',
      'Body text',
    ].join('\n')

    const result = parseMarkdownImport(text)

    expect(result.tags).toBe('podcast, ai')
  })

  it('falls back to the first heading as title when there is no frontmatter', () => {
    const text = ['# My Title', '', 'First paragraph.'].join('\n')

    const result = parseMarkdownImport(text)

    expect(result.title).toBe('My Title')
    expect(result.content).toBe('First paragraph.')
    expect(result.tags).toBe('')
  })

  it('throws when there is no frontmatter and no heading', () => {
    const text = 'Just a plain paragraph with no title anywhere.'

    expect(() => parseMarkdownImport(text)).toThrow(/title/i)
  })

  it('throws when frontmatter has no title', () => {
    const text = ['---', 'tags: podcast', '---', 'Body'].join('\n')

    expect(() => parseMarkdownImport(text)).toThrow(/title/i)
  })

  it('throws when there is no body content', () => {
    const text = ['---', 'title: Title', '---', '   '].join('\n')

    expect(() => parseMarkdownImport(text)).toThrow(/content/i)
  })
})
