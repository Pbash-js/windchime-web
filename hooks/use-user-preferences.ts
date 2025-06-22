"use client"

import { useState, useEffect } from "react"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { useNetworkStatus } from "@/hooks/use-network-status"

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

export function useUserPreferences() {
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const { toast } = useToast()
  const { isOnline } = useNetworkStatus()

  useEffect(() => {
    if (!user) {
      setPreferences(defaultPreferences)
      setLoading(false)
      return
    }

    loadPreferences()
  }, [user])

  const loadPreferences = async () => {
    if (!user) return

    try {
      const userRef = doc(db, "users", user.uid)
      const userSnap = await getDoc(userRef)

      if (userSnap.exists()) {
        const userData = userSnap.data()
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
    } catch (error: any) {
      console.error("Error loading preferences:", error)

      if (error.code === "unavailable") {
        console.log("Using default preferences while offline")
      } else {
        toast({
          title: "Failed to load preferences",
          description: "Using default settings",
          variant: "destructive",
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const updatePreferences = async (updates: Partial<UserPreferences>) => {
    if (!user) return

    try {
      const newPreferences = { ...preferences, ...updates }
      setPreferences(newPreferences)

      const userRef = doc(db, "users", user.uid)
      await updateDoc(userRef, {
        preferences: newPreferences,
      })

      toast({
        title: "Settings saved",
        description: isOnline ? "Your preferences have been updated" : "Saved locally - will sync when online",
      })
    } catch (error: any) {
      console.error("Error updating preferences:", error)

      if (error.code === "unavailable") {
        toast({
          title: "Settings saved locally",
          description: "Will sync when you're back online",
        })
      } else {
        toast({
          title: "Failed to save settings",
          description: "Please try again",
          variant: "destructive",
        })
        // Revert local changes on error
        loadPreferences()
      }
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
