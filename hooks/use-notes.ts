"use client"

import { useAuth } from "@/contexts/auth-context"
import { useLocalNotes } from "./use-local-notes"
import { useFirestoreNotes } from "./use-firestore-notes"

/**
 * A master hook for handling notes. It intelligently switches between
 * Firestore and local storage based on the user's authentication state.
 *
 * - If the user is signed in, it uses `useFirestoreNotes`.
 * - If the user is not signed in, it uses `useLocalNotes`.
 *
 * TODO: Implement data migration from local storage to Firestore on login.
 */
export function useNotes() {
  const { user } = useAuth()
  const localNotes = useLocalNotes()
  const firestoreNotes = useFirestoreNotes()

  if (user) {
    return firestoreNotes
  } else {
    return localNotes
  }
}
