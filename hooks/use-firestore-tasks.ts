"use client"

import { useState, useEffect } from "react"
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { useNetworkStatus } from "@/hooks/use-network-status"

export interface Task {
  id: string
  title: string
  completed: boolean
  createdAt: Date
  dueDate: Date
  userId: string
  updatedAt: Date
}

export function useFirestoreTasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()
  const { toast } = useToast()
  const { isOnline } = useNetworkStatus()

  useEffect(() => {
    if (!user) {
      setTasks([])
      setLoading(false)
      return
    }

    const tasksRef = collection(db, "tasks")
    const q = query(tasksRef, where("userId", "==", user.uid), orderBy("createdAt", "desc"))

    const unsubscribe = onSnapshot(
      q,
      {
        includeMetadataChanges: true,
      },
      (snapshot) => {
        try {
          const tasksData: Task[] = []
          snapshot.forEach((doc) => {
            const data = doc.data()
            tasksData.push({
              id: doc.id,
              title: data.title,
              completed: data.completed,
              createdAt: data.createdAt?.toDate() || new Date(),
              dueDate: data.dueDate?.toDate() || new Date(),
              userId: data.userId,
              updatedAt: data.updatedAt?.toDate() || new Date(),
            })
          })
          setTasks(tasksData)
          setLoading(false)
          setError(null)

          // Show sync status
          if (snapshot.metadata.fromCache && !snapshot.metadata.hasPendingWrites) {
            console.log("Tasks loaded from cache")
          } else if (!snapshot.metadata.fromCache) {
            console.log("Tasks loaded from server")
          }
        } catch (err) {
          console.error("Error processing tasks snapshot:", err)
          setError("Failed to process tasks")
          setLoading(false)
        }
      },
      (err) => {
        console.error("Error fetching tasks:", err)

        // Handle offline errors gracefully
        if (err.code === "unavailable") {
          setError("Working offline - using cached data")
          console.log("Firestore unavailable, using cached data")
        } else {
          setError("Failed to load tasks")
          toast({
            title: "Error loading tasks",
            description: isOnline ? "Please check your connection and try again" : "Working offline with cached data",
            variant: "destructive",
          })
        }
        setLoading(false)
      },
    )

    return () => unsubscribe()
  }, [user, toast, isOnline])

  const addTask = async (taskData: Omit<Task, "id" | "userId" | "updatedAt">) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to add tasks",
        variant: "destructive",
      })
      return
    }

    try {
      const tasksRef = collection(db, "tasks")
      await addDoc(tasksRef, {
        ...taskData,
        userId: user.uid,
        createdAt: Timestamp.fromDate(taskData.createdAt),
        dueDate: Timestamp.fromDate(taskData.dueDate),
        updatedAt: serverTimestamp(),
      })

      toast({
        title: "Task added",
        description: isOnline ? "Your task has been saved successfully" : "Task saved locally - will sync when online",
      })
    } catch (error: any) {
      console.error("Error adding task:", error)

      if (error.code === "unavailable") {
        toast({
          title: "Task saved locally",
          description: "Will sync when you're back online",
        })
      } else {
        toast({
          title: "Failed to add task",
          description: "Please try again",
          variant: "destructive",
        })
      }
    }
  }

  const updateTask = async (taskId: string, updates: Partial<Omit<Task, "id" | "userId">>) => {
    if (!user) return

    try {
      const taskRef = doc(db, "tasks", taskId)
      const updateData: any = {
        ...updates,
        updatedAt: serverTimestamp(),
      }

      // Convert dates to Timestamps if present
      if (updates.createdAt) {
        updateData.createdAt = Timestamp.fromDate(updates.createdAt)
      }
      if (updates.dueDate) {
        updateData.dueDate = Timestamp.fromDate(updates.dueDate)
      }

      await updateDoc(taskRef, updateData)

      if (updates.completed !== undefined) {
        toast({
          title: updates.completed ? "Task completed! 🎉" : "Task reopened",
          description: updates.completed
            ? isOnline
              ? "Great job staying productive!"
              : "Marked complete - will sync when online"
            : isOnline
              ? "Task marked as incomplete"
              : "Reopened - will sync when online",
        })
      }
    } catch (error: any) {
      console.error("Error updating task:", error)

      if (error.code === "unavailable") {
        toast({
          title: "Update saved locally",
          description: "Will sync when you're back online",
        })
      } else {
        toast({
          title: "Failed to update task",
          description: "Please try again",
          variant: "destructive",
        })
      }
    }
  }

  const deleteTask = async (taskId: string) => {
    if (!user) return

    try {
      const taskRef = doc(db, "tasks", taskId)
      await deleteDoc(taskRef)

      toast({
        title: "Task deleted",
        description: isOnline ? "Task has been removed successfully" : "Deleted locally - will sync when online",
      })
    } catch (error: any) {
      console.error("Error deleting task:", error)

      if (error.code === "unavailable") {
        toast({
          title: "Delete saved locally",
          description: "Will sync when you're back online",
        })
      } else {
        toast({
          title: "Failed to delete task",
          description: "Please try again",
          variant: "destructive",
        })
      }
    }
  }

  return {
    tasks,
    loading,
    error,
    addTask,
    updateTask,
    deleteTask,
    isOnline,
  }
}
