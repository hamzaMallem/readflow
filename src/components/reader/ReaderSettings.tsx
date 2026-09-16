import type { AppSettings } from '../../types'
import { BottomSheet } from '../ui/BottomSheet'

interface ReaderSettingsProps {
  open: boolean
  onClose: () => void
  settings: AppSettings
  onUpdate: (changes: Partial<AppSettings>) => void
}

function Stepper({
  label, onDecrement, onIncrement, display,
}: {
  label: string
  onDecrement: () => void
  onIncrement: () => void
  display: string
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800">
      <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
      <div className="flex items-center gap-3">
        <button
          onClick={onDecrement}
          className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white text-lg font-medium flex items-center justify-center active:opacity-60"
        >−</button>
        <span className="text-sm w-10 text-center text-gray-900 dark:text-white">{display}</span>
        <button
          onClick={onIncrement}
          className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white text-lg font-medium flex items-center justify-center active:opacity-60"
        >+</button>
      </div>
    </div>
  )
}

export function ReaderSettings({ open, onClose, settings, onUpdate }: ReaderSettingsProps) {
  return (
    <BottomSheet open={open} onClose={onClose} title="Reading Settings">
      <Stepper
        label="Font size"
        display={`${settings.fontSize}px`}
        onDecrement={() => onUpdate({ fontSize: Math.max(14, settings.fontSize - 1) })}
        onIncrement={() => onUpdate({ fontSize: Math.min(24, settings.fontSize + 1) })}
      />
      <Stepper
        label="Line spacing"
        display={settings.lineHeight.toFixed(1)}
        onDecrement={() => onUpdate({ lineHeight: Math.max(1.4, parseFloat((settings.lineHeight - 0.1).toFixed(1))) })}
        onIncrement={() => onUpdate({ lineHeight: Math.min(2.2, parseFloat((settings.lineHeight + 0.1).toFixed(1))) })}
      />

      {/* Font family */}
      <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800">
        <span className="text-sm text-gray-700 dark:text-gray-300">Font</span>
        <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
          {(['serif', 'sans'] as const).map((f) => (
            <button
              key={f}
              onClick={() => onUpdate({ fontFamily: f })}
              className={`px-4 h-9 text-sm transition-colors ${
                settings.fontFamily === f
                  ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              {f === 'serif' ? 'Serif' : 'Sans'}
            </button>
          ))}
        </div>
      </div>

      {/* Theme */}
      <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800">
        <span className="text-sm text-gray-700 dark:text-gray-300">Theme</span>
        <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
          {(['light', 'dark', 'system'] as const).map((t) => (
            <button
              key={t}
              onClick={() => onUpdate({ theme: t })}
              className={`px-3 h-9 text-xs capitalize transition-colors ${
                settings.theme === t
                  ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Focus mode toggle */}
      <div className="flex items-center justify-between py-3">
        <div>
          <span className="text-sm text-gray-700 dark:text-gray-300">Focus mode</span>
          <p className="text-xs text-gray-400 dark:text-gray-500">Highlights the current paragraph</p>
        </div>
        <button
          onClick={() => onUpdate({ focusModeEnabled: !settings.focusModeEnabled })}
          className={`relative w-12 h-7 rounded-full transition-colors ${
            settings.focusModeEnabled ? 'bg-gray-900 dark:bg-white' : 'bg-gray-200 dark:bg-gray-700'
          }`}
        >
          <span className={`absolute top-1 w-5 h-5 rounded-full bg-white dark:bg-gray-900 shadow transition-transform ${
            settings.focusModeEnabled ? 'translate-x-6' : 'translate-x-1'
          }`} />
        </button>
      </div>
    </BottomSheet>
  )
}
