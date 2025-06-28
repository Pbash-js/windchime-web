"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Trash2, Loader2, Cloud, CloudOff, Pin, PinOff, Grid, List, ArrowUpDown, ArrowLeft } from "lucide-react"
import { useNotes } from "@/hooks/use-notes"
import { useAuth } from "@/contexts/auth-context"
import { useViewMode } from "@/hooks/use-view-mode"
import { GalleryView } from "@/components/gallery-view"

type Note = {
  id: string
  title: string
  content: string
  isPinned: boolean
  createdAt: Date
  updatedAt: Date
}

export function NotesPanel() {
  const { user } = useAuth()
  const { notes: rawNotes, loading, error, addNote, updateNote, deleteNote, togglePin, isOnline } = useNotes()
  const [isCreating, setIsCreating] = useState(false)
  const [newNoteTitle, setNewNoteTitle] = useState("")
  const [newNoteContent, setNewNoteContent] = useState("")
  const [sortBy, setSortBy] = useState("lastEdited")
  
  // State for editing a note
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [editingTitle, setEditingTitle] = useState("")
  const [editingContent, setEditingContent] = useState("")

  // State for exit animations
  const [deletingNotes, setDeletingNotes] = useState<Set<string>>(new Set())

  const { viewMode, toggleViewMode, isFullScreen: showGalleryToggle } = useViewMode()

  // Auto switch to list view if not fullscreen
  useEffect(() => {
    if (!showGalleryToggle && viewMode === 'gallery') {
      toggleViewMode()
    }
  }, [showGalleryToggle, viewMode, toggleViewMode])
  
  // Populate editor state when a note is selected
  useEffect(() => {
    if (editingNote) {
      setEditingTitle(editingNote.title)
      setEditingContent(editingNote.content)
    }
  }, [editingNote])

  const handleCreateNote = async () => {
    if (newNoteTitle.trim()) {
      await addNote({
        title: newNoteTitle.trim(),
        content: newNoteContent.trim(),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      setNewNoteTitle("")
      setNewNoteContent("")
      setIsCreating(false)
    }
  }

  const handleSaveNote = async () => {
    if (editingNote) {
      await updateNote(editingNote.id, { title: editingTitle.trim(), content: editingContent.trim() })
      setEditingNote(null)
    }
  }

  const handleDeleteNote = (id: string) => {
    setDeletingNotes(prev => new Set(prev).add(id))
    setTimeout(() => {
      deleteNote(id).then(() => {
        setDeletingNotes(prev => {
          const newSet = new Set(prev)
          newSet.delete(id)
          return newSet
        })
      })
    }, 300) // Animation duration
  }

  const handleTogglePin = async (e: React.MouseEvent, id: string, isPinned: boolean) => {
    e.stopPropagation() // Prevent opening the editor
    await togglePin(id, isPinned)
  }
  
  const cycleSortBy = () => setSortBy(prev => (prev === 'lastEdited' ? 'createdAt' : 'lastEdited'))
  const getSortLabel = () => (sortBy === 'lastEdited' ? 'Last Edited' : 'Date Created')

  // 3. Verified Sorting
  const sortedNotes = useMemo(() => {
    return [...rawNotes].sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1
      if (sortBy === "lastEdited") return b.updatedAt.getTime() - a.updatedAt.getTime()
      return b.createdAt.getTime() - a.createdAt.getTime()
    })
  }, [rawNotes, sortBy])

  if (!user) {
    return (
      <div className="p-4 h-full flex flex-col items-center justify-center text-center">
        <Cloud className="h-12 w-12 text-gray-500 mb-4" />
        <div className="text-gray-400 mb-2">Sign in to sync your notes</div>
        <div className="text-xs text-gray-500">Your notes will be saved to the cloud</div>
      </div>
    )
  }

  const renderNoteItem = (note: Note, isGalleryView: boolean) => {
    const isDeleting = deletingNotes.has(note.id)
    const baseClasses = `group relative cursor-pointer p-4 rounded-lg transition-all duration-300 ease-in-out
      border hover:border-gray-600/70
      ${note.isPinned ? 'bg-yellow-900/20 border-yellow-500/20' : 'bg-gray-800/60 border-gray-700/50 hover:bg-gray-750/80'}
      ${isDeleting ? 'animate-out fade-out-0 slide-out-to-left-8' : 'animate-in fade-in-0'}`

    return (
      <div className={baseClasses} onClick={() => setEditingNote(note)}>
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              {note.isPinned && <Pin className="h-3.5 w-3.5 text-yellow-400 flex-shrink-0" />}
              <h3 className="text-sm font-medium text-white truncate">{note.title || 'Untitled Note'}</h3>
            </div>
            <p className={`text-xs text-gray-300 whitespace-pre-wrap break-words ${isGalleryView ? 'line-clamp-6' : 'line-clamp-2'}`}>{note.content || "No content"}</p>
          </div>
          <div className="flex flex-shrink-0 items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-yellow-500/10 hover:text-yellow-400" onClick={(e) => handleTogglePin(e, note.id, !note.isPinned)} disabled={loading}>
              {note.isPinned ? <PinOff className="h-3 w-3" /> : <Pin className="h-3 w-3" />}
            </Button>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-red-500/10 hover:text-red-400" onClick={(e) => { e.stopPropagation(); handleDeleteNote(note.id) }} disabled={loading}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
        <div className="mt-3 pt-2 text-xs text-gray-500 border-t border-gray-700/50">
          Edited: {new Date(note.updatedAt).toLocaleDateString()}
        </div>
      </div>
    )
  }

  const renderHeader = () => (
    <div className="p-4 border-b border-gray-700/50 flex-shrink-0">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-white">Notes</h1>
          <Button variant="ghost" size="sm" className="h-7 px-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded flex items-center gap-1.5" onClick={cycleSortBy} title={`Sort by ${getSortLabel()}`}>
            <ArrowUpDown className="h-3.5 w-3.5" />
            <span className="text-xs font-medium">{getSortLabel()}</span>
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-gray-300 hover:text-white hover:bg-gray-700/50" onClick={() => setIsCreating(true)} disabled={loading}>
            <Plus className="h-4 w-4" />
          </Button>
          {isOnline ? <Cloud className="h-4 w-4 text-emerald-400" title="Online" /> : <CloudOff className="h-4 w-4 text-red-400" title="Offline" />}
          {showGalleryToggle && (
            <Button variant="ghost" size="sm" className='h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded' onClick={toggleViewMode} title={viewMode === 'list' ? 'Gallery View' : 'List View'}>
              {viewMode === 'list' ? <Grid className="h-4 w-4" /> : <List className="h-4 w-4" />}
            </Button>
          )}
        </div>
      </div>
      {error && <div className="mb-4 p-2 bg-red-500/10 border border-red-500/20 rounded-lg"><p className="text-xs text-red-400">Error: {error}</p></div>}
      {isCreating && (
        <div className="mb-4 p-4 border border-dashed border-gray-700 rounded-lg bg-gray-800/20 space-y-3 animate-in fade-in-0">
          <Input placeholder="Title" value={newNoteTitle} onChange={(e) => setNewNoteTitle(e.target.value)} className="bg-gray-800 border-gray-600" autoFocus />
          <Textarea placeholder="Start writing your note..." value={newNoteContent} onChange={(e) => setNewNoteContent(e.target.value)} className="bg-gray-800 border-gray-600" rows={4} />
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsCreating(false)}>Cancel</Button>
            <Button size="sm" onClick={handleCreateNote} disabled={!newNoteTitle.trim() || loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Note'}</Button>
          </div>
        </div>
      )}
    </div>
  )

  const renderContent = () => {
    // 6. Gallery scroll fix
    if (viewMode === 'gallery' && showGalleryToggle) {
      return (
        <div className="flex-1 min-h-0 overflow-y-auto p-4">
          <GalleryView
            items={sortedNotes}
            renderItem={(note) => (
              <div key={note.id} className="break-inside-avoid" style={{ animationDelay: `${(sortedNotes.indexOf(note) % 20) * 30}ms` }}>
                {renderNoteItem(note as Note, true)}
              </div>
            )}
            emptyState={
              <div className="h-full flex flex-col items-center justify-center p-8 text-center"><div className="text-gray-400 text-lg mb-4">No notes yet!</div><Button variant="outline" className="text-gray-300 border-gray-600 hover:bg-gray-700 hover:text-white" onClick={() => setIsCreating(true)}><Plus className="h-4 w-4 mr-2" />Create your first note</Button></div>
            }
          />
        </div>
      )
    }
    // List View
    return (
      <div className="flex-1 min-h-0 overflow-y-auto">
        {sortedNotes.length === 0 && !isCreating ? (
          <div className="text-center py-12"><div className="text-gray-400 text-sm mb-3">No notes yet!</div><Button variant="ghost" size="sm" className="text-gray-400 hover:text-white text-xs" onClick={() => setIsCreating(true)}><Plus className="h-3 w-3 mr-1.5" />Create your first note</Button></div>
        ) : (
          <div className="p-4 space-y-3">
            {sortedNotes.map((note, index) => (
              <div key={note.id} style={{ animationDelay: `${index * 30}ms` }}>{renderNoteItem(note as Note, false)}</div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // 1. Full-panel editor for list view
  const renderListEditor = () => (
    <div className="h-full flex flex-col bg-gray-900 animate-in fade-in-0 duration-300">
      <div className="flex items-center justify-between p-4 border-b border-gray-700/50 flex-shrink-0">
        <Button variant="ghost" size="sm" onClick={() => setEditingNote(null)} className="flex items-center gap-2 text-gray-300 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <Button onClick={handleSaveNote} disabled={!editingTitle.trim() || loading} className="bg-blue-600 hover:bg-blue-700 text-white">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
        </Button>
      </div>
      <div className="p-6 space-y-4 flex-1 flex flex-col min-h-0">
        <Input placeholder="Title" value={editingTitle} onChange={(e) => setEditingTitle(e.target.value)} className="bg-gray-800 border-gray-600 text-white text-lg font-semibold h-12 flex-shrink-0" autoFocus />
        <Textarea placeholder="Content" value={editingContent} onChange={(e) => setEditingContent(e.target.value)} className="bg-gray-800 border-gray-600 text-white flex-1 w-full resize-none" />
      </div>
    </div>
  )

  // Modal editor for gallery view
  const renderGalleryModalEditor = () => (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-in fade-in-0">
      <div className="bg-gray-800 p-6 rounded-lg w-full max-w-2xl h-[80vh] flex flex-col border border-gray-700 shadow-xl">
        <h3 className="text-lg font-medium text-white mb-4 flex-shrink-0">Edit Note</h3>
        <div className="space-y-4 flex-1 flex flex-col min-h-0">
          <Input placeholder="Title" value={editingTitle} onChange={(e) => setEditingTitle(e.target.value)} className="bg-gray-900 border-gray-600 text-white flex-shrink-0" />
          <Textarea placeholder="Content" value={editingContent} onChange={(e) => setEditingContent(e.target.value)} className="bg-gray-900 border-gray-600 text-white flex-1 w-full resize-none" />
        </div>
        <div className="flex justify-end gap-2 mt-6 flex-shrink-0">
          <Button variant="outline" onClick={() => setEditingNote(null)}>Cancel</Button>
          <Button onClick={handleSaveNote} disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}</Button>
        </div>
      </div>
    </div>
  )

  // Main render logic
  if (editingNote) {
    return viewMode === 'gallery' ? renderGalleryModalEditor() : renderListEditor()
  }

  return (
    <div className="h-full flex flex-col">
      {renderHeader()}
      {renderContent()}
    </div>
  )
}