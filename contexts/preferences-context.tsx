"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { useFirestorePreferences, type UserPreferences } from "@/hooks/use-firestore-preferences"

interface PreferencesContextType extends UserPreferences {
  updateLocalPreferences: (updates: Partial<UserPreferences>) => void
}

const defaultValues: PreferencesContextType = {
  theme: 'system',
  backgroundScene: 'bedroom',
  musicGenre: 'lofi',
  pomodoroSettings: {
    workDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    sessionsUntilLongBreak: 4,
    autoStartBreaks: true,
    autoStartPomodoros: false,
    soundEnabled: true,
    volume: 70,
  },
  windowStyles: {
    headerAutoHide: false,
    headerHideDelay: 2000,
    windowBgOpacity: 0.85,
    windowBgBlur: 5,
    backgroundBlur: 0,
    windowBgColor: '24,24,28',
    windowBorderRadius: 8,
    windowShadow: '0 8px 30px rgba(0, 0, 0, 0.3)',
  },
  notifications: {
    desktop: true,
    sound: true,
    email: false,
  },
  privacy: {
    analytics: true,
    crashReports: true,
  },
  updateLocalPreferences: () => {},
}

export const PreferencesContext = createContext<PreferencesContextType>(defaultValues)

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const { preferences, updatePreferences } = useFirestorePreferences()
  const [localPrefs, setLocalPrefs] = useState<UserPreferences>({...defaultValues, ...preferences})

  // Update local prefs when remote prefs change
  useEffect(() => {
    setLocalPrefs(prev => ({
      ...defaultValues,
      ...prev, // Keep any local overrides
      ...preferences, // Apply remote changes
    }))
  }, [preferences])

  const updateLocalPreferences = (updates: Partial<UserPreferences>) => {
    setLocalPrefs(prev => {
      const newPrefs = { ...prev, ...updates }
      // Update remote preferences in the background
      updatePreferences(updates)
      return newPrefs
    })
  }

  return (
    <PreferencesContext.Provider value={{ ...localPrefs, updateLocalPreferences }}>
      {children}
    </PreferencesContext.Provider>
  )
}

export const usePreferences = () => useContext(PreferencesContext)
