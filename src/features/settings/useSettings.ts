import { useState, useEffect, useCallback } from 'react'
import { DEFAULT_SETTINGS, type AppSettings } from '../../types'

const STORAGE_KEY = 'readflow_settings'

function load(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
  } catch {}
  return DEFAULT_SETTINGS
}

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(load)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  }, [settings])

  const update = useCallback((changes: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...changes }))
  }, [])

  return { settings, update }
}
