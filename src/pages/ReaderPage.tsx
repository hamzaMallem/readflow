import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { documentService } from '../features/documents/documentService'
import { useReader } from '../features/reader/useReader'
import { useSettings } from '../features/settings/useSettings'
import { ParagraphBlock } from '../components/reader/ParagraphBlock'
import { ReaderSettings } from '../components/reader/ReaderSettings'
import { Spinner } from '../components/ui/Spinner'
import { containsArabicScript, hasArabicContent as detectArabicContent } from '../lib/textDirection'
import type { Document } from '../types'

// ─── Continue Reading Banner ──────────────────────────────────────────────────

function ContinueReadingBanner({
  percent,
  onDismiss,
}: {
  percent: number
  onDismiss: () => void
}) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const show = setTimeout(() => setVisible(true), 150)
    const hide = setTimeout(() => {
      setVisible(false)
      setTimeout(onDismiss, 300)
    }, 4000)
    return () => { clearTimeout(show); clearTimeout(hide) }
  }, [onDismiss])

  // Dismiss on scroll
  useEffect(() => {
    const onScroll = () => {
      setVisible(false)
      setTimeout(onDismiss, 300)
    }
    window.addEventListener('scroll', onScroll, { once: true, passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [onDismiss])

  return (
    <div
      aria-live="polite"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0) translateX(-50%)' : 'translateY(10px) translateX(-50%)',
        transition: 'opacity 0.25s ease, transform 0.25s ease',
      }}
      className="fixed bottom-8 left-1/2 z-40 flex items-center gap-2.5 pl-4 pr-2 h-11 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl shadow-lg text-sm font-medium whitespace-nowrap"
    >
      <span>Resumed · {percent}%</span>
      <button
        onClick={() => { setVisible(false); setTimeout(onDismiss, 300) }}
        aria-label="Dismiss"
        className="flex items-center justify-center w-7 h-7 rounded-xl bg-white/15 dark:bg-gray-900/15 text-xs active:opacity-60"
      >
        ✕
      </button>
    </div>
  )
}

// ─── Reader Page ──────────────────────────────────────────────────────────────

