import { useNavigate } from 'react-router-dom'
import { useSettings } from '../features/settings/useSettings'
import { IconButton } from '../components/ui/IconButton'
import { SyncSection } from '../components/settings/SyncSection'

export default function SettingsPage() {
  const navigate = useNavigate()
  const { settings, update } = useSettings()

  return (
    <div className="settings-page">
      <header className="settings-header pt-safe-top">
        <IconButton label="Back" onClick={() => navigate('/')}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </IconButton>
        <h1 className="settings-header-title">Settings</h1>
      </header>

      <main className="settings-content">
        {/* Reading */}
        <section>
          <h2 className="settings-section-title">Reading</h2>
          <div className="settings-group">
            {/* Font size */}
            <SettingRow label="Font size">
              <Stepper
                value={settings.fontSize} label="Font size" valueLabel={`${settings.fontSize}px`}
                min={14} max={24}
                onDecrement={() => update({ fontSize: Math.max(14, settings.fontSize - 1) })}
                onIncrement={() => update({ fontSize: Math.min(24, settings.fontSize + 1) })}
              />
            </SettingRow>

            {/* Line spacing */}
            <SettingRow label="Line spacing">
              <Stepper
                value={settings.lineHeight} label="Line spacing" valueLabel={settings.lineHeight.toFixed(1)}
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
          <h2 className="settings-section-title">Appearance</h2>
          <div className="settings-group">
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
          <h2 className="settings-section-title">Focus</h2>
          <div className="settings-group">
            <SettingRow label="Focus mode" detail="Highlights current paragraph">
              <Toggle
                value={settings.focusModeEnabled}
                onChange={(v) => update({ focusModeEnabled: v })}
              />
            </SettingRow>
          </div>
        </section>

        {/* Sync */}
        <SyncSection />

        <p className="settings-footnote">
          ReadFlow · Stored on this device, synced when signed in
        </p>
      </main>
    </div>
  )
}

function SettingRow({ label, detail, children }: { label: string; detail?: string; children?: React.ReactNode }) {
  return (
    <div className="settings-row">
      <div>
        <span className="settings-label">{label}</span>
        {detail && <p className="settings-detail">{detail}</p>}
      </div>
      {children}
    </div>
  )
}

function Stepper({ value, min, max, label, valueLabel, onDecrement, onIncrement }: {
  value: number; min: number; max: number; label: string; valueLabel: string
  onDecrement: () => void; onIncrement: () => void
}) {
  return (
    <div className="settings-stepper" role="group" aria-label={label}>
      <button aria-label={`Decrease ${label.toLowerCase()}`} onClick={onDecrement} disabled={value <= min}>−</button>
      <output aria-live="polite">{valueLabel}</output>
      <button aria-label={`Increase ${label.toLowerCase()}`} onClick={onIncrement} disabled={value >= max}>+</button>
    </div>
  )
}

function SegmentControl({ options, value, onChange }: {
  options: { value: string; label: string }[]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="settings-segments">
      {options.map((opt) => (
        <button
          key={opt.value} aria-pressed={value === opt.value}
          onClick={() => onChange(opt.value)}
          className="settings-segment"
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
      role="switch" aria-label="Focus mode" aria-checked={value} onClick={() => onChange(!value)}
      className="settings-toggle"
    >
      <span className="settings-toggle-track" aria-hidden="true"><span /></span>
    </button>
  )
}
