"use client"

import { useState, useEffect, useCallback } from "react"
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

const NOTES_STORAGE_KEY = "windchime-local-notes"

export function useLocalNotes() {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const loadNotes = useCallback(() => {
    setLoading(true)
    try {
      const stored = localStorage.getItem(NOTES_STORAGE_KEY)
      if (stored) {
        const parsedNotes = JSON.parse(stored).map((note: any) => ({
          ...note,
          createdAt: new Date(note.createdAt),
          updatedAt: new Date(note.updatedAt),
        }))
        setNotes(parsedNotes.sort((a: Note, b: Note) => b.updatedAt.getTime() - a.updatedAt.getTime()))
      } else {
        setNotes([])
      }
    } catch (error) {
      console.error("Error loading notes from local storage:", error)
      setNotes([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadNotes()
  }, [loadNotes])

  const saveNotes = (newNotes: Note[]) => {
    try {
      localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(newNotes))
    } catch (error) {
      console.error("Error saving notes to local storage:", error)
      toast({
        title: "Error",
        description: "Could not save notes.",
        variant: "destructive",
      })
    }
  }

  const addNote = async (noteData: Omit<Note, "id" | "userId" | "createdAt" | "updatedAt">) => {
    const newNote: Note = {
      ...noteData,
      id: `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: 'local',
      createdAt: new Date(),
      updatedAt: new Date(),
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
    const newNotes = notes.filter((note) => note.id !== noteId)
    setNotes(newNotes)
    saveNotes(newNotes)

    toast({
      title: "Note deleted",
      description: "Note has been removed",
    })
  }
  
  const togglePin = async (noteId: string) => {
    const newNotes = notes.map((note) =>
      note.id === noteId ? { ...note, isPinned: !note.isPinned, updatedAt: new Date() } : note
    );
    setNotes(newNotes);
    saveNotes(newNotes);
  };

  return {
    notes,
    loading,
    error: null,
    addNote,
    updateNote,
    deleteNote,
    togglePin,
    isOnline: false,
  }
}
