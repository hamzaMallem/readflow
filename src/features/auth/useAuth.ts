import { useEffect, useState } from 'react'
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth'
import { auth } from '../../lib/firebase'
import { startSync, stopSync } from '../sync/syncService'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    return onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser)
      setIsLoading(false)
      if (nextUser) {
        void startSync(nextUser.uid)
      } else {
        stopSync()
      }
    })
  }, [])

  const signIn = () => signInWithPopup(auth, new GoogleAuthProvider())
  const signOut = () => firebaseSignOut(auth)

  return { user, isLoading, signIn, signOut }
}
