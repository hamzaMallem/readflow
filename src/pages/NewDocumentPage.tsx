import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { documentService } from '../features/documents/documentService'
import { TagInput } from '../components/editor/TagInput'
import { Button } from '../components/ui/Button'
import { IconButton } from '../components/ui/IconButton'
import { parseJsonImport, parseMarkdownImport } from '../lib/importParsers'

export default function NewDocumentPage() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<'write' | 'import'>('write')
  const [title, setTitle] = useState('')
  const [tags, setTags] = useState('')
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    const text = await file.text()
    const isMarkdown = file.name.toLowerCase().endsWith('.md')

    try {
      const parsed = isMarkdown ? parseMarkdownImport(text) : parseJsonImport(text)
      setTitle(parsed.title)
      setTags(parsed.tags)
      setContent(parsed.content)
      setError('')
      setMode('write')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not import this file.')
    }
  }

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0

  async function handleSave() {
    if (!title.trim()) { setError('Title is required.'); return }
    if (!content.trim()) { setError('Content is required.'); return }
    setError('')
    setSaving(true)
    try {
      const doc = await documentService.create(
        title,
        content,
        tags.split(',').map((t) => t.trim()).filter(Boolean)
      )
      navigate(`/read/${doc.id}`, { replace: true })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-950 px-4 pt-safe-top pb-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
        <IconButton label="Back" onClick={() => navigate(-1)}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </IconButton>
        <h1 className="flex-1 text-base font-semibold text-gray-900 dark:text-white">New Document</h1>
        <Button onClick={handleSave} disabled={saving} className="h-9 px-4 text-sm">
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </header>

      {/* Form */}
      <main className="flex-1 px-4 py-5 flex flex-col gap-5">
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-xl">
            {error}
          </p>
        )}

        {/* Mode tabs */}
        <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
          <button
            type="button"
            onClick={() => setMode('write')}
            className={`flex-1 h-9 rounded-lg text-sm font-medium transition-colors ${
              mode === 'write'
                ? 'bg-white dark:bg-gray-950 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            Write
          </button>
          <button
            type="button"
            onClick={() => setMode('import')}
            className={`flex-1 h-9 rounded-lg text-sm font-medium transition-colors ${
              mode === 'import'
                ? 'bg-white dark:bg-gray-950 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            Import
          </button>
        </div>

        {mode === 'import' ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 py-10">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.md"
              onChange={handleFileSelected}
              className="hidden"
            />
            <Button onClick={() => fileInputRef.current?.click()} className="h-11 px-5 text-sm">
              Choose a file
            </Button>
            <p className="text-xs text-gray-400 text-center max-w-xs">
              .json (title, tags, content) or .md (frontmatter or a leading # heading)
            </p>
          </div>
        ) : (
          <>
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Lex Fridman ep. 400 — AI Future"
                className="w-full h-11 px-3 bg-gray-100 dark:bg-gray-800 rounded-xl text-sm text-gray-900 dark:text-white placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
              />
            </div>

            <TagInput value={tags} onChange={setTags} />

            {/* Paste Area */}
            <div className="flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Transcript
                </label>
                {wordCount > 0 && (
                  <span className="text-xs text-gray-400">{wordCount.toLocaleString()} words</span>
                )}
              </div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Paste your translated transcript here…"
                className="flex-1 min-h-[50vh] w-full px-3 py-3 bg-gray-100 dark:bg-gray-800 rounded-xl text-sm text-gray-900 dark:text-white placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white resize-none leading-relaxed"
              />
            </div>
          </>
        )}
      </main>
    </div>
  )
}
