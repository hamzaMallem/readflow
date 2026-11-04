import { useCallback, useSyncExternalStore } from 'react'
import { DEFAULT_SETTINGS, type AppSettings } from '../../types'

const STORAGE_KEY = 'readflow_settings'
function load(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
  } catch { /* Use defaults if stored settings are invalid. */ }
  return DEFAULT_SETTINGS
}
let settings = load()
const listeners = new Set<() => void>()
const getSnapshot = () => settings
const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}
window.addEventListener('storage', (event) => {
  if (event.key !== STORAGE_KEY && event.key !== null) return
  settings = load()
  listeners.forEach((listener) => listener())
})

export function useSettings() {
  const current = useSyncExternalStore(subscribe, getSnapshot)
  const update = useCallback((changes: Partial<AppSettings>) => {
    settings = { ...settings, ...changes }
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)) }
    catch { /* Keep settings usable if browser storage is unavailable. */ }
    listeners.forEach((listener) => listener())
  }, [])
  return { settings: current, update }
}
