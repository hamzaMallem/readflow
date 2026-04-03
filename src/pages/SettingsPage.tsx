import { useNavigate } from 'react-router-dom'
import { useSettings } from '../features/settings/useSettings'
import { IconButton } from '../components/ui/IconButton'

export default function SettingsPage() {
  const navigate = useNavigate()
  const { settings, update } = useSettings()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-950 px-4 pt-safe-top pb-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
        <IconButton label="Back" onClick={() => navigate(-1)}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </IconButton>
        <h1 className="text-base font-semibold text-gray-900 dark:text-white">Settings</h1>
      </header>

      <main className="px-4 py-5 space-y-6">
        {/* Reading */}
        <section>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Reading</h2>
          <div className="bg-white dark:bg-gray-900 rounded-2xl divide-y divide-gray-100 dark:divide-gray-800 overflow-hidden">
            {/* Font size */}
            <SettingRow label="Font size" detail={`${settings.fontSize}px`}>
              <Stepper
                value={settings.fontSize}
                min={14} max={24}
                onDecrement={() => update({ fontSize: Math.max(14, settings.fontSize - 1) })}
                onIncrement={() => update({ fontSize: Math.min(24, settings.fontSize + 1) })}
              />
            </SettingRow>

            {/* Line spacing */}
            <SettingRow label="Line spacing" detail={settings.lineHeight.toFixed(1)}>
              <Stepper
                value={settings.lineHeight}
                min={1.4} max={2.2}
                onDecrement={() => update({ lineHeight: Math.max(1.4, parseFloat((settings.lineHeight - 0.1).toFixed(1))) })}
                onIncrement={() => update({ lineHeight: Math.min(2.2, parseFloat((settings.lineHeight + 0.1).toFixed(1))) })}
              />
            </SettingRow>

            {/* Font family */}
            <SettingRow label="Font">
              <SegmentControl
                options={[
                  { value: 'serif', label: 'Serif' },
                  { value: 'sans', label: 'Sans' },
                ]}
                value={settings.fontFamily}
                onChange={(v) => update({ fontFamily: v as 'serif' | 'sans' })}
              />
            </SettingRow>
          </div>
        </section>

        {/* Appearance */}
        <section>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Appearance</h2>
          <div className="bg-white dark:bg-gray-900 rounded-2xl divide-y divide-gray-100 dark:divide-gray-800 overflow-hidden">
            <SettingRow label="Theme">
              <SegmentControl
                options={[
                  { value: 'light', label: 'Light' },
                  { value: 'dark', label: 'Dark' },
                  { value: 'system', label: 'Auto' },
                ]}
                value={settings.theme}
                onChange={(v) => update({ theme: v as 'light' | 'dark' | 'system' })}
              />
            </SettingRow>
          </div>
        </section>

        {/* Focus mode */}
        <section>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Focus</h2>
          <div className="bg-white dark:bg-gray-900 rounded-2xl divide-y divide-gray-100 dark:divide-gray-800 overflow-hidden">
            <SettingRow label="Focus mode" detail="Highlights current paragraph">
              <Toggle
                value={settings.focusModeEnabled}
                onChange={(v) => update({ focusModeEnabled: v })}
              />
            </SettingRow>
          </div>
        </section>

        <p className="text-center text-xs text-gray-400 dark:text-gray-600 pt-4">
          ReadFlow · All data stored locally on your device
        </p>
      </main>
    </div>
  )
}

function SettingRow({ label, detail, children }: { label: string; detail?: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-4 py-3.5 min-h-[56px]">
      <div>
        <span className="text-sm text-gray-900 dark:text-white">{label}</span>
        {detail && <p className="text-xs text-gray-400 dark:text-gray-500">{detail}</p>}
      </div>
      {children}
    </div>
  )
}

function Stepper({ value, min, max, onDecrement, onIncrement }: {
  value: number; min: number; max: number; onDecrement: () => void; onIncrement: () => void
}) {
  return (
    <div className="flex items-center gap-2">
      <button onClick={onDecrement} disabled={value <= min}
        className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-lg text-gray-900 dark:text-white disabled:opacity-30 active:opacity-60">−</button>
      <button onClick={onIncrement} disabled={value >= max}
        className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-lg text-gray-900 dark:text-white disabled:opacity-30 active:opacity-60">+</button>
    </div>
  )
}

function SegmentControl({ options, value, onChange }: {
  options: { value: string; label: string }[]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-3 h-9 text-xs font-medium transition-colors ${
            value === opt.value
              ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
              : 'text-gray-600 dark:text-gray-400'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`relative w-12 h-7 rounded-full transition-colors ${
        value ? 'bg-gray-900 dark:bg-white' : 'bg-gray-200 dark:bg-gray-700'
      }`}
    >
      <span className={`absolute top-1 w-5 h-5 rounded-full bg-white dark:bg-gray-900 shadow transition-transform ${
        value ? 'translate-x-6' : 'translate-x-1'
      }`} />
    </button>
  )
}
