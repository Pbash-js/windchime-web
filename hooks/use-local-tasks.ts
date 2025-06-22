"use client"

import { useState, useEffect, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"

export interface Task {
  id: string
  title: string
  completed: boolean
  createdAt: Date
  dueDate: Date
  userId: string
  updatedAt: Date
}

const TASKS_STORAGE_KEY = "windchime-local-tasks"

export function useLocalTasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const loadTasks = useCallback(() => {
    setLoading(true)
    try {
      const stored = localStorage.getItem(TASKS_STORAGE_KEY)
      if (stored) {
        const parsedTasks = JSON.parse(stored).map((task: any) => ({
          ...task,
          createdAt: new Date(task.createdAt),
          dueDate: new Date(task.dueDate),
          updatedAt: new Date(task.updatedAt),
        }))
        setTasks(parsedTasks.sort((a: Task, b: Task) => b.createdAt.getTime() - a.createdAt.getTime()))
      } else {
        setTasks([])
      }
    } catch (error) {
      console.error("Error loading tasks from local storage:", error)
      setTasks([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTasks()
  }, [loadTasks])

  const saveTasks = (newTasks: Task[]) => {
    try {
      localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(newTasks))
    } catch (error) {
      console.error("Error saving tasks to local storage:", error)
      toast({
        title: "Error",
        description: "Could not save tasks.",
        variant: "destructive",
      })
    }
  }

  const addTask = async (taskData: Omit<Task, "id" | "userId" | "updatedAt" | "createdAt" | "completed"> & {dueDate: Date, title: string}) => {
    const newTask: Task = {
      ...taskData,
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: 'local',
      completed: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const newTasks = [newTask, ...tasks]
    setTasks(newTasks)
    saveTasks(newTasks)

    toast({
      title: "Task added",
      description: "Your task has been saved locally",
    })
  }

  const updateTask = async (taskId: string, updates: Partial<Omit<Task, "id" | "userId">>) => {
    const newTasks = tasks.map((task) =>
      task.id === taskId
        ? {
            ...task,
            ...updates,
            updatedAt: new Date(),
          }
        : task,
    )

    setTasks(newTasks)
    saveTasks(newTasks)

    if (updates.completed !== undefined) {
      toast({
        title: updates.completed ? "Task completed! 🎉" : "Task reopened",
        description: updates.completed ? "Great job staying productive!" : "Task marked as incomplete",
      })
    }
  }

  const deleteTask = async (taskId: string) => {
    const newTasks = tasks.filter((task) => task.id !== taskId)
    setTasks(newTasks)
    saveTasks(newTasks)

    toast({
      title: "Task deleted",
      description: "Task has been removed",
    })
  }

  return {
    tasks,
    loading,
    error: null,
    addTask,
    updateTask,
    deleteTask,
    isOnline: false,
  }
}
