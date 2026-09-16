export interface ParsedImport {
  title: string
  tags: string
  content: string
}

function normalizeTags(tags: unknown): string {
  if (Array.isArray(tags)) {
    return tags.map((t) => String(t).trim()).filter(Boolean).join(', ')
  }
  if (typeof tags === 'string') {
    return tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
      .join(', ')
  }
  return ''
}

export function parseJsonImport(text: string): ParsedImport {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error('Invalid JSON file.')
  }

  if (typeof data !== 'object' || data === null) {
    throw new Error('Invalid JSON file: expected an object.')
  }

  const obj = data as Record<string, unknown>
  const title = typeof obj.title === 'string' ? obj.title.trim() : ''
  const content = typeof obj.content === 'string' ? obj.content : ''

  if (!title) throw new Error('Missing required "title" field.')
  if (!content.trim()) throw new Error('Missing required "content" field.')

  return { title, tags: normalizeTags(obj.tags), content }
}

function parseFrontmatter(text: string): { frontmatter: Record<string, unknown>; body: string } | null {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
  if (!match) return null

  const [, rawFrontmatter, body] = match
  const frontmatter: Record<string, unknown> = {}
  const lines = rawFrontmatter.split(/\r?\n/)

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const keyMatch = line.match(/^(\w+):\s*(.*)$/)
    if (!keyMatch) continue

    const [, key, inlineValue] = keyMatch
    if (inlineValue.trim() !== '') {
      frontmatter[key] = inlineValue.trim()
      continue
    }

    const listItems: string[] = []
    while (i + 1 < lines.length && /^\s*-\s+/.test(lines[i + 1])) {
      i++
      listItems.push(lines[i].replace(/^\s*-\s+/, '').trim())
    }
    frontmatter[key] = listItems
  }

  return { frontmatter, body }
}

export function parseMarkdownImport(text: string): ParsedImport {
  const parsed = parseFrontmatter(text)

  if (parsed) {
    const { frontmatter, body } = parsed
    const title = typeof frontmatter.title === 'string' ? frontmatter.title.trim() : ''
    if (!title) throw new Error('Missing required "title" in frontmatter.')

    const content = body.trim()
    if (!content) throw new Error('Missing content after frontmatter.')

    return { title, tags: normalizeTags(frontmatter.tags), content }
  }

  const headingMatch = text.match(/^#\s+(.+)\r?\n?([\s\S]*)$/)
  if (!headingMatch) {
    throw new Error('Could not find a title: add frontmatter or a leading "# Heading".')
  }

  const [, title, rest] = headingMatch
  const content = rest.trim()
  if (!content) throw new Error('Missing content after the heading.')

  return { title: title.trim(), tags: '', content }
}
