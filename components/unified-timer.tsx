import React, { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Play, Pause, RotateCcw, Coffee, Eye, Timer, Plus, Minus } from "lucide-react"

// Timer Types
type TimerType = "pomodoro" | "stopwatch" | "countdown"
type PomodoroSession = "work" | "shortBreak" | "longBreak"

// Timer Configuration Interface
interface TimerConfig {
  type: TimerType
  initialTime: number
  maxTime?: number
  session?: PomodoroSession
  sessionCount?: number
  autoStart?: boolean
  showProgress?: boolean
  color: string
  icon: React.ReactNode
  label: string
}

// Unified Timer Hook
function useUnifiedTimer(config: TimerConfig) {
  const [timeLeft, setTimeLeft] = useState(config.initialTime)
  const [isRunning, setIsRunning] = useState(false)
  const [currentSession, setCurrentSession] = useState<PomodoroSession>(config.session || "work")
  const [sessionCount, setSessionCount] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const cleanup = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const start = useCallback(() => {
    setIsRunning(true)
  }, [])

  const pause = useCallback(() => {
    setIsRunning(false)
    cleanup()
  }, [cleanup])

  const reset = useCallback(() => {
    setIsRunning(false)
    cleanup()
    setTimeLeft(config.initialTime)
    if (config.type === "pomodoro") {
      setCurrentSession("work")
      setSessionCount(0)
    }
  }, [config.initialTime, config.type, cleanup])

  const skip = useCallback(() => {
    if (config.type === "pomodoro") {
      // Pomodoro skip logic
      const newCount = currentSession === "work" ? sessionCount + 1 : sessionCount
      const nextSession = currentSession === "work" 
        ? (newCount % 4 === 0 ? "longBreak" : "shortBreak")
        : "work"
      
      setCurrentSession(nextSession)
      setSessionCount(newCount)
      setTimeLeft(nextSession === "work" ? 25 * 60 : nextSession === "shortBreak" ? 5 * 60 : 15 * 60)
    } else if (config.type === "countdown") {
      setTimeLeft(0)
    }
    setIsRunning(false)
  }, [config.type, currentSession, sessionCount])

  const adjustTime = useCallback((minutes: number) => {
    if (config.type === "countdown") {
      const newTime = Math.max(0, Math.min(timeLeft + (minutes * 60), config.maxTime || 59 * 60 + 59))
      setTimeLeft(newTime)
    }
  }, [config.type, config.maxTime, timeLeft])

  // Timer logic
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (config.type === "stopwatch") {
            return prev + 1
          } else {
            const newTime = prev - 1
            if (newTime <= 0) {
              setIsRunning(false)
              if (config.type === "pomodoro") {
                // Auto-transition to next session
                const newCount = currentSession === "work" ? sessionCount + 1 : sessionCount
                const nextSession = currentSession === "work" 
                  ? (newCount % 4 === 0 ? "longBreak" : "shortBreak")
                  : "work"
                
                setTimeout(() => {
                  setCurrentSession(nextSession)
                  setSessionCount(newCount)
                  setTimeLeft(nextSession === "work" ? 25 * 60 : nextSession === "shortBreak" ? 5 * 60 : 15 * 60)
                }, 1000)
              }
              return 0
            }
            return newTime
          }
        })
      }, 1000)
    } else {
      cleanup()
    }

    return cleanup
  }, [isRunning, config.type, currentSession, sessionCount, cleanup])

  return {
    timeLeft,
    isRunning,
    currentSession,
    sessionCount,
    start,
    pause,
    reset,
    skip,
    adjustTime
  }
}

// Unified Timer Component
interface UnifiedTimerProps {
  config: TimerConfig
  scale?: number
  isSmall?: boolean
}

