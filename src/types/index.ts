export interface Document {
  id: string
  title: string
  content: string
  paragraphs: string[]
  tags: string[]
  wordCount: number
  estimatedReadMinutes: number
  createdAt: number
  updatedAt: number
  lastReadAt: number | null
  readingPosition: { paragraphIndex: number } | null
}

export interface AppSettings {
  fontSize: number
  lineHeight: number
  fontFamily: 'serif' | 'sans'
  theme: 'light' | 'dark' | 'system'
  focusModeEnabled: boolean
  focusDimOpacity: number
}

export const DEFAULT_SETTINGS: AppSettings = {
  fontSize: 19,
  lineHeight: 1.9,
  fontFamily: 'serif',
  theme: 'system',
  focusModeEnabled: false,
  focusDimOpacity: 0.15,
}