export default function ReaderPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { settings, update: updateSettings } = useSettings()

  const [doc, setDoc] = useState<Document | null | undefined>(undefined)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(0)
  const [headerVisible, setHeaderVisible] = useState(true)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [resumePercent, setResumePercent] = useState<number | null>(null)

  const lastScrollY = useRef(0)
  const { containerRef, restorePosition } = useReader(id ?? '', doc?.paragraphs.length ?? 0)
  const docIsArabic = useMemo(() => {
    if (!doc) return false
    return detectArabicContent([doc.title, ...doc.paragraphs])
  }, [doc])
  const readerDirection = docIsArabic ? 'rtl' : 'ltr'
  const readerAlignmentClass = docIsArabic ? 'text-right' : 'text-left'
  const arabicParagraphLineHeight = Math.max(1.82, settings.lineHeight)

  // Load document
  useEffect(() => {
    if (!id) return
    documentService.getById(id).then(setDoc)
  }, [id])

  // Restore position + schedule resume banner
  useEffect(() => {
    if (!doc?.readingPosition) return
    const { paragraphIndex } = doc.readingPosition
    if (paragraphIndex === 0) return

    const raf = requestAnimationFrame(() => {
      restorePosition(paragraphIndex)
    })

    const savedPercent = Math.round((paragraphIndex / Math.max(1, doc.paragraphs.length - 1)) * 100)
    const bannerTimer = setTimeout(() => setResumePercent(savedPercent), 500)

    return () => { cancelAnimationFrame(raf); clearTimeout(bannerTimer) }
  }, [doc?.id])

  // Focus mode: nearest paragraph to viewport center
  const updateFocus = useCallback(() => {
    if (!settings.focusModeEnabled || !containerRef.current) return
    const paragraphs = containerRef.current.querySelectorAll<HTMLElement>('[data-paragraph-index]')
    const viewportCenter = window.innerHeight / 2
    let closest = 0
    let minDist = Infinity
    paragraphs.forEach((el) => {
      const rect = el.getBoundingClientRect()
      const dist = Math.abs(rect.top + rect.height / 2 - viewportCenter)
      if (dist < minDist) { minDist = dist; closest = Number(el.dataset.paragraphIndex) }
    })
    setFocusedIndex(closest)
  }, [settings.focusModeEnabled, containerRef])

  // Unified scroll handler: progress + header visibility + focus mode
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      const scrollable = document.documentElement.scrollHeight - window.innerHeight
      if (scrollable > 0) setScrollProgress(Math.round((y / scrollable) * 100))

      setHeaderVisible(y < lastScrollY.current || y < 60)
      lastScrollY.current = y

      if (settings.focusModeEnabled) updateFocus()
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [settings.focusModeEnabled, updateFocus])

  // Theme
  useEffect(() => {
    const root = document.documentElement
    if (settings.theme === 'dark') {
      root.classList.add('dark')
    } else if (settings.theme === 'light') {
      root.classList.remove('dark')
    } else {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      root.classList.toggle('dark', mq.matches)
      const handler = (e: MediaQueryListEvent) => root.classList.toggle('dark', e.matches)
      mq.addEventListener('change', handler)
      return () => mq.removeEventListener('change', handler)
    }
  }, [settings.theme])

  if (doc === undefined) return <Spinner />
  if (doc === null) return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-gray-500">Document not found.</p>
    </div>
  )

  const fontFamily = settings.fontFamily === 'serif'
    ? '"Georgia", "Times New Roman", serif'
    : '"Inter", "system-ui", sans-serif'

  const minutesLeft = scrollProgress >= 99
    ? 0
    : Math.max(1, Math.ceil((1 - scrollProgress / 100) * doc.estimatedReadMinutes))

  const progressLabel = scrollProgress >= 99
    ? 'Done'
    : `${scrollProgress}% · ${minutesLeft} min left`

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--rf-reader-bg)' }}>

      {/* ── Top progress bar — always visible, above header ── */}
      <div
        role="progressbar"
        aria-valuenow={scrollProgress}
        aria-valuemin={0}
        aria-valuemax={100}
        className="fixed top-0 left-0 right-0 z-30 h-[2px] bg-gray-100 dark:bg-gray-800"
      >
        <div
          className="h-full bg-gray-900 dark:bg-white"
          style={{ width: `${scrollProgress}%`, transition: 'width 0.15s ease-out' }}
        />
      </div>

      {/* ── Nav header — auto-hides on scroll down ── */}
      <header
        className={`fixed top-[2px] left-0 right-0 z-20 bg-white/92 dark:bg-gray-950/92 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 px-3 transition-transform duration-200 ${
          headerVisible ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <div className="flex items-center gap-2 py-2.5 min-h-[56px]">

          {/* Back button — text label for clarity */}
          <button
            onClick={() => navigate('/')}
            aria-label="Back to library"
            className="flex items-center gap-1 shrink-0 h-9 pl-1.5 pr-3 rounded-xl text-gray-600 dark:text-gray-400 active:bg-gray-100 dark:active:bg-gray-800 transition-colors"
          >
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm font-medium">Back</span>
          </button>

          {/* Title + subtitle */}
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-semibold text-gray-900 dark:text-white line-clamp-2 leading-snug">
              {doc.title}
            </p>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5 leading-none">
              {doc.wordCount.toLocaleString()} words · {progressLabel}
            </p>
          </div>

          {/* Settings — filled button for prominence */}
          <button
            onClick={() => setSettingsOpen(true)}
            aria-label="Reading settings"
            className="flex items-center justify-center shrink-0 w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 active:opacity-70 transition-opacity"
          >
            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                d="M4 6h16M4 12h16M4 18h16" />
              <circle cx="8" cy="6" r="2" fill="currentColor" stroke="none" />
              <circle cx="16" cy="12" r="2" fill="currentColor" stroke="none" />
              <circle cx="10" cy="18" r="2" fill="currentColor" stroke="none" />
            </svg>
          </button>

        </div>
      </header>

      {/* ── Reading content ── */}
      <main
        ref={containerRef}
        dir={readerDirection}
        className={`px-5 pt-[84px] pb-24 mx-auto w-full ${readerAlignmentClass}`}
        style={{
          fontFamily,
          fontSize: `${settings.fontSize}px`,
          lineHeight: settings.lineHeight,
          maxWidth: '72ch',
          color: 'var(--rf-text-primary)',
        }}
      >
        <h1 className="text-2xl font-bold mb-2 leading-tight">
          {doc.title}
        </h1>
        <p className="text-sm mb-10" style={{ color: 'var(--rf-text-secondary)' }}>
          {doc.wordCount.toLocaleString()} words · {doc.estimatedReadMinutes} min
          {doc.tags.length > 0 && <> · {doc.tags.join(', ')}</>}
        </p>

        <div className="space-y-6">
          {doc.paragraphs.map((text, i) => {
            const isArabicParagraph = containsArabicScript(text)
            const blockLineHeight = isArabicParagraph ? arabicParagraphLineHeight : settings.lineHeight
            return (
              <ParagraphBlock
                key={i}
                index={i}
                text={text}
                focused={focusedIndex === i}
                focusModeEnabled={settings.focusModeEnabled}
                dimOpacity={settings.focusDimOpacity}
                isArabic={isArabicParagraph}
                lineHeight={blockLineHeight}
              />
            )
          })}
        </div>

        <p className="text-center text-sm mt-16 mb-4" style={{ color: 'var(--rf-text-secondary)' }}>
          — End of document —
        </p>
      </main>

      {/* ── Settings sheet ── */}
      <ReaderSettings
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onUpdate={updateSettings}
      />

      {/* ── Resume banner ── */}
      {resumePercent !== null && (
        <ContinueReadingBanner
          percent={resumePercent}
          onDismiss={() => setResumePercent(null)}
        />
      )}
    </div>
  )
}
