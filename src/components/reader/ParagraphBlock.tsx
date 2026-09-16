import { memo } from 'react'

interface ParagraphBlockProps {
  text: string
  index: number
  focused: boolean
  dimOpacity: number
  focusModeEnabled: boolean
  isArabic: boolean
  lineHeight: number
}

export const ParagraphBlock = memo(function ParagraphBlock({
  text, index, focused, dimOpacity, focusModeEnabled, isArabic, lineHeight,
}: ParagraphBlockProps) {
  const isDimmed = focusModeEnabled && !focused
  const isFocused = focusModeEnabled && focused
  const direction = isArabic ? 'rtl' : 'ltr'

  return (
    <p
      data-paragraph-index={index}
      dir={direction}
      style={{
        opacity: isDimmed ? Math.max(0.75, 1 - dimOpacity) : 1,
        backgroundColor: isFocused ? 'var(--rf-focus-bg)' : 'transparent',
        transition: 'opacity 0.25s ease, background-color 0.25s ease',
        // Always present so focus mode toggle causes no layout shift
        borderRadius: '6px',
        padding: '4px 10px',
        margin: '0 -10px',
        lineHeight,
        textAlign: isArabic ? 'right' : 'left',
        unicodeBidi: isArabic ? 'plaintext' : 'normal',
        wordSpacing: isArabic ? '0.08em' : 'normal',
        letterSpacing: isArabic ? '0' : 'normal',
        // Near-virtualization: skip rendering offscreen paragraphs
        contentVisibility: 'auto',
        containIntrinsicSize: 'auto 3em',
      }}
    >
      {text}
    </p>
  )
})
