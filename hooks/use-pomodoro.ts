"use client"

import { useState, useEffect, useRef, useCallback } from "react"

interface PomodoroSettings {
  workDuration: number // in seconds
  shortBreakDuration: number
  longBreakDuration: number
  sessionsUntilLongBreak: number
}

type SessionType = "work" | "shortBreak" | "longBreak"

export function usePomodoro() {
  const [settings, setSettings] = useState<PomodoroSettings>({
    workDuration: 25 * 60, // 25 minutes
    shortBreakDuration: 5 * 60, // 5 minutes
    longBreakDuration: 15 * 60, // 15 minutes
    sessionsUntilLongBreak: 4,
  })

  const [timeLeft, setTimeLeft] = useState(settings.workDuration)
  const [isRunning, setIsRunning] = useState(false)
  const [currentSession, setCurrentSession] = useState<SessionType>("work")
  const [sessionCount, setSessionCount] = useState(1)

  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Update timeLeft only when the session type changes, not when settings change
  useEffect(() => {
    if (!isRunning) {
      const duration =
        currentSession === "work"
          ? settings.workDuration
          : currentSession === "shortBreak"
            ? settings.shortBreakDuration
            : settings.longBreakDuration
      // Only update timeLeft if we're starting a new session type or the current time is 0
      if (timeLeft === 0 || Math.abs(timeLeft - duration) > 1) {
        setTimeLeft(duration)
      }
    }
  }, [currentSession])

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Session completed
            handleSessionComplete()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning, timeLeft])

  const handleSessionComplete = () => {
    setIsRunning(false)

    if (currentSession === "work") {
      // Work session completed, start break
      const isLongBreak = sessionCount % settings.sessionsUntilLongBreak === 0
      const nextSession = isLongBreak ? "longBreak" : "shortBreak"
      const nextDuration = isLongBreak ? settings.longBreakDuration : settings.shortBreakDuration

      setCurrentSession(nextSession)
      setTimeLeft(nextDuration)
    } else {
      // Break completed, start work
      setCurrentSession("work")
      setTimeLeft(settings.workDuration)
      setSessionCount((prev) => prev + 1)
    }

    // Show notification
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("Pomodoro Timer", {
        body: currentSession === "work" ? "Time for a break!" : "Time to focus!",
        icon: "/favicon.ico",
      })
    }

    console.log("Session completed!")
  }

  const start = () => {
    // Request notification permission
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission()
    }
    setIsRunning(true)
  }

  const pause = () => {
    setIsRunning(false)
  }

  const reset = () => {
    setIsRunning(false)
    setCurrentSession("work")
    setTimeLeft(settings.workDuration)
    setSessionCount(1)
  }

  const skipSession = () => {
    setIsRunning(false)
    handleSessionComplete()
  }

  const updateSettings = useCallback((newSettings: Partial<PomodoroSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }))
  }, [])

  return {
    timeLeft,
    isRunning,
    currentSession,
    sessionCount,
    settings,
    start,
    pause,
    reset,
    skipSession,
    updateSettings,
  }
}
