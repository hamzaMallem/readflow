import { useAuth } from '../../features/auth/useAuth'

export function SyncSection() {
  const { user, isLoading, signIn, signOut } = useAuth()

  return (
    <section>
      <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Sync</h2>
      <div className="bg-white dark:bg-gray-900 rounded-2xl divide-y divide-gray-100 dark:divide-gray-800 overflow-hidden">
        {isLoading ? (
          <div className="px-4 py-3.5 min-h-[56px] flex items-center text-sm text-gray-400">
            Checking sign-in status…
          </div>
        ) : user ? (
          <div className="flex items-center justify-between px-4 py-3.5 min-h-[56px] gap-3">
            <div className="min-w-0">
              <span className="text-sm text-gray-900 dark:text-white">Synced</span>
              <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{user.email}</p>
            </div>
            <button
              onClick={signOut}
              className="shrink-0 text-sm font-medium text-red-600 dark:text-red-400 px-3 min-h-[44px]"
            >
              Sign out
            </button>
          </div>
        ) : (
          <button
            onClick={signIn}
            className="w-full flex items-center justify-between px-4 py-3.5 min-h-[56px] text-left"
          >
            <div>
              <span className="text-sm text-gray-900 dark:text-white">Sign in with Google</span>
              <p className="text-xs text-gray-400 dark:text-gray-500">Sync documents across your devices</p>
            </div>
          </button>
        )}
      </div>
    </section>
  )
}
