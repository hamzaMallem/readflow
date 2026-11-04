import { useAuth } from '../../features/auth/useAuth'
import { useState, useSyncExternalStore } from 'react'
import { subscribeSync, getSyncState, retrySync } from '../../features/sync/syncService'

function authMessage(cause: unknown) {
  const code = typeof cause === 'object' && cause !== null && 'code' in cause ? String(cause.code) : ''
  if (code === 'auth/unauthorized-domain') return 'Google sign-in is not enabled for this site yet. The site owner needs to add this domain in Firebase Authentication → Settings → Authorized domains.'
  if (code === 'auth/popup-blocked') return 'Your browser blocked the sign-in window. Allow pop-ups for this site, then try again.'
  if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') return null
  if (code === 'auth/network-request-failed') return 'Could not connect to Google. Check your connection and try again.'
  return 'Could not complete the account action. Please try again.'
}

function GoogleMark() {
  return <svg aria-hidden="true" width="18" height="18" viewBox="0 0 48 48"><path fill="#4285F4" d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5h6.6c3.9-3.6 6.1-8.9 6.1-14.9Z"/><path fill="#34A853" d="M24 44c5.5 0 10.1-1.8 13.5-4.6l-6.6-5a12.3 12.3 0 0 1-18.2-6.5H5.9v5.2A20.4 20.4 0 0 0 24 44Z"/><path fill="#FBBC05" d="M12.7 27.9a12 12 0 0 1 0-7.8v-5.2H5.9a20 20 0 0 0 0 18.2l6.8-5.2Z"/><path fill="#EA4335" d="M24 12c3 0 5.6 1 7.7 3l5.8-5.8A19.6 19.6 0 0 0 24 4 20.4 20.4 0 0 0 5.9 14.9l6.8 5.2A12 12 0 0 1 24 12Z"/></svg>
}

export function SyncSection() {
  const { user, isLoading, signIn, signOut } = useAuth()
  const sync = useSyncExternalStore(subscribeSync, getSyncState)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  async function perform(action: () => Promise<unknown>) {
    setError(null)
    setBusy(true)
    try { await action() } catch (cause) { setError(authMessage(cause)) }
    finally { setBusy(false) }
  }
  const labels = { 'signed-out': 'Sync is paused', connecting: 'Connecting…', syncing: 'Syncing your library…', synced: 'Your library is up to date', offline: 'Offline · saved on this device', error: 'Sync needs attention' }
  const descriptions = { 'signed-out': 'Sign in again to resume syncing.', connecting: 'Checking for changes across your devices.', syncing: 'Keep ReadFlow open until syncing finishes.', synced: 'Documents, tags and reading position are synced.', offline: 'Your changes will sync when you’re back online.', error: 'Your local documents are still available.' }
  const problem = error || (user && sync.error ? 'We couldn’t sync your library. Check your connection, then try again.' : null)

  return (
    <section aria-labelledby="sync-heading">
      <h2 id="sync-heading" className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Sync</h2>
      <div className="sync-panel">
        <div className="sync-body">
          {isLoading ? <p role="status" className="sync-description">Checking your account…</p> : user ? <>
            <div className="sync-account">
              <span className="sync-avatar" aria-hidden="true">{(user.displayName || user.email || 'R').slice(0, 1).toUpperCase()}</span>
              <div className="min-w-0 flex-1"><h3 className="sync-title truncate">{user.displayName || 'Your account'}</h3><p className="sync-description truncate">{user.email}</p></div>
              <button onClick={() => void perform(signOut)} disabled={busy} className="sync-signout">{busy ? 'Please wait…' : 'Sign out'}</button>
            </div>
            <div role="status" aria-live="polite" className="sync-status"><span className={`sync-dot ${sync.status === 'synced' ? 'is-synced' : ''}`} aria-hidden="true"/><div><p className="sync-status-title">{labels[sync.status]}</p><p className="sync-description">{descriptions[sync.status]}</p></div></div>
          </> : <>
            <div className="sync-intro"><svg className="sync-device-icon" aria-hidden="true" width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="5" width="20" height="15" rx="2"/><path d="M8 25h10M13 20v5"/><rect x="21" y="13" width="8" height="14" rx="2"/><path d="M24 24h2"/></svg><span className="sync-local-label">Saved on this device</span></div><div className="sync-signin-layout"><div><h3 className="sync-title">Your library. Every device.</h3>
            <p id="sync-benefit" className="sync-description mt-2 max-w-sm">Sync your documents, tags and reading position with your Google account.</p></div><div className="sync-action">
            <button onClick={() => void perform(signIn)} disabled={busy} aria-busy={busy} aria-describedby="sync-benefit" className="sync-google">{busy ? <span className="sync-spinner" aria-hidden="true" /> : <GoogleMark />}{busy ? 'Connecting to Google…' : 'Sign in with Google'}</button>
            <p className="sync-caption">Optional. Read offline anytime.</p></div></div>
          </>}
          {problem && <div role="alert" className="sync-error"><p className="font-medium">{user ? 'Sync interrupted' : 'Unable to sign in'}</p><p className="mt-1">{problem}</p>{user && sync.status === 'error' && <button onClick={retrySync} className="sync-retry">Try syncing again</button>}</div>}
        </div>
        <div className="sync-footer">{user ? 'Use this Google account on your other devices.' : 'Already use ReadFlow elsewhere? Choose the same Google account.'}</div>
      </div>
    </section>
  )
}
