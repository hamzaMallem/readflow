import { Suspense, lazy, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useSettings } from './features/settings/useSettings'
import { Spinner } from './components/ui/Spinner'

const LibraryPage = lazy(() => import('./pages/LibraryPage'))
const NewDocumentPage = lazy(() => import('./pages/NewDocumentPage'))
const ReaderPage = lazy(() => import('./pages/ReaderPage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { settings } = useSettings()

  useEffect(() => {
    const root = document.documentElement
    if (settings.theme === 'dark') {
      root.classList.add('dark')
    } else if (settings.theme === 'light') {
      root.classList.remove('dark')
    } else {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      root.classList.toggle('dark', mq.matches)
      const handler = (e: MediaQueryListEvent) => root.classList.toggle('dark', e.matches)
      mq.addEventListener('change', handler)
      return () => mq.removeEventListener('change', handler)
    }
  }, [settings.theme])

  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <Suspense fallback={<Spinner />}>
          <Routes>
            <Route path="/" element={<LibraryPage />} />
            <Route path="/new" element={<NewDocumentPage />} />
            <Route path="/read/:id" element={<ReaderPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </Suspense>
      </ThemeProvider>
    </BrowserRouter>
  )
}
