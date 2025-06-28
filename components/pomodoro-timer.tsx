"use client"
import { useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Play, Pause, RotateCcw, Coffee, Eye } from "lucide-react"
import { usePomodoro } from "@/hooks/use-pomodoro"
import { useFirestorePreferences } from "@/hooks/use-firestore-preferences"

interface PomodoroTimerProps {
  scale?: number;
  isSmall?: boolean;
}

export function PomodoroTimer({ scale = 1, isSmall = false }: PomodoroTimerProps) {
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
        return "FOCUS"
      case "shortBreak":
        return "SHORT BREAK"
      case "longBreak":
        return "LONG BREAK"
      default:
        return "FOCUS"
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
    return "#FF6B6B" // Consistent orange/red color from the screenshot
  }

  const isCompact = false; // This will be set by the parent component
  
  // Calculate consistent dynamic styles based on scale and size
  const getDynamicStyles = useMemo(() => {
    // Base sizes for different UI elements
    const baseTimerSize = 120; // Base size for the timer circle
    const baseFontSize = 1.25; // Base font size in rem
    const basePadding = 0.5; // Base padding in rem
    
    // Calculate sizes based on scale
    const timerSize = baseTimerSize * scale;
    const fontSize = baseFontSize * scale;
    const padding = basePadding * scale;
    
    return {
      container: {
        transform: `scale(${scale})`,
        transformOrigin: 'center',
        transition: 'transform 0.3s ease-out, font-size 0.3s ease-out',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        justifyContent: 'center',
        padding: `${padding}rem`,
      },
      timerContainer: {
        width: `${timerSize}px`,
        height: `${timerSize}px`,
        position: 'relative' as const,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      },
      timeDisplay: {
        fontSize: `${fontSize * 1.2}rem`,
        fontWeight: 300,
        lineHeight: 1,
        textAlign: 'center' as const,
        transition: 'font-size 0.2s ease-out',
      },
      sessionType: {
        fontSize: `${fontSize * 0.6}rem`,
        fontWeight: 500,
        textTransform: 'uppercase' as const,
        letterSpacing: '0.05em',
        marginBottom: `${padding * 0.5}rem`,
        color: 'rgba(255, 255, 255, 0.7)',
      },
      // Consistent button sizes based on scale
      buttonSize: Math.round(32 * scale),
      iconButtonSize: Math.round(24 * scale),
      // Progress ring styles
      progressRing: {
        radius: 45,
        strokeWidth: 5,
      },
    };
  }, [scale]);

  return (
    <div className="text-white w-full h-full flex flex-col items-center justify-center p-1 text-center">
      <div 
        className="w-full max-w-full space-y-1 transition-all duration-300"
        style={getDynamicStyles.container}
      >
        {/* Session Type with Icon */}
        <div className="flex flex-col items-center space-y-0.5">
          <div 
            className="uppercase tracking-wider text-gray-400 transition-all duration-200"
            style={getDynamicStyles.sessionType}
          >
            {getSessionType()}
          </div>
          <div className="p-0.5 rounded-full bg-gray-800/50">
            {currentSession === "work" ? (
              <Eye className="h-3 w-3 text-white" />
            ) : (
              <Coffee className="h-3 w-3 text-white" />
            )}
          </div>
        </div>

        {/* Timer Display */}
        <div 
          className="relative flex items-center justify-center mx-auto"
          style={getDynamicStyles.timerContainer}
        >
          {/* Progress Ring */}
          <svg 
            className="absolute inset-0 w-full h-full -rotate-90 transition-all duration-300" 
            viewBox="0 0 100 100"
            style={{
              transformOrigin: 'center',
              transform: `scale(${Math.min(scale, 1.2)})`,
              transition: 'transform 0.3s ease-out',
            }}
          >
            <circle 
              cx="50" 
              cy="50" 
              r="45" 
              fill="none" 
              stroke="rgba(255,255,255,0.1)" 
              strokeWidth="5" 
              className="transition-all duration-300"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke={getSessionColor()}
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 45}`}
              strokeDashoffset={`${2 * Math.PI * 45 * (1 - getProgress() / 100)}`}
              className="transition-all duration-1000 ease-linear"
            />
          </svg>
          
          {/* Time Display */}
          <div 
            className="relative z-10 font-mono font-light text-center"
            style={getDynamicStyles.timeDisplay}
          >
            {formatTime(timeLeft)}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center space-x-1 mt-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={reset}
            className="text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-all duration-200"
            style={{
              width: getDynamicStyles.iconButtonSize,
              height: getDynamicStyles.iconButtonSize,
              minWidth: getDynamicStyles.iconButtonSize,
            }}
          >
            <RotateCcw className="h-3 w-3" />
          </Button>

          <Button
            onClick={isRunning ? pause : start}
            className="rounded-full bg-gradient-to-br from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 transition-all duration-200"
            style={{
              width: getDynamicStyles.buttonSize,
              height: getDynamicStyles.buttonSize,
              minWidth: getDynamicStyles.buttonSize,
            }}
          >
            {isRunning ? (
              <Pause className="h-3 w-3 fill-current" />
            ) : (
              <Play className="h-3 w-3 ml-0.5 fill-current" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={skipSession}
            className="text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-all duration-200"
            style={{
              width: getDynamicStyles.iconButtonSize,
              height: getDynamicStyles.iconButtonSize,
              minWidth: getDynamicStyles.iconButtonSize,
            }}
          >
            <svg 
              className="h-3 w-3" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
              style={{
                transition: 'transform 0.2s ease-out',
              }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          </Button>
        </div>
      </div>
    </div>
  )
}