function UnifiedTimer({ config, scale = 1, isSmall = false }: UnifiedTimerProps) {
  const { timeLeft, isRunning, currentSession, start, pause, reset, skip, adjustTime } = useUnifiedTimer(config)

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(Math.abs(seconds) / 60)
    const secs = Math.abs(seconds) % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }, [])

  const getProgress = useCallback(() => {
    if (config.type === "stopwatch") return 0
    
    const totalTime = config.type === "pomodoro" 
      ? (currentSession === "work" ? 25 * 60 : currentSession === "shortBreak" ? 5 * 60 : 15 * 60)
      : config.initialTime
    
    if (config.type === "countdown") {
      return ((config.initialTime - timeLeft) / config.initialTime) * 100
    }
    return ((totalTime - timeLeft) / totalTime) * 100
  }, [config, timeLeft, currentSession])

  const getSessionInfo = useCallback(() => {
    switch (config.type) {
      case "pomodoro":
        return {
          label: currentSession === "work" ? "FOCUS" : currentSession === "shortBreak" ? "SHORT BREAK" : "LONG BREAK",
          icon: currentSession === "work" ? <Eye className="h-3 w-3" /> : <Coffee className="h-3 w-3" />
        }
      case "stopwatch":
        return { label: "STOPWATCH", icon: <Timer className="h-3 w-3" /> }
      case "countdown":
        return { label: "COUNTDOWN", icon: <Timer className="h-3 w-3" /> }
      default:
        return { label: config.label.toUpperCase(), icon: config.icon }
    }
  }, [config, currentSession])

  // Dynamic styles calculation
  const getDynamicStyles = useMemo(() => {
    const baseTimerSize = 120
    const baseFontSize = 1.25
    const basePadding = 0.5
    
    const timerSize = baseTimerSize * scale
    const fontSize = baseFontSize * scale
    const padding = basePadding * scale
    
    return {
      container: {
        transform: `scale(${scale})`,
        transformOrigin: 'center',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        width: '90%',
        height: '90%',
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
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      },
      timeDisplay: {
        fontSize: `${fontSize * 1.2}rem`,
        fontWeight: 300,
        lineHeight: 1,
        textAlign: 'center' as const,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: isRunning ? 'scale(1.02)' : 'scale(1)',
      },
      sessionType: {
        fontSize: `${fontSize * 0.6}rem`,
        fontWeight: 500,
        textTransform: 'uppercase' as const,
        letterSpacing: '0.05em',
        marginBottom: `${padding * 0.5}rem`,
        color: 'rgba(255, 255, 255, 0.7)',
        transition: 'all 0.3s ease-out',
      },
      buttonSize: Math.round(32 * scale),
      iconButtonSize: Math.round(24 * scale),
    }
  }, [scale, isRunning])

  const sessionInfo = getSessionInfo()

  return (
    <div className="text-white w-full h-full flex flex-col items-center justify-center p-1 text-center">
      <div 
        className="w-full max-w-full space-y-1"
        style={getDynamicStyles.container}
      >
        {/* Session Type with Icon */}
        <div className="flex flex-col items-center space-y-0.5">
          <div 
            className="uppercase tracking-wider text-gray-400"
            style={getDynamicStyles.sessionType}
          >
            {sessionInfo.label}
          </div>
          <div className="p-0.5 rounded-full bg-gray-800/50 transition-all duration-300">
            {sessionInfo.icon}
          </div>
        </div>

        {/* Timer Display */}
        <div 
          className="relative flex items-center justify-center mx-auto"
          style={getDynamicStyles.timerContainer}
        >
          {/* Progress Ring - only show for countdown and pomodoro */}
          {config.showProgress && (
            <svg 
              className="absolute inset-0 w-full h-full -rotate-90" 
              viewBox="0 0 100 100"
              style={{
                transformOrigin: 'center',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              <circle 
                cx="50" 
                cy="50" 
                r="45" 
                fill="none" 
                stroke="rgba(255,255,255,0.1)" 
                strokeWidth="5"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke={config.color}
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 45}`}
                strokeDashoffset={`${2 * Math.PI * 45 * (1 - getProgress() / 100)}`}
                className="transition-all duration-1000 ease-linear"
                style={{
                  filter: isRunning ? 'drop-shadow(0 0 8px rgba(255, 107, 107, 0.5))' : 'none',
                }}
              />
            </svg>
          )}
          
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
          {/* Countdown Time Adjustment */}
          {config.type === "countdown" && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => adjustTime(-1)}
                className="text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-all duration-200"
                style={{
                  width: getDynamicStyles.iconButtonSize,
                  height: getDynamicStyles.iconButtonSize,
                  minWidth: getDynamicStyles.iconButtonSize,
                }}
              >
                <Minus className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => adjustTime(1)}
                className="text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-all duration-200"
                style={{
                  width: getDynamicStyles.iconButtonSize,
                  height: getDynamicStyles.iconButtonSize,
                  minWidth: getDynamicStyles.iconButtonSize,
                }}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </>
          )}

          {/* Reset Button */}
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

          {/* Play/Pause Button */}
          <Button
            onClick={isRunning ? pause : start}
            className="rounded-full transition-all duration-300 shadow-lg"
            style={{
              width: getDynamicStyles.buttonSize,
              height: getDynamicStyles.buttonSize,
              minWidth: getDynamicStyles.buttonSize,
              background: `linear-gradient(135deg, ${config.color}, ${config.color}dd)`,
              transform: isRunning ? 'scale(1.05)' : 'scale(1)',
              boxShadow: isRunning ? `0 4px 20px ${config.color}40` : '0 2px 10px rgba(0,0,0,0.3)',
            }}
          >
            {isRunning ? (
              <Pause className="h-3 w-3 fill-current" />
            ) : (
              <Play className="h-3 w-3 ml-0.5 fill-current" />
            )}
          </Button>

          {/* Skip Button */}
          {(config.type === "pomodoro" || config.type === "countdown") && (
            <Button
              variant="ghost"
              size="icon"
              onClick={skip}
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
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

// Main Timer Panel Component
export default function TimerPanel() {
  const [activeTab, setActiveTab] = useState<TimerType>("pomodoro")
  const tabsRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

  // Resize observer for smooth scaling
  useEffect(() => {
    const updateDimensions = () => {
      if (contentRef.current) {
        const { width, height } = contentRef.current.getBoundingClientRect()
        setDimensions({ width, height })
      }
    }

    updateDimensions()
    const resizeObserver = new ResizeObserver(entries => {
      requestAnimationFrame(updateDimensions)
    })

    if (contentRef.current) {
      resizeObserver.observe(contentRef.current)
    }

    return () => resizeObserver.disconnect()
  }, [])

  // Calculate scale factor
  const getScaleFactor = useCallback(() => {
    const baseWidth = 280
    const minWidth = 200
    const maxWidth = 400
    
    let scale = 1.0
    if (dimensions.width < minWidth) {
      scale = 0.8
    } else if (dimensions.width > maxWidth) {
      scale = 1.2
    } else {
      scale = 0.8 + (0.4 * (dimensions.width - minWidth) / (maxWidth - minWidth))
    }
    
    return {
      scale,
      isSmall: dimensions.width < 250,
    }
  }, [dimensions.width])

  const { scale, isSmall } = getScaleFactor()

  // Timer configurations
  const timerConfigs: Record<TimerType, TimerConfig> = {
    pomodoro: {
      type: "pomodoro",
      initialTime: 25 * 60,
      session: "work",
      showProgress: true,
      color: "#FF6B6B",
      icon: <Eye className="h-4 w-4" />,
      label: "Pomodoro"
    },
    stopwatch: {
      type: "stopwatch",
      initialTime: 0,
      showProgress: false,
      color: "#4ECDC4",
      icon: <Timer className="h-4 w-4" />,
      label: "Stopwatch"
    },
    countdown: {
      type: "countdown",
      initialTime: 10 * 60,
      maxTime: 59 * 60 + 59,
      showProgress: true,
      color: "#45B7D1",
      icon: <Timer className="h-4 w-4" />,
      label: "Countdown"
    }
  }

  return (
    <div className="h-full w-full flex flex-col bg-transparent relative isolate min-h-0 min-w-0 overflow-hidden">
      <Tabs 
        value={activeTab} 
        onValueChange={(v) => setActiveTab(v as TimerType)} 
        className="h-full w-full flex flex-col min-h-0 min-w-0"
      >
        <div 
          ref={tabsRef}
          className="relative shrink-0"
        >
          <TabsList 
            className="grid grid-cols-3 mx-1 mt-1 mb-0.5 flex-shrink-0 bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 transition-all duration-300"
            style={{
              transform: `scale(${scale})`,
              transformOrigin: 'top center',
            }}
          >
            {Object.entries(timerConfigs).map(([key, config]) => (
              <TabsTrigger 
                key={key}
                value={key as TimerType}
                className={`h-6 hover:bg-gray-700/50 data-[state=active]:bg-blue-600/50 transition-all duration-200 ${
                  isSmall ? "text-[9px] px-1" : "text-[10px] px-2"
                }`}
              >
                {config.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <div 
          ref={contentRef}
          className="relative flex-1 min-h-0 overflow-hidden"
        >
          <div className="h-full w-full">
            {Object.entries(timerConfigs).map(([key, config]) => (
              <TabsContent
                key={key}
                value={key as TimerType}
                className="h-full w-full m-0 p-2 sm:p-2 data-[state=active]:flex data-[state=inactive]:hidden items-start justify-center transition-all duration-300"
                forceMount
              >
                <UnifiedTimer 
                  config={config} 
                  scale={scale * 0.8} 
                  isSmall={isSmall} 
                />
              </TabsContent>
            ))}
          </div>
        </div>
      </Tabs>
    </div>
  )
}