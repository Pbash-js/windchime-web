"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Menu, Trash2, Check, Loader2, Cloud, CloudOff } from "lucide-react"
import { useTasks } from "@/hooks/use-tasks"
import { useAuth } from "@/contexts/auth-context"

export function TaskPanel() {
  const { user } = useAuth()
  const { tasks, loading, error, addTask, updateTask, deleteTask, isOnline } = useTasks()
  const [newTask, setNewTask] = useState("")
  const [isAddingTask, setIsAddingTask] = useState(false)
  const [completingTasks, setCompletingTasks] = useState<Set<string>>(new Set())

  const handleAddTask = async () => {
    if (newTask.trim()) {
      await addTask({
        title: newTask.trim(),
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      })
      setNewTask("")
      setIsAddingTask(false)
    }
  }

  const toggleTask = async (id: string) => {
    const task = tasks.find((t) => t.id === id)
    if (task) {
      if (!task.completed) {
        setCompletingTasks((prev) => new Set(prev).add(id))
        setTimeout(async () => {
          await updateTask(id, { completed: !task.completed })
          setCompletingTasks((prev) => {
            const newSet = new Set(prev)
            newSet.delete(id)
            return newSet
          })
        }, 300)
      } else {
        await updateTask(id, { completed: !task.completed })
      }
    }
  }

  const handleDeleteTask = async (id: string) => {
    await deleteTask(id)
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

  return (
    <div className="p-4 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4 group">
        <Menu className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
        <div className="text-sm font-medium">Tasks</div>
        <div className="flex items-center gap-1 ml-auto">
          {loading ? (
            <Loader2 className="h-3 w-3 animate-spin text-blue-400" />
          ) : isOnline ? (
            <Cloud className="h-3 w-3 text-green-400" />
          ) : (
            <CloudOff className="h-3 w-3 text-orange-400" />
          )}
          <span className="text-xs text-gray-400">{tasks.length}</span>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-2 bg-orange-500/10 border border-orange-500/20 rounded-lg">
          <div className="text-xs text-orange-400">{error}</div>
        </div>
      )}

      {/* Add Task Input */}
      <div className="transition-all duration-300 ease-in-out mb-4">
        {isAddingTask ? (
          <div className="flex gap-2 animate-in slide-in-from-top-2 duration-300">
            <Input
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="Add task..."
              className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-400 transition-all duration-200 focus:bg-gray-800/70 focus:border-blue-500/50"
              onKeyPress={(e) => e.key === "Enter" && handleAddTask()}
              autoFocus
            />
            <Button
              size="sm"
              onClick={handleAddTask}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 transition-all duration-200 hover:scale-105"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            className="w-full justify-start text-gray-400 hover:text-white hover:bg-gray-800/50 transition-all duration-200 hover:scale-[1.02] group"
            onClick={() => setIsAddingTask(true)}
            disabled={loading}
          >
            <Plus className="h-4 w-4 mr-2 transition-transform duration-200 group-hover:rotate-90" />
            Add task
          </Button>
        )}
      </div>

      {/* Task List */}
      <div className="space-y-2 overflow-y-auto flex-1">
        {loading && tasks.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
            <span className="ml-2 text-gray-400">Loading tasks...</span>
          </div>
        ) : (
          tasks.map((task, index) => (
            <div
              key={task.id}
              className={`flex items-start gap-3 p-3 rounded-lg transition-all duration-300 ease-in-out hover:bg-gray-800/50 group animate-in slide-in-from-left-2 ${
                completingTasks.has(task.id) ? "animate-pulse" : ""
              }`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <button
                onClick={() => toggleTask(task.id)}
                disabled={loading}
                className={`w-5 h-5 rounded-full border-2 mt-0.5 flex-shrink-0 flex items-center justify-center transition-all duration-300 ease-in-out hover:scale-110 disabled:opacity-50 ${
                  task.completed
                    ? "bg-green-500 border-green-500 shadow-lg shadow-green-500/25"
                    : "border-gray-500 hover:border-blue-400 hover:shadow-lg hover:shadow-blue-400/25"
                }`}
              >
                {task.completed && <Check className="h-3 w-3 text-white animate-in zoom-in-50 duration-200" />}
              </button>

              <div className="flex-1 min-w-0">
                <div
                  className={`text-sm transition-all duration-300 ease-in-out ${
                    task.completed ? "line-through text-gray-500 opacity-75" : "text-white"
                  }`}
                >
                  {task.title}
                </div>
                <div className="text-xs text-gray-400 mt-1 transition-opacity duration-200 group-hover:opacity-100 opacity-75">
                  {task.dueDate.toLocaleDateString()} •{" "}
                  {task.dueDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="opacity-0 group-hover:opacity-100 transition-all duration-200 ease-in-out h-6 w-6 p-0 hover:bg-red-500/10 hover:text-red-400 hover:scale-110"
                onClick={() => handleDeleteTask(task.id)}
                disabled={loading}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))
        )}
      </div>

      {tasks.length === 0 && !isAddingTask && !loading && (
        <div className="text-center py-8 text-gray-500 animate-in fade-in-50 duration-500">
          <div className="text-sm mb-2">No tasks yet!</div>
          <div className="text-xs">Add your first task to get started</div>
        </div>
      )}
    </div>
  )
}
