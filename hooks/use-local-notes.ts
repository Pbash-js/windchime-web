"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"

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

export function useLocalNotes() {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    if (!user) {
      setNotes([])
      setLoading(false)
      return
    }

    loadNotes()
  }, [user])

  const loadNotes = () => {
    if (!user) return

    try {
      const notesKey = `notes-${user.uid}`
      const stored = localStorage.getItem(notesKey)

      if (stored) {
        const parsedNotes = JSON.parse(stored).map((note: any) => ({
          ...note,
          createdAt: new Date(note.createdAt),
          updatedAt: new Date(note.updatedAt),
        }))
        setNotes(parsedNotes.sort((a: Note, b: Note) => b.updatedAt.getTime() - a.updatedAt.getTime()))
      }
    } catch (error) {
      console.error("Error loading notes:", error)
    } finally {
      setLoading(false)
    }
  }

  const saveNotes = (newNotes: Note[]) => {
    if (!user) return

    try {
      const notesKey = `notes-${user.uid}`
      localStorage.setItem(notesKey, JSON.stringify(newNotes))
    } catch (error) {
      console.error("Error saving notes:", error)
    }
  }

  const addNote = async (noteData: Omit<Note, "id" | "userId">) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to add notes",
        variant: "destructive",
      })
      return
    }

    const newNote: Note = {
      ...noteData,
      id: `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: user.uid,
    }

    const newNotes = [newNote, ...notes]
    setNotes(newNotes)
    saveNotes(newNotes)

    toast({
      title: "Note saved",
      description: "Your note has been saved locally",
    })
  }

  const updateNote = async (noteId: string, updates: Partial<Omit<Note, "id" | "userId">>) => {
    if (!user) return

    const newNotes = notes.map((note) =>
      note.id === noteId
        ? {
            ...note,
            ...updates,
            updatedAt: new Date(),
          }
        : note,
    )

    setNotes(newNotes)
    saveNotes(newNotes)
  }

  const deleteNote = async (noteId: string) => {
    if (!user) return

    const newNotes = notes.filter((note) => note.id !== noteId)
    setNotes(newNotes)
    saveNotes(newNotes)

    toast({
      title: "Note deleted",
      description: "Note has been removed",
    })
  }

  const togglePin = async (noteId: string, isPinned: boolean) => {
    await updateNote(noteId, { isPinned: !isPinned })
  }

  return {
    notes,
    loading,
    error: null,
    addNote,
    updateNote,
    deleteNote,
    togglePin,
    isOnline: true,
  }
}
