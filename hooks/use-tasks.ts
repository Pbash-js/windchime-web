"use client"

import { useAuth } from "@/contexts/auth-context"
import { useLocalTasks } from "./use-local-tasks"
import { useFirestoreTasks } from "./use-firestore-tasks"

/**
 * A master hook for handling tasks. It intelligently switches between
 * Firestore and local storage based on the user's authentication state.
 *
 * - If the user is signed in, it uses `useFirestoreTasks`.
 * - If the user is not signed in, it uses `useLocalTasks`.
 *
 * TODO: Implement data migration from local storage to Firestore on login.
 */
export function useTasks() {
  const { user } = useAuth()
  const localTasks = useLocalTasks()
  const firestoreTasks = useFirestoreTasks()

  if (user) {
    return firestoreTasks
  } else {
    return localTasks
  }
}
