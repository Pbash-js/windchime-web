"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"

export interface PomodoroSettings {
  workDuration: number // in minutes
  shortBreakDuration: number
  longBreakDuration: number
  sessionsUntilLongBreak: number
  autoStartBreaks: boolean
  autoStartPomodoros: boolean
  soundEnabled: boolean
  volume: number
}

export interface UserPreferences {
  theme: "light" | "dark" | "system"
  pomodoroSettings: PomodoroSettings
  backgroundScene: string
  musicGenre: string
  notifications: {
    desktop: boolean
    sound: boolean
    email: boolean
  }
  privacy: {
    analytics: boolean
    crashReports: boolean
  }
  windowStyles?: {
    headerAutoHide: boolean
    headerHideDelay: number
    windowBgOpacity: number
    windowBgColor: string
    windowBorderRadius: number
    windowShadow: string
  }
}

const defaultPreferences: UserPreferences = {
  theme: "dark",
  pomodoroSettings: {
    workDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    sessionsUntilLongBreak: 4,
    autoStartBreaks: false,
    autoStartPomodoros: false,
    soundEnabled: true,
    volume: 70,
  },
  backgroundScene: "bedroom",
  musicGenre: "lofi",
  notifications: {
    desktop: true,
    sound: true,
    email: false,
  },
  privacy: {
    analytics: true,
    crashReports: true,
  },
  windowStyles: {
    headerAutoHide: false,
    headerHideDelay: 2000,
    windowBgOpacity: 0.85,
    windowBgColor: '24,24,28',
    windowBorderRadius: 8,
    windowShadow: '0 8px 30px rgba(0, 0, 0, 0.3)'
  }
}

export function useLocalPreferences() {
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    if (!user) {
      setPreferences(defaultPreferences)
      setLoading(false)
      return
    }

    loadPreferences()
  }, [user])

  const loadPreferences = () => {
    if (!user) return

    try {
      const userPrefsKey = `user-preferences-${user.uid}`
      const stored = localStorage.getItem(userPrefsKey)

      if (stored) {
        const userData = JSON.parse(stored)
        const userPrefs = userData.preferences || {}

        setPreferences({
          ...defaultPreferences,
          ...userPrefs,
          pomodoroSettings: {
            ...defaultPreferences.pomodoroSettings,
            ...userPrefs.pomodoroSettings,
          },
          notifications: {
            ...defaultPreferences.notifications,
            ...userPrefs.notifications,
          },
          privacy: {
            ...defaultPreferences.privacy,
            ...userPrefs.privacy,
          },
        })
      }
    } catch (error) {
      console.error("Error loading preferences:", error)
    } finally {
      setLoading(false)
    }
  }

  const updatePreferences = async (updates: Partial<UserPreferences>) => {
    if (!user) return

    try {
      const newPreferences = { ...preferences, ...updates }
      setPreferences(newPreferences)

      const userPrefsKey = `user-preferences-${user.uid}`
      const stored = localStorage.getItem(userPrefsKey)
      const userData = stored
        ? JSON.parse(stored)
        : {
            displayName: user.displayName,
            email: user.email,
            photoURL: user.photoURL,
            createdAt: new Date().toISOString(),
            lastLoginAt: new Date().toISOString(),
          }

      userData.preferences = newPreferences
      userData.lastUpdated = new Date().toISOString()
      localStorage.setItem(userPrefsKey, JSON.stringify(userData))

      toast({
        title: "Settings saved",
        description: "Your preferences have been updated",
      })
    } catch (error) {
      console.error("Error updating preferences:", error)
      toast({
        title: "Failed to save settings",
        description: "Please try again",
        variant: "destructive",
      })
    }
  }

  const updatePomodoroSettings = async (settings: Partial<PomodoroSettings>) => {
    const newPomodoroSettings = { ...preferences.pomodoroSettings, ...settings }
    await updatePreferences({ pomodoroSettings: newPomodoroSettings })
  }

  const resetToDefaults = async () => {
    await updatePreferences(defaultPreferences)
    toast({
      title: "Settings reset",
      description: "All preferences have been reset to defaults",
    })
  }

  return {
    preferences,
    loading,
    updatePreferences,
    updatePomodoroSettings,
    resetToDefaults,
  }
}
