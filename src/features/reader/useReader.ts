import { useEffect, useRef, useCallback } from 'react'
import { documentService } from '../documents/documentService'

/**
 * Manages scroll-based progress tracking for the reader.
 * Saves paragraph index to IndexedDB, debounced at 300ms.
 */
export function useReader(documentId: string) {
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingPosition = useRef(0)
  const restoring = useRef(false)
  const restoreFrame = useRef<number | null>(null)
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
    if (!containerRef.current || restoring.current) return
    pendingPosition.current = getActiveParagraphIndex()
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      saveTimer.current = null
      void documentService.savePosition(documentId, pendingPosition.current)
    }, 300)
  }, [documentId, getActiveParagraphIndex])

  useEffect(() => {
    const flush = () => {
      if (!saveTimer.current) return
      clearTimeout(saveTimer.current)
      saveTimer.current = null
      void documentService.savePosition(documentId, pendingPosition.current)
    }
    const onVisibility = () => { if (document.visibilityState === 'hidden') flush() }
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('pagehide', flush)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      if (restoreFrame.current !== null) cancelAnimationFrame(restoreFrame.current)
      restoring.current = false
      flush()
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('pagehide', flush)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [handleScroll, documentId, getActiveParagraphIndex])

  // Scroll to saved position on mount
  const restorePosition = useCallback((paragraphIndex: number) => {
    if (paragraphIndex === 0) return
    const container = containerRef.current
    if (!container) return
    const target = container.querySelector<HTMLElement>(
      `[data-paragraph-index="${paragraphIndex}"]`
    )
    if (target) {
      if (restoreFrame.current !== null) cancelAnimationFrame(restoreFrame.current)
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = null
      restoring.current = true
      // Offscreen paragraphs use estimated heights until the browser renders
      // them. Re-align across layout frames before enabling progress saves.
      let frames = 0
      let stableFrames = 0
      const align = () => {
        target.scrollIntoView({ behavior: 'instant', block: 'center' })
        restoreFrame.current = requestAnimationFrame(() => {
          const rect = target.getBoundingClientRect()
          const centered = Math.abs(rect.top + rect.height / 2 - window.innerHeight / 2) < 2
          stableFrames = centered ? stableFrames + 1 : 0
          if (++frames < 12 && stableFrames < 3) align()
          else {
            restoreFrame.current = null
            restoring.current = false
          }
        })
      }
      align()
    }
  }, [])

  return { containerRef, restorePosition }
}
