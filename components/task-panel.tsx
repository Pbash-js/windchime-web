"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Trash2, Check, Loader2, Cloud, CloudOff, Grid, List, ArrowUpDown, Calendar, Clock, ArrowLeft } from "lucide-react"
import { useTasks } from "@/hooks/use-tasks"
import { useAuth } from "@/contexts/auth-context"
import { useViewMode } from "@/hooks/use-view-mode"

type Task = {
  id: string
  title: string
  completed: boolean
  dueDate?: Date
  description?: string
}

export function TaskPanel() {
  const { user } = useAuth()
  const { tasks: rawTasks, loading, error, addTask, updateTask, deleteTask, isOnline } = useTasks()
  const [newTask, setNewTask] = useState("")
  const [newTaskDueDate, setNewTaskDueDate] = useState("")
  
  // State for the full-panel editor
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [editText, setEditText] = useState("")
  const [editDueDate, setEditDueDate] = useState("")

  const [isAddingTask, setIsAddingTask] = useState(false)
  const { viewMode, toggleViewMode, showGalleryToggle } = useViewMode()
  
  // State for exit animations
  const [deletingTasks, setDeletingTasks] = useState<Set<string>>(new Set())

  const [sortBy, setSortBy] = useState<'date' | 'title' | 'completed'>('date')

  // Automatically switch to list view if the panel is no longer "fullscreen"
  useEffect(() => {
    if (!showGalleryToggle && viewMode === 'gallery') {
      toggleViewMode()
    }
  }, [showGalleryToggle, viewMode, toggleViewMode])

  // Populate editor state when a task is selected
  useEffect(() => {
    if (editingTask) {
      setEditText(editingTask.title)
      setEditDueDate(editingTask.dueDate ? editingTask.dueDate.toISOString().slice(0, 16) : "")
    }
  }, [editingTask])

  // 3. Verified Sorting Implementation
  const tasks = useMemo(() => {
    return [...rawTasks].sort((a, b) => {
      // Completed tasks go to the bottom
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1
      }

      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title)
        case 'completed': // This case is handled by the initial check, but kept for clarity
          return a.completed ? 1 : -1
        case 'date':
        default:
          const dateA = a.dueDate?.getTime() ?? Infinity
          const dateB = b.dueDate?.getTime() ?? Infinity
          return dateA - dateB
      }
    })
  }, [rawTasks, sortBy])

  const handleAddTask = async () => {
    if (newTask.trim()) {
      const dueDate = newTaskDueDate ? new Date(newTaskDueDate) : undefined
      await addTask({
        title: newTask.trim(),
        dueDate: dueDate || new Date(),
      })
      setNewTask("")
      setNewTaskDueDate("")
      setIsAddingTask(false)
    }
  }

  // 5. Smoother task completion (removed pulse animation and delay)
  const toggleTask = async (id: string) => {
    const task = tasks.find((t) => t.id === id)
    if (task) {
      await updateTask(id, { completed: !task.completed })
    }
  }

  // 7. Deletion with micro-interaction animation
  const handleDeleteTask = (id: string) => {
    setDeletingTasks(prev => new Set(prev).add(id))
    setTimeout(() => {
      deleteTask(id).then(() => {
        setDeletingTasks(prev => {
          const newSet = new Set(prev)
          newSet.delete(id)
          return newSet
        })
      })
    }, 300) // Corresponds to animation duration
  }
  
  const handleEditTask = (task: Task) => {
    setEditingTask(task)
  }

  const handleSaveEdit = async () => {
    if (editingTask && editText.trim()) {
      const updates: Partial<Task> = { title: editText.trim() }
      if (editDueDate) {
        updates.dueDate = new Date(editDueDate)
      } else {
        updates.dueDate = undefined
      }
      await updateTask(editingTask.id, updates)
      setEditingTask(null)
    }
  }

  const cycleSortBy = () => {
    setSortBy(prev => {
      if (prev === 'date') return 'title'
      if (prev === 'title') return 'completed'
      return 'date'
    })
  }

  const getSortLabel = () => {
    if (sortBy === 'date') return 'Due Date'
    if (sortBy === 'title') return 'Title'
    return 'Status'
  }

  if (!user) {
    return (
      <div className="p-4 h-full flex flex-col items-center justify-center text-center">
        <Cloud className="h-12 w-12 text-gray-500 mb-4" />
        <div className="text-gray-400 mb-2">Sign in to sync your tasks</div>
        <div className="text-xs text-gray-500">Your tasks will be saved to the cloud</div>
      </div>
    )
  }

  const renderTaskItem = (task: Task, isGalleryView: boolean) => {
    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !task.completed
    const isDeleting = deletingTasks.has(task.id)

    // Common classes for animation and base styles
    const baseClasses = `group relative overflow-hidden transition-all duration-300 ease-out
      ${isGalleryView ? 'flex flex-col rounded-lg' : 'flex items-center gap-3 p-4 rounded-lg'}
      bg-gray-800/60 hover:bg-gray-750/80 
      border border-gray-700/50 hover:border-gray-600/70
      ${task.completed ? 'opacity-50' : ''}
      ${isDeleting ? 'animate-out fade-out-0 slide-out-to-left-8' : 'animate-in fade-in-0'}`

    if (isGalleryView) {
      return (
        <div className={baseClasses} onClick={() => handleEditTask(task)}>
          <div className="p-4 flex-1 flex flex-col">
            <div className="flex items-start justify-between mb-3">
              <h3 className={`font-semibold text-sm leading-tight flex-1 ${task.completed ? 'line-through text-gray-400' : 'text-white'}`}>{task.title}</h3>
              <button
                onClick={(e) => { e.stopPropagation(); toggleTask(task.id) }}
                disabled={loading}
                className={`ml-2 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all duration-200 hover:scale-110 disabled:opacity-50 ${task.completed ? 'bg-emerald-500 border-emerald-500' : 'border-gray-400 hover:border-blue-400'}`}
              >
                {task.completed && <Check className="h-3 w-3 text-white" />}
              </button>
            </div>
            {task.dueDate && (
              <div className={`text-xs mb-2 flex items-center gap-1 ${isOverdue ? 'text-red-400 font-medium' : 'text-gray-500'}`}>
                <Calendar className="h-3 w-3" />
                <span>{task.dueDate.toLocaleDateString()}</span>
                <Clock className="h-3 w-3 ml-1" />
                <span>{task.dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            )}
            {task.description && <div className="text-xs text-gray-300 line-clamp-4 flex-1">{task.description}</div>}
          </div>
          <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-red-500/20 hover:text-red-400 rounded-full" onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id) }} disabled={loading}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )
    } else {
      return (
        <div className={baseClasses} onClick={() => handleEditTask(task)}>
          <button
            onClick={(e) => { e.stopPropagation(); toggleTask(task.id) }}
            disabled={loading}
            className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all duration-200 hover:scale-110 disabled:opacity-50 ${task.completed ? 'bg-emerald-500 border-emerald-500' : 'border-gray-400 hover:border-blue-400'}`}
          >
            {task.completed && <Check className="h-3 w-3 text-white" />}
          </button>
          <div className="flex-1 min-w-0">
            <div className={`font-semibold text-sm leading-tight ${task.completed ? 'line-through text-gray-400' : 'text-white'}`}>{task.title}</div>
            {task.dueDate && (
              <div className={`text-xs mt-0.5 font-medium flex items-center gap-1 ${isOverdue ? 'text-red-400' : 'text-gray-500'}`}>
                <Calendar className="h-3 w-3" />
                Due:
                <span> {task.dueDate.toLocaleDateString()} {task.dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            )}
          </div>
          <Button variant="ghost" size="sm" className="opacity-0 absolute right-2 group-hover:opacity-100 transition-opacity duration-200 h-6 w-6 p-0 hover:bg-red-500/20 hover:text-red-400 rounded" onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id) }} disabled={loading}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      )
    }
  }

  const renderHeader = () => (
    <div className="flex items-center justify-between p-4 border-b border-gray-700/50 bg-gray-900/50 flex-shrink-0">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-bold text-white">Tasks</h1>
        <Button variant="ghost" size="sm" className="h-7 px-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded flex items-center gap-1.5" onClick={cycleSortBy} title={`Sort by ${getSortLabel()}`}>
          <ArrowUpDown className="h-3.5 w-3.5" />
          <span className="text-xs font-medium">{getSortLabel()}</span>
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-300 hover:text-white hover:bg-gray-700/50 rounded" onClick={() => setIsAddingTask(true)}>
          <Plus className="h-4 w-4" />
        </Button>
        {isOnline ? <Cloud className="h-4 w-4 text-emerald-400" /> : <CloudOff className="h-4 w-4 text-red-400" />}
        {/* 4. Conditional view toggle */}
        {showGalleryToggle && (
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded" onClick={toggleViewMode} title={viewMode === 'list' ? 'Gallery View' : 'List View'}>
            {viewMode === 'list' ? <Grid className="h-4 w-4" /> : <List className="h-4 w-4" />}
          </Button>
        )}
      </div>
    </div>
  )

  const renderAddTaskInput = () => {
    if (!isAddingTask) return null
    return (
      <div className="p-4 border-b border-gray-700/50 bg-gray-900/30 animate-in fade-in-0 duration-300">
        <div className="space-y-3">
          <Input value={newTask} onChange={(e) => setNewTask(e.target.value)} placeholder="What needs to be done?" className="bg-gray-800 border-gray-600 text-white placeholder-gray-400" onKeyDown={(e) => e.key === 'Enter' && handleAddTask()} autoFocus />
          <div className="flex gap-2 items-center">
            <div className="flex items-center gap-2 flex-1">
              <Input type="datetime-local" value={newTaskDueDate} onChange={(e) => setNewTaskDueDate(e.target.value)} className="bg-gray-800 border-gray-600 text-white text-sm" />
            </div>

          </div>
          <div className="flex flex-1 bg-gray-900 gap-2 items-center justify-center">
            <Button onClick={handleAddTask} disabled={!newTask.trim() || loading} className="flex flex-1 px-4 bg-blue-600 hover:bg-blue-700 text-white">Add</Button>
            <Button variant="outline" onClick={() => setIsAddingTask(false)} className="flex flex-1 px-4">Cancel</Button>
          </div>
        </div>
      </div>
    )
  }

  // 1. Full-Panel Editor Component
  const renderEditor = () => (
    <div className="h-full flex flex-col bg-gray-900 animate-in fade-in-0 duration-300">
      <div className="flex items-center justify-between p-4 border-b border-gray-700/50">
        <Button variant="ghost" size="sm" onClick={() => setEditingTask(null)} className="flex items-center gap-2 text-gray-300 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <h2 className="text-lg font-semibold text-white">Edit Task</h2>
        <Button onClick={handleSaveEdit} disabled={!editText.trim() || loading} className="bg-blue-600 hover:bg-blue-700 text-white">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
        </Button>
      </div>
      <div className="p-6 space-y-4 flex-1">
        <Input
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          placeholder="Task title"
          className="bg-gray-800 border-gray-600 text-white text-lg font-semibold h-12"
          autoFocus
        />
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-gray-400" />
          <Input
            type="datetime-local"
            value={editDueDate}
            onChange={(e) => setEditDueDate(e.target.value)}
            className="bg-gray-800 border-gray-600 text-white text-sm"
          />
        </div>
        {/* Placeholder for description textarea if needed in the future */}
        {/* <Textarea placeholder="Add a description..." className="bg-gray-800 border-gray-600 text-white min-h-[120px]" /> */}
      </div>
    </div>
  )

  const renderContent = () => {
    // 6. Gallery scroll fix (ensuring correct flex/overflow properties)
    if (viewMode === 'gallery' && showGalleryToggle) {
      return (
        <div className="h-full w-full flex flex-col">
          {renderHeader()}
          {renderAddTaskInput()}
          <div className="flex-1 min-h-0 p-4 overflow-y-auto">
            {loading && tasks.length === 0 ? (
              <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-blue-400" /></div>
            ) : tasks.length > 0 ? (
              <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
                {tasks.map((task, index) => (
                  <div key={task.id} className="break-inside-avoid" style={{ animationDelay: `${index * 30}ms` }}>
                    {renderTaskItem(task, true)}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12"><div className="text-gray-400 text-sm mb-3">All done!</div><Button variant="ghost" size="sm" className="text-gray-400 hover:text-white text-xs" onClick={() => setIsAddingTask(true)}><Plus className="h-3 w-3 mr-1.5" />Add a task</Button></div>
            )}
          </div>
        </div>
      )
    }

    // List view (default)
    return (
      <div className="h-full flex flex-col">
        {renderHeader()}
        {renderAddTaskInput()}
        <div className="flex-1 min-h-0 overflow-y-auto">
          {loading && tasks.length === 0 ? (
            <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-blue-400" /></div>
          ) : tasks.length > 0 ? (
            <div className="space-y-2 p-4">
              {tasks.map((task, index) => (
                <div key={task.id} style={{ animationDelay: `${index * 30}ms` }}>
                    {renderTaskItem(task, false)}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12"><div className="text-gray-400 text-sm mb-3">All done!</div><Button variant="ghost" size="sm" className="text-gray-400 hover:text-white text-xs" onClick={() => setIsAddingTask(true)}><Plus className="h-3 w-3 mr-1.5" />Add a task</Button></div>
          )}
        </div>
      </div>
    )
  }

  // Show editor if a task is being edited, otherwise show the main content
  return editingTask ? renderEditor() : renderContent()
}