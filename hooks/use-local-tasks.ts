"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
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

export function useLocalTasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    if (!user) {
      setTasks([])
      setLoading(false)
      return
    }

    loadTasks()
  }, [user])

  const loadTasks = () => {
    if (!user) return

    try {
      const tasksKey = `tasks-${user.uid}`
      const stored = localStorage.getItem(tasksKey)

      if (stored) {
        const parsedTasks = JSON.parse(stored).map((task: any) => ({
          ...task,
          createdAt: new Date(task.createdAt),
          dueDate: new Date(task.dueDate),
          updatedAt: new Date(task.updatedAt),
        }))
        setTasks(parsedTasks.sort((a: Task, b: Task) => b.createdAt.getTime() - a.createdAt.getTime()))
      }
    } catch (error) {
      console.error("Error loading tasks:", error)
    } finally {
      setLoading(false)
    }
  }

  const saveTasks = (newTasks: Task[]) => {
    if (!user) return

    try {
      const tasksKey = `tasks-${user.uid}`
      localStorage.setItem(tasksKey, JSON.stringify(newTasks))
    } catch (error) {
      console.error("Error saving tasks:", error)
    }
  }

  const addTask = async (taskData: Omit<Task, "id" | "userId" | "updatedAt">) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to add tasks",
        variant: "destructive",
      })
      return
    }

    const newTask: Task = {
      ...taskData,
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: user.uid,
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
    if (!user) return

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
    if (!user) return

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
    isOnline: true,
  }
}
