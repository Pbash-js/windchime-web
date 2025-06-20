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

export interface Note {
  id: string
  title: string
  content: string
  createdAt: Date
  updatedAt: Date
  userId: string
  tags?: string[]
  isPinned?: boolean
}

export function useFirestoreNotes() {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()
  const { toast } = useToast()
  const { isOnline } = useNetworkStatus()

  useEffect(() => {
    if (!user) {
      setNotes([])
      setLoading(false)
      return
    }

    const notesRef = collection(db, "notes")
    const q = query(notesRef, where("userId", "==", user.uid), orderBy("updatedAt", "desc"))

    const unsubscribe = onSnapshot(
      q,
      {
        includeMetadataChanges: true,
      },
      (snapshot) => {
        try {
          const notesData: Note[] = []
          snapshot.forEach((doc) => {
            const data = doc.data()
            notesData.push({
              id: doc.id,
              title: data.title,
              content: data.content,
              createdAt: data.createdAt?.toDate() || new Date(),
              updatedAt: data.updatedAt?.toDate() || new Date(),
              userId: data.userId,
              tags: data.tags || [],
              isPinned: data.isPinned || false,
            })
          })
          setNotes(notesData)
          setLoading(false)
          setError(null)

          // Show sync status
          if (snapshot.metadata.fromCache && !snapshot.metadata.hasPendingWrites) {
            console.log("Notes loaded from cache")
          } else if (!snapshot.metadata.fromCache) {
            console.log("Notes loaded from server")
          }
        } catch (err) {
          console.error("Error processing notes snapshot:", err)
          setError("Failed to process notes")
          setLoading(false)
        }
      },
      (err) => {
        console.error("Error fetching notes:", err)

        // Handle offline errors gracefully
        if (err.code === "unavailable") {
          setError("Working offline - using cached data")
          console.log("Firestore unavailable, using cached data")
        } else {
          setError("Failed to load notes")
          toast({
            title: "Error loading notes",
            description: isOnline ? "Please check your connection and try again" : "Working offline with cached data",
            variant: "destructive",
          })
        }
        setLoading(false)
      },
    )

    return () => unsubscribe()
  }, [user, toast, isOnline])

  const addNote = async (noteData: Omit<Note, "id" | "userId">) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to add notes",
        variant: "destructive",
      })
      return
    }

    try {
      const notesRef = collection(db, "notes")
      await addDoc(notesRef, {
        ...noteData,
        userId: user.uid,
        createdAt: Timestamp.fromDate(noteData.createdAt),
        updatedAt: Timestamp.fromDate(noteData.updatedAt),
      })

      toast({
        title: "Note saved",
        description: isOnline ? "Your note has been saved successfully" : "Note saved locally - will sync when online",
      })
    } catch (error: any) {
      console.error("Error adding note:", error)

      if (error.code === "unavailable") {
        toast({
          title: "Note saved locally",
          description: "Will sync when you're back online",
        })
      } else {
        toast({
          title: "Failed to save note",
          description: "Please try again",
          variant: "destructive",
        })
      }
    }
  }

  const updateNote = async (noteId: string, updates: Partial<Omit<Note, "id" | "userId">>) => {
    if (!user) return

    try {
      const noteRef = doc(db, "notes", noteId)
      const updateData: any = {
        ...updates,
        updatedAt: serverTimestamp(),
      }

      // Convert dates to Timestamps if present
      if (updates.createdAt) {
        updateData.createdAt = Timestamp.fromDate(updates.createdAt)
      }

      await updateDoc(noteRef, updateData)
    } catch (error: any) {
      console.error("Error updating note:", error)

      if (error.code === "unavailable") {
        // Silently handle offline updates - they'll sync when online
        console.log("Note update saved locally, will sync when online")
      } else {
        toast({
          title: "Failed to update note",
          description: "Please try again",
          variant: "destructive",
        })
      }
    }
  }

  const deleteNote = async (noteId: string) => {
    if (!user) return

    try {
      const noteRef = doc(db, "notes", noteId)
      await deleteDoc(noteRef)

      toast({
        title: "Note deleted",
        description: isOnline ? "Note has been removed successfully" : "Deleted locally - will sync when online",
      })
    } catch (error: any) {
      console.error("Error deleting note:", error)

      if (error.code === "unavailable") {
        toast({
          title: "Delete saved locally",
          description: "Will sync when you're back online",
        })
      } else {
        toast({
          title: "Failed to delete note",
          description: "Please try again",
          variant: "destructive",
        })
      }
    }
  }

  const togglePin = async (noteId: string, isPinned: boolean) => {
    await updateNote(noteId, { isPinned: !isPinned })
  }

  return {
    notes,
    loading,
    error,
    addNote,
    updateNote,
    deleteNote,
    togglePin,
    isOnline,
  }
}
