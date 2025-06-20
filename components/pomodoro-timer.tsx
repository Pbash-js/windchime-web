"use client"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Play, Pause, RotateCcw, SkipForward, Settings } from "lucide-react"
import { usePomodoro } from "@/hooks/use-pomodoro"
import { useFirestorePreferences } from "@/hooks/use-firestore-preferences"

export function PomodoroTimer() {
  const { preferences, updatePomodoroSettings } = useFirestorePreferences()
  const { timeLeft, isRunning, currentSession, sessionCount, start, pause, reset, skipSession, updateSettings } =
    usePomodoro()

  // Update pomodoro hook when preferences change
  useEffect(() => {
    if (preferences.pomodoroSettings) {
      updateSettings({
        workDuration: preferences.pomodoroSettings.workDuration * 60, // Convert to seconds
        shortBreakDuration: preferences.pomodoroSettings.shortBreakDuration * 60,
        longBreakDuration: preferences.pomodoroSettings.longBreakDuration * 60,
        sessionsUntilLongBreak: preferences.pomodoroSettings.sessionsUntilLongBreak,
      })
    }
  }, [preferences.pomodoroSettings, updateSettings])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const getSessionType = () => {
    switch (currentSession) {
      case "work":
        return "Focus Time"
      case "shortBreak":
        return "Short Break"
      case "longBreak":
        return "Long Break"
      default:
        return "Focus Time"
    }
  }

  const getProgress = () => {
    const totalTime =
      currentSession === "work"
        ? preferences.pomodoroSettings.workDuration * 60
        : currentSession === "shortBreak"
          ? preferences.pomodoroSettings.shortBreakDuration * 60
          : preferences.pomodoroSettings.longBreakDuration * 60
    return ((totalTime - timeLeft) / totalTime) * 100
  }

  const getSessionColor = () => {
    switch (currentSession) {
      case "work":
        return "rgba(59,130,246,0.8)" // Blue
      case "shortBreak":
        return "rgba(34,197,94,0.8)" // Green
      case "longBreak":
        return "rgba(168,85,247,0.8)" // Purple
      default:
        return "rgba(59,130,246,0.8)"
    }
  }

  return (
    <div className="text-white w-full h-full flex items-center justify-center p-4 text-center">
      <div className="w-full max-w-sm space-y-4">
        {/* Session Type */}
        <div
          className={`text-xs uppercase tracking-wider transition-all duration-300 ease-in-out ${
            currentSession === "work"
              ? "text-blue-400"
              : currentSession === "shortBreak"
                ? "text-green-400"
                : "text-purple-400"
          }`}
        >
          {getSessionType()}
        </div>

        {/* Timer Display */}
        <div className="relative group pointer-events-none">
          <div
            className={`text-4xl font-mono font-light transition-all duration-300 ease-in-out ${
              isRunning ? "scale-105" : "scale-100"
            }`}
          >
            {formatTime(timeLeft)}
          </div>

          {/* Progress Ring */}
          <svg
            className="absolute inset-0 w-full h-full -rotate-90 transition-all duration-300 ease-in-out"
            viewBox="0 0 100 100"
          >
            <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke={getSessionColor()}
              strokeWidth="2"
              strokeDasharray={`${2 * Math.PI * 40}`}
              strokeDashoffset={`${2 * Math.PI * 40 * (1 - getProgress() / 100)}`}
              className="transition-all duration-1000 ease-linear"
              style={{
                filter: isRunning ? "drop-shadow(0 0 8px currentColor)" : "none",
              }}
            />
          </svg>

          {/* Pulse effect when running */}
          {isRunning && <div className="absolute inset-0 rounded-full animate-pulse bg-current opacity-5 pointer-events-none" />}
        </div>

        {/* Session Counter */}
        <div className="text-xs text-gray-400 transition-all duration-300 ease-in-out">
          Session {sessionCount} • {currentSession === "work" ? "Working" : "Break"}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3 pointer-events-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={reset}
            className="text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-200 ease-in-out hover:scale-110 h-8 w-8 p-0"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>

          <Button
            size="sm"
            onClick={isRunning ? pause : start}
            className={`px-6 transition-all duration-300 ease-in-out hover:scale-105 ${
              currentSession === "work"
                ? "bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/25"
                : currentSession === "shortBreak"
                  ? "bg-green-600 hover:bg-green-700 shadow-lg shadow-green-500/25"
                  : "bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-500/25"
            }`}
          >
            {isRunning ? (
              <Pause className="h-4 w-4 transition-transform duration-200" />
            ) : (
              <Play className="h-4 w-4 transition-transform duration-200" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={skipSession}
            className="text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-200 ease-in-out hover:scale-110 h-8 w-8 p-0"
          >
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>

        {/* Settings hint */}
        <div className="text-xs text-gray-500 transition-all duration-300 ease-in-out flex items-center justify-center gap-1">
          <Settings className="h-3 w-3" />
          <span>
            {preferences.pomodoroSettings.workDuration}m • {preferences.pomodoroSettings.shortBreakDuration}m
          </span>
        </div>

        {/* Next Session Preview */}
        <div className="text-xs text-gray-500 transition-all duration-300 ease-in-out">
          Next: {currentSession === "work" ? (sessionCount % 4 === 0 ? "Long Break" : "Short Break") : "Focus Time"}
        </div>
      </div>
    </div>
  )
}
