"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Plus, FileText, Trash2, Loader2, Cloud, CloudOff, Pin, PinOff } from "lucide-react"
import { useNotes } from "@/hooks/use-notes"
import { useAuth } from "@/contexts/auth-context"

export function NotesPanel() {
  const { user } = useAuth()
  const { notes, loading, error, addNote, updateNote, deleteNote, togglePin, isOnline } = useNotes()
  const [isCreating, setIsCreating] = useState(false)
  const [newNoteTitle, setNewNoteTitle] = useState("")
  const [newNoteContent, setNewNoteContent] = useState("")
  const [sortBy, setSortBy] = useState("lastEdited")
  const [editingNote, setEditingNote] = useState<string | null>(null)

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

  const handleUpdateNote = async (id: string, title: string, content: string) => {
    await updateNote(id, { title, content, updatedAt: new Date() })
    setEditingNote(null)
  }

  const handleDeleteNote = async (id: string) => {
    await deleteNote(id)
  }

  const handleTogglePin = async (id: string, isPinned: boolean) => {
    await togglePin(id, isPinned)
  }

  const sortedNotes = [...notes].sort((a, b) => {
    // Pinned notes always come first
    if (a.isPinned && !b.isPinned) return -1
    if (!a.isPinned && b.isPinned) return 1

    if (sortBy === "lastEdited") {
      return b.updatedAt.getTime() - a.updatedAt.getTime()
    } else {
      return b.createdAt.getTime() - a.createdAt.getTime()
    }
  })

  if (!user) {
    return (
      <div className="p-4 h-full flex flex-col items-center justify-center text-center">
        <Cloud className="h-12 w-12 text-gray-500 mb-4" />
        <div className="text-gray-400 mb-2">Sign in to sync your notes</div>
        <div className="text-xs text-gray-500">Your notes will be saved to the cloud</div>
      </div>
    )
  }

  return (
    <div className="p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          <div className="text-sm font-medium">Notes</div>
          <div className="flex items-center gap-1">
            {loading ? (
              <Loader2 className="h-3 w-3 animate-spin text-blue-400" />
            ) : isOnline ? (
              <Cloud className="h-3 w-3 text-green-400" />
            ) : (
              <CloudOff className="h-3 w-3 text-orange-400" />
            )}
            <span className="text-xs text-gray-400">{notes.length}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">new</span>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0"
            onClick={() => setIsCreating(true)}
            disabled={loading}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-2 bg-orange-500/10 border border-orange-500/20 rounded-lg">
          <div className="text-xs text-orange-400">{error}</div>
        </div>
      )}

      {/* Create Note Form */}
      {isCreating && (
        <div className="space-y-3 p-3 rounded-lg bg-gray-800/50 mb-4 animate-in slide-in-from-top-2 duration-300">
          <Input
            value={newNoteTitle}
            onChange={(e) => setNewNoteTitle(e.target.value)}
            placeholder="Note title..."
            className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
          />
          <Textarea
            value={newNoteContent}
            onChange={(e) => setNewNoteContent(e.target.value)}
            placeholder="Write your note..."
            className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 min-h-[100px]"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleCreateNote} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setIsCreating(false)
                setNewNoteTitle("")
                setNewNoteContent("")
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Notes List */}
      {notes.length === 0 && !isCreating ? (
        <div className="text-center py-12 flex-1">
          {loading ? (
            <div className="flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
              <span className="ml-2 text-gray-400">Loading notes...</span>
            </div>
          ) : (
            <>
              <div className="text-gray-400 text-lg mb-2">No notes yet!</div>
              <Button variant="ghost" className="text-gray-400 hover:text-white" onClick={() => setIsCreating(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create your first note
              </Button>
            </>
          )}
        </div>
      ) : (
        <>
          {/* Sort Options */}
          <div className="space-y-2 mb-4">
            <div className="text-sm text-gray-400">Sort by:</div>
            <RadioGroup value={sortBy} onValueChange={setSortBy}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="lastEdited" id="lastEdited" />
                <Label htmlFor="lastEdited" className="text-sm text-white">
                  Last edited
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="lastCreated" id="lastCreated" />
                <Label htmlFor="lastCreated" className="text-sm text-gray-400">
                  Last created
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Notes */}
          <div className="space-y-2 overflow-y-auto flex-1">
            {sortedNotes.map((note, index) => (
              <NoteItem
                key={note.id}
                note={note}
                index={index}
                isEditing={editingNote === note.id}
                onEdit={() => setEditingNote(note.id)}
                onSave={(title, content) => handleUpdateNote(note.id, title, content)}
                onCancel={() => setEditingNote(null)}
                onDelete={() => handleDeleteNote(note.id)}
                onTogglePin={() => handleTogglePin(note.id, note.isPinned || false)}
                loading={loading}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function NoteItem({
  note,
  index,
  isEditing,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  onTogglePin,
  loading,
}: {
  note: any
  index: number
  isEditing: boolean
  onEdit: () => void
  onSave: (title: string, content: string) => void
  onCancel: () => void
  onDelete: () => void
  onTogglePin: () => void
  loading: boolean
}) {
  const [editTitle, setEditTitle] = useState(note.title)
  const [editContent, setEditContent] = useState(note.content)

  if (isEditing) {
    return (
      <div className="space-y-2 p-3 rounded-lg bg-gray-800/50 animate-in slide-in-from-top-2 duration-300">
        <Input
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          className="bg-gray-700 border-gray-600 text-white"
        />
        <Textarea
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          className="bg-gray-700 border-gray-600 text-white min-h-[80px]"
        />
        <div className="flex gap-2">
          <Button size="sm" onClick={() => onSave(editTitle, editContent)} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Save
          </Button>
          <Button size="sm" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`p-3 rounded-lg transition-all duration-300 ease-in-out hover:bg-gray-800/50 group cursor-pointer animate-in slide-in-from-left-2 ${
        note.isPinned ? "bg-yellow-500/5 border border-yellow-500/20" : "bg-gray-800/30"
      }`}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0" onClick={onEdit}>
          <div className="flex items-center gap-2 mb-1">
            {note.isPinned && <Pin className="h-3 w-3 text-yellow-400" />}
            <div className="text-sm font-medium text-white truncate">{note.title}</div>
          </div>
          <div className="text-xs text-gray-400 mt-1 line-clamp-2">{note.content || "No content"}</div>
          <div className="text-xs text-gray-500 mt-2">
            {note.updatedAt.toLocaleDateString()} •{" "}
            {note.updatedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 hover:bg-yellow-500/10 hover:text-yellow-400"
            onClick={(e) => {
              e.stopPropagation()
              onTogglePin()
            }}
            disabled={loading}
          >
            {note.isPinned ? <PinOff className="h-3 w-3" /> : <Pin className="h-3 w-3" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 hover:bg-red-500/10 hover:text-red-400"
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            disabled={loading}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  )
}
