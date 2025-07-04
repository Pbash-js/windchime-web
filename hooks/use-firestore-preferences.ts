"use client"

import { useState, useEffect, useCallback } from "react"
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore"
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
    windowBgBlur: number
    backgroundBlur: number
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
    windowBgBlur: 5,
    backgroundBlur: 0,
    windowBgColor: '24,24,28',
    windowBorderRadius: 8,
    windowShadow: '0 8px 30px rgba(0, 0, 0, 0.3)'
  }
}

export function useFirestorePreferences() {
  const { user } = useAuth()
  const { toast } = useToast()
  const { isOnline } = useNetworkStatus()
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  type PreferenceListener = (prefs: UserPreferences) => void
  const [listeners, setListeners] = useState<PreferenceListener[]>([])

  const subscribe = useCallback((callback: PreferenceListener) => {
    setListeners(prevListeners => [...prevListeners, callback])
    return () => {
      setListeners(prevListeners => prevListeners.filter(listener => listener !== callback))
    }
  }, [])

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
      } else {
        // Create user document with default preferences
        await createUserDocument()
      }
    } catch (error: any) {
      console.error("Error loading preferences:", error)

      if (error.code === "unavailable") {
        console.log("Using default preferences while offline")
        // Try to load from localStorage as fallback
        loadFromLocalStorage()
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

  const loadFromLocalStorage = () => {
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
      console.error("Error loading from localStorage:", error)
    }
  }

  const createUserDocument = async () => {
    if (!user) return

    try {
      const userRef = doc(db, "users", user.uid)
      const userData = {
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        createdAt: new Date(),
        lastLoginAt: new Date(),
        preferences: defaultPreferences,
      }

      await setDoc(userRef, userData)
      console.log("User document created successfully")
    } catch (error) {
      console.error("Error creating user document:", error)
    }
  }

  const updatePreferences = useCallback(async (updates: Partial<UserPreferences>) => {
    if (!user) return
    
    try {
      const userRef = doc(db, "users", user.uid)
      await updateDoc(userRef, {
        preferences: updates,
        updatedAt: new Date().toISOString(),
      })
      
      // Update local state with proper type safety
      setPreferences(prev => {
        const updatedPrefs: UserPreferences = {
          ...prev,
          ...updates,
          pomodoroSettings: {
            ...prev.pomodoroSettings,
            ...(updates.pomodoroSettings || {})
          },
          notifications: {
            ...prev.notifications,
            ...(updates.notifications || {})
          },
          privacy: {
            ...prev.privacy,
            ...(updates.privacy || {})
          },
          windowStyles: {
            headerAutoHide: updates.windowStyles?.headerAutoHide ?? prev.windowStyles?.headerAutoHide ?? false,
            headerHideDelay: updates.windowStyles?.headerHideDelay ?? prev.windowStyles?.headerHideDelay ?? 2000,
            windowBgOpacity: updates.windowStyles?.windowBgOpacity ?? prev.windowStyles?.windowBgOpacity ?? 0.85,
            windowBgBlur: updates.windowStyles?.windowBgBlur ?? prev.windowStyles?.windowBgBlur ?? 5,
            backgroundBlur: updates.windowStyles?.backgroundBlur ?? prev.windowStyles?.backgroundBlur ?? 0,
            windowBgColor: updates.windowStyles?.windowBgColor ?? prev.windowStyles?.windowBgColor ?? '24,24,28',
            windowBorderRadius: updates.windowStyles?.windowBorderRadius ?? prev.windowStyles?.windowBorderRadius ?? 8,
            windowShadow: updates.windowStyles?.windowShadow ?? prev.windowStyles?.windowShadow ?? '0 8px 30px rgba(0, 0, 0, 0.3)'
          }
        }
        return updatedPrefs
      })
      
      // Notify listeners with the updated preferences
      setPreferences(prev => {
        const updatedPrefs = {
          ...prev,
          ...updates,
          pomodoroSettings: {
            ...prev.pomodoroSettings,
            ...(updates.pomodoroSettings || {})
          },
          notifications: {
            ...prev.notifications,
            ...(updates.notifications || {})
          },
          privacy: {
            ...prev.privacy,
            ...(updates.privacy || {})
          },
          windowStyles: {
            headerAutoHide: updates.windowStyles?.headerAutoHide ?? prev.windowStyles?.headerAutoHide ?? false,
            headerHideDelay: updates.windowStyles?.headerHideDelay ?? prev.windowStyles?.headerHideDelay ?? 2000,
            windowBgOpacity: updates.windowStyles?.windowBgOpacity ?? prev.windowStyles?.windowBgOpacity ?? 0.85,
            windowBgBlur: updates.windowStyles?.windowBgBlur ?? prev.windowStyles?.windowBgBlur ?? 5,
            backgroundBlur: updates.windowStyles?.backgroundBlur ?? prev.windowStyles?.backgroundBlur ?? 0,
            windowBgColor: updates.windowStyles?.windowBgColor ?? prev.windowStyles?.windowBgColor ?? '24,24,28',
            windowBorderRadius: updates.windowStyles?.windowBorderRadius ?? prev.windowStyles?.windowBorderRadius ?? 8,
            windowShadow: updates.windowStyles?.windowShadow ?? prev.windowStyles?.windowShadow ?? '0 8px 30px rgba(0, 0, 0, 0.3)'
          }
        }
        
        // Notify all listeners with the updated preferences
        listeners.forEach(listener => listener(updatedPrefs))
        return updatedPrefs
      })
    } catch (err) {
      console.error("Error updating preferences:", err)
      setError(err as Error)
    }
  }, [user, listeners])

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
    error,
    updatePreferences,
    subscribe,
    updatePomodoroSettings,
    resetToDefaults,
  }
}
