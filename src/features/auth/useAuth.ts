import { useEffect, useState } from 'react'
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth'
import { auth } from '../../lib/firebase'
import { activeAccount } from '../../storage/db'
import { startSync, stopSync } from '../sync/syncService'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    return onAuthStateChanged(auth, (nextUser) => {
      const uid = nextUser?.uid ?? null
      if (uid !== activeAccount) {
        stopSync()
        if (uid) {
          if (!localStorage.getItem('readflow-legacy-owner')) {
            localStorage.setItem('readflow-legacy-owner', uid)
          }
          localStorage.setItem('readflow-active-account', uid)
        } else {
          localStorage.removeItem('readflow-active-account')
        }
        window.location.reload()
        return
      }
      setUser(nextUser)
      setIsLoading(false)
      if (nextUser) {
        void startSync(nextUser.uid)
      } else {
        stopSync()
      }
    })
  }, [])

  const signIn = () => {
    const provider = new GoogleAuthProvider()
    provider.setCustomParameters({ prompt: 'select_account' })
    return signInWithPopup(auth, provider)
  }
  const signOut = () => firebaseSignOut(auth)

  return { user, isLoading, signIn, signOut }
}
