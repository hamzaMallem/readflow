const ARABIC_CHAR_RANGES = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/

export function containsArabicScript(value?: string | null): boolean {
  if (!value) return false
  return ARABIC_CHAR_RANGES.test(value)
}

export function hasArabicContent(values: Array<string | null | undefined>): boolean {
  return values.some((value) => containsArabicScript(value ?? ''))
}
