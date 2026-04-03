import { useEffect, useRef, useCallback } from 'react'
import { documentService } from '../documents/documentService'

/**
 * Manages scroll-based progress tracking for the reader.
 * Saves paragraph index to IndexedDB, debounced at 300ms.
 */
export function useReader(documentId: string, _paragraphCount: number) {
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  const getActiveParagraphIndex = useCallback((): number => {
    const container = containerRef.current
    if (!container) return 0
    const paragraphs = container.querySelectorAll<HTMLElement>('[data-paragraph-index]')
    const viewportCenter = window.innerHeight / 2
    let closest = 0
    let minDist = Infinity
    paragraphs.forEach((el) => {
      const rect = el.getBoundingClientRect()
      const elCenter = rect.top + rect.height / 2
      const dist = Math.abs(elCenter - viewportCenter)
      if (dist < minDist) {
        minDist = dist
        closest = Number(el.dataset.paragraphIndex)
      }
    })
    return closest
  }, [])

  const handleScroll = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      const idx = getActiveParagraphIndex()
      documentService.savePosition(documentId, idx)
    }, 300)
  }, [documentId, getActiveParagraphIndex])

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [handleScroll])

  // Scroll to saved position on mount
  const restorePosition = useCallback((paragraphIndex: number) => {
    if (paragraphIndex === 0) return
    const container = containerRef.current
    if (!container) return
    const target = container.querySelector<HTMLElement>(
      `[data-paragraph-index="${paragraphIndex}"]`
    )
    if (target) {
      target.scrollIntoView({ behavior: 'instant', block: 'start' })
    }
  }, [])

  return { containerRef, restorePosition }
}
