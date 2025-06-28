"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Play, Pause, RotateCcw, Coffee, Eye, Timer, Plus, Minus, Flag, Clock, Zap } from "lucide-react"
import { cn } from "@/lib/utils"

// Z-index constants for better maintainability
const Z_INDEX = {
  BASE: 0,
  CONTENT: 10,
  TABS: 20,
  WINDOW_HEADER: 30,
  WINDOW: 40,
  MODAL: 50,
  TOOLTIP: 60,
  NOTIFICATION: 70,
  MAX: 9999
} as const

type TimerTab = "pomodoro" | "stopwatch" | "countdown"
type PomodoroSession = "work" | "shortBreak" | "longBreak"

// Timer Configuration Interface
interface TimerConfig {
  type: TimerTab
  initialTime: number
  maxTime?: number
  session?: PomodoroSession
  sessionCount?: number
  autoStart?: boolean
  showProgress?: boolean
  color: string
  label: string
}

// Stopwatch milestone type
interface Milestone {
  id: number
  time: number
  label: string
}

// Audio notification functions
const playNotification = (type: 'start' | 'end' | 'sessionChange' = 'end') => {
  try {
    // Try to use HTML5 Audio first for better sound quality
    if (typeof Audio !== 'undefined') {
      let audioFile = '';
      
      // Map notification types to audio files
      switch (type) {
        case 'start':
          audioFile = '/sounds/timer-start.mp3';
          break;
        case 'sessionChange':
          audioFile = '/sounds/session-change.mp3';
          break;
        case 'end':
        default:
          audioFile = '/sounds/timer-end.mp3';
      }
      
      // Try to play the audio file
      try {
        const audio = new Audio(audioFile);
        audio.volume = 0.5;
        return audio.play().catch(e => {
          console.warn('Audio playback failed, falling back to Web Audio API');
          playFallbackNotification(type);
        });
      } catch (e) {
        console.warn('Error with Audio element, falling back to Web Audio API');
        playFallbackNotification(type);
      }
    } else {
      // Fallback to Web Audio API if HTML5 Audio is not available
      playFallbackNotification(type);
    }
  } catch (error) {
    console.error('Audio notification failed:', error);
  }
};

// Fallback notification using Web Audio API
const playFallbackNotification = (type: 'start' | 'end' | 'sessionChange') => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Different sounds for different notification types
    if (type === 'start') {
      oscillator.frequency.value = 880; // A5
    } else if (type === 'sessionChange') {
      oscillator.frequency.value = 659.25; // E5
    } else {
      oscillator.frequency.value = 440; // A4
    }
    
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  } catch (error) {
    console.log('Audio notification not supported');
  }
};

// Unified Timer Hook
function useUnifiedTimer(config: TimerConfig) {
  const [timeLeft, setTimeLeft] = useState(config.initialTime)
  const [isRunning, setIsRunning] = useState(false)
  const [currentSession, setCurrentSession] = useState<PomodoroSession>(config.session || "work")
  const [sessionCount, setSessionCount] = useState(0)
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [milestoneCounter, setMilestoneCounter] = useState(1)
  const [baseTime, setBaseTime] = useState(config.initialTime) // Track base time for countdown
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const cleanup = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const start = useCallback(() => {
    setIsRunning(true);
    playNotification('start');
  }, [])

  const pause = useCallback(() => {
    setIsRunning(false)
    cleanup()
  }, [cleanup])

  const reset = useCallback(() => {
    setIsRunning(false)
    cleanup()
    setTimeLeft(config.initialTime)
    setBaseTime(config.initialTime)
    setMilestones([])
    setMilestoneCounter(1)
    if (config.type === "pomodoro") {
      setCurrentSession("work")
      setSessionCount(0)
    }
  }, [config.initialTime, config.type, cleanup])

  const skip = useCallback(() => {
    const wasRunning = isRunning;
    
    if (config.type === "pomodoro") {
      // Pomodoro skip logic
      const newCount = currentSession === "work" ? sessionCount + 1 : sessionCount;
      const nextSession = currentSession === "work" 
        ? (newCount % 4 === 0 ? "longBreak" : "shortBreak")
        : "work";
      
      // Play session change sound
      playNotification('sessionChange');
      
      // Update to next session
      setCurrentSession(nextSession);
      setSessionCount(newCount);
      const nextTime = nextSession === "work" ? 25 * 60 : nextSession === "shortBreak" ? 5 * 60 : 15 * 60;
      setTimeLeft(nextTime);
      setBaseTime(nextTime);
      
      // If timer was running, automatically start the next session
      if (wasRunning) {
        // Small delay to ensure state updates before starting
        setTimeout(() => {
          setIsRunning(true);
          playNotification('start');
        }, 50);
      }
    } else if (config.type === "countdown") {
      setTimeLeft(0);
      setIsRunning(false);
    } else {
      setIsRunning(false);
    }
  }, [config.type, currentSession, sessionCount, isRunning])

  const adjustTime = useCallback((minutes: number) => {
    if (config.type === "countdown") {
      const newTime = Math.max(0, Math.min(timeLeft + (minutes * 60), config.maxTime || 59 * 60 + 59))
      setTimeLeft(newTime)
      setBaseTime(newTime) // Update base time when adjusting
    }
  }, [config.type, config.maxTime, timeLeft])

  const addMilestone = useCallback(() => {
    if (config.type === "stopwatch") {
      const newMilestone: Milestone = {
        id: Date.now(),
        time: timeLeft,
        label: `Lap ${milestoneCounter}`
      }
      setMilestones(prev => [newMilestone, ...prev])
      setMilestoneCounter(prev => prev + 1)
    }
  }, [config.type, timeLeft, milestoneCounter])

  // Timer logic
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (config.type === "stopwatch") {
            return prev + 0.01 // Increment by 10ms for millisecond precision
          } else {
            const newTime = prev - 1
            if (newTime <= 0) {
              setIsRunning(false)
              playNotification() // Play sound when timer finishes
              
              if (config.type === "pomodoro") {
                // Auto-transition to next session
                const newCount = currentSession === "work" ? sessionCount + 1 : sessionCount
                const nextSession = currentSession === "work" 
                  ? (newCount % 4 === 0 ? "longBreak" : "shortBreak")
                  : "work"
                
                // Play session change sound
                playNotification('sessionChange');
                
                setTimeout(() => {
                  setCurrentSession(nextSession)
                  setSessionCount(newCount)
                  const nextTime = nextSession === "work" ? 25 * 60 : nextSession === "shortBreak" ? 5 * 60 : 15 * 60
                  setTimeLeft(nextTime)
                  setBaseTime(nextTime)
                  setIsRunning(true) // Auto-start next session
                  playNotification('start'); // Play start sound
                }, 1000)
              }
              return 0
            }
            return newTime
          }
        })
      }, config.type === "stopwatch" ? 10 : 1000) // 10ms interval for stopwatch, 1s for others
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
    milestones,
    baseTime,
    start,
    pause,
    reset,
    skip,
    adjustTime,
    addMilestone
  }
}

// Unified Timer Component
interface UnifiedTimerProps {
  config: TimerConfig
  size: number
}

function UnifiedTimer({ config, size }: UnifiedTimerProps) {
  const { timeLeft, isRunning, currentSession, milestones, baseTime, start, pause, reset, skip, adjustTime, addMilestone } = useUnifiedTimer(config)

  const formatTime = useCallback((seconds: number) => {
    const totalSeconds = Math.abs(seconds)
    const mins = Math.floor(totalSeconds / 60)
    const secs = Math.floor(totalSeconds % 60)
    
    if (config.type === "stopwatch") {
      const milliseconds = Math.floor((totalSeconds % 1) * 100)
      return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}.${milliseconds.toString().padStart(2, "0")}`
    }
    
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }, [config.type])

  const getProgress = useCallback(() => {
    if (config.type === "stopwatch") return 0
    
    const totalTime = config.type === "pomodoro" 
      ? (currentSession === "work" ? 25 * 60 : currentSession === "shortBreak" ? 5 * 60 : 15 * 60)
      : baseTime // Use baseTime for countdown to fix SVG direction issue
    
    if (config.type === "countdown") {
      return totalTime > 0 ? ((baseTime - timeLeft) / baseTime) * 100 : 0
    }
    return ((totalTime - timeLeft) / totalTime) * 100
  }, [config, timeLeft, currentSession, baseTime])

  const getSessionInfo = useCallback(() => {
    switch (config.type) {
      case "pomodoro":
        return {
          label: currentSession === "work" ? "FOCUS" : currentSession === "shortBreak" ? "BREAK" : "BREAK",
          icon: currentSession === "work" ? <Eye className="h-3 w-3" /> : <Coffee className="h-3 w-3" />
        }
      case "stopwatch":
        return { label: "STOPWATCH", icon: <Timer className="h-3 w-3" /> }
      case "countdown":
        return { label: "", icon: <Timer className="h-3 w-3" /> }
      default:
        return { label: config.label.toUpperCase(), icon: <Timer className="h-3 w-3" /> }
    }
  }, [config, currentSession])

  // Calculate dimensions based on the size prop
  const timerContainerSize = size > 0 ? Math.min(size, 200) : 120 // Cap max size to prevent clipping
  const fontSize = timerContainerSize * 0.32 // Reduced font size to fit better
  const sessionFontSize = timerContainerSize * 0.07
  const strokeWidth = Math.max(2, timerContainerSize * 0.03) // Minimum stroke width
  const buttonSize = timerContainerSize * 0.28
  const iconButtonSize = timerContainerSize * 0.2

  const sessionInfo = getSessionInfo()

  return (
    <div className="flex flex-col items-center justify-center text-white text-center transition-all duration-300 h-full w-full"
      style={{ gap: `${timerContainerSize * 0.08}px` }}
    >
      {/* Timer Display with SVG */}
      <div className="flex flex-col items-center" style={{ gap: `${timerContainerSize * 0.03}px` }}>
        <div
          className="relative flex items-center justify-center"
          style={{
            width: `${timerContainerSize}px`,
            height: `${timerContainerSize}px`,
          }}
        >
          {config.showProgress && (
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
              {/* Background Circle */}
              <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6" />
              {/* Progress Circle */}
              <circle
                cx="50" cy="50" r="42" fill="none"
                stroke={config.color}
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 42}`}
                strokeDashoffset={`${2 * Math.PI * 42 * (1 - getProgress() / 100)}`}
                className="transition-all duration-300 ease-linear"
                style={{ filter: isRunning ? `drop-shadow(0 0 8px ${config.color}80)` : 'none' }}
              />
            </svg>
          )}
          <div className="relative">
          <div
            className="relative z-10 font-mono font-light text-center transition-transform duration-300"
            style={{
              fontSize: `${fontSize}px`,
              lineHeight: 1,
              transform: isRunning ? 'scale(1.02)' : 'scale(1)',
            }}
          >
            {formatTime(timeLeft)}
          </div>
          {/* Session Type (small subtitle) */}
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-5 flex items-center justify-center" style={{ gap: `${timerContainerSize * 0.02}px` }}>
          {/* <div className="p-1 rounded-full bg-gray-800/20">
            {sessionInfo.icon}
          </div> */}
          <div 
            className="uppercase tracking-wider text-gray-600"
            style={{
              fontSize: `${sessionFontSize}px`
            }}
          >
            {sessionInfo.label}
          </div>
        </div>
        </div>
        </div>

        
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center" style={{ gap: `${timerContainerSize * 0.06}px` }}>
        {/* Countdown Time Adjustment */}
        {config.type === "countdown" && (
          <>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => adjustTime(-1)}
              className="text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-all duration-200"
              style={{
                width: iconButtonSize,
                height: iconButtonSize,
                minWidth: iconButtonSize,
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
                width: iconButtonSize,
                height: iconButtonSize,
                minWidth: iconButtonSize,
              }}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </>
        )}

        {/* Stopwatch Milestone Button */}
        {config.type === "stopwatch" && (
          <Button
            variant="ghost"
            size="icon"
            onClick={addMilestone}
            disabled={!isRunning}
            className="text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-all duration-200 disabled:opacity-30"
            style={{
              width: iconButtonSize,
              height: iconButtonSize,
              minWidth: iconButtonSize,
            }}
          >
            <Flag className="h-3 w-3" />
          </Button>
        )}

        {/* Reset Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={reset}
          className="text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-all duration-200"
          style={{
            width: iconButtonSize,
            height: iconButtonSize,
            minWidth: iconButtonSize,
          }}
        >
          <RotateCcw className="h-3 w-3" />
        </Button>

        {/* Play/Pause Button */}
        <Button
          onClick={isRunning ? pause : start}
          className="rounded-full transition-all duration-300 shadow-lg"
          style={{
            width: buttonSize,
            height: buttonSize,
            minWidth: buttonSize,
            background: `linear-gradient(135deg, ${config.color}, ${config.color}dd)`,
            transform: isRunning ? 'scale(1.05)' : 'scale(1)',
            boxShadow: isRunning ? `0 4px 20px ${config.color}40` : '0 2px 10px rgba(0,0,0,0.3)',
          }}
        >
          {isRunning ? (
            <Pause className="h-4 w-4 fill-current" />
          ) : (
            <Play className="h-4 w-4 ml-0.5 fill-current" />
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
              width: iconButtonSize,
              height: iconButtonSize,
              minWidth: iconButtonSize,
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

      {/* Stopwatch Milestones */}
      {config.type === "stopwatch" && milestones.length > 0 && (
        <div className="w-full max-w-xs">
          <div 
            className="max-h-24 overflow-y-auto bg-gray-900/30 rounded-lg p-2 backdrop-blur-sm"
            style={{ fontSize: `${sessionFontSize * 0.9}px` }}
          >
            {milestones.map((milestone) => (
              <div key={milestone.id} className="flex justify-between items-center py-1 text-gray-300">
                <span>{milestone.label}</span>
                <span className="font-mono">{formatTime(milestone.time)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Timer configurations for each tab
const TIMER_CONFIGS = {
  pomodoro: {
    type: "pomodoro" as const,
    initialTime: 25 * 60, // 25 minutes in seconds
    session: "work" as const,
    showProgress: true,
    color: "#FF6B6B",
    label: "Pomodoro"
  },
  stopwatch: {
    type: "stopwatch" as const,
    initialTime: 0,
    showProgress: false,
    color: "#4ECDC4",
    label: "Stopwatch"
  },
  countdown: {
    type: "countdown" as const,
    initialTime: 10 * 60, // 10 minutes in seconds
    maxTime: 59 * 60 + 59, // 59:59 max
    showProgress: true,
    color: "#45B7D1",
    label: "⏳"
  }
} as const

export function TimerPanel() {
  const [activeTab, setActiveTab] = useState<TimerTab>("pomodoro")
  const tabsRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

  // Update dimensions on resize with ResizeObserver for smooth animations
  useEffect(() => {
    const updateDimensions = () => {
      if (contentRef.current) {
        const { width, height } = contentRef.current.getBoundingClientRect()
        setDimensions({ width, height })
      }
    }

    // Initial update
    updateDimensions()

    // Set up ResizeObserver for smooth updates
    const resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(updateDimensions)
    })

    if (contentRef.current) {
      resizeObserver.observe(contentRef.current)
    }

    // Cleanup
    return () => {
      if (contentRef.current) {
        resizeObserver.unobserve(contentRef.current)
      }
      resizeObserver.disconnect()
    }
  }, [])

  // Ensure content fills available space
  useEffect(() => {
    const updateHeight = () => {
      if (tabsRef.current && contentRef.current) {
        const tabsHeight = tabsRef.current.offsetHeight
        contentRef.current.style.height = `calc(100% - ${tabsHeight}px)`
      }
    }

    // Initialize and update on window resize
    updateHeight()
    window.addEventListener('resize', updateHeight)
    return () => window.removeEventListener('resize', updateHeight)
  }, [])

  // Calculate timer size based on available space
  const timerSize = useMemo(() => {
    if (dimensions.width === 0 || dimensions.height === 0) return 0
    const smallerDimension = Math.min(dimensions.width, dimensions.height)
    // Use 65% of the smaller dimension to prevent clipping
    return smallerDimension * 0.65
  }, [dimensions.width, dimensions.height])

  // Determine if we should show icons instead of text
  const showIcons = dimensions.width < 280

  return (
    <div className="h-full w-full flex flex-col bg-transparent isolate min-h-0 min-w-0 overflow-hidden">
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as TimerTab)}
        className="h-full w-full flex flex-col min-h-0 min-w-0"
      >
        <div ref={tabsRef} className="relative z-10 shrink-0">
          <TabsList
            className={cn(
              "grid grid-cols-3 mx-auto mt-1 mb-0.5 transition-all duration-300"
            )}
            style={{
              transformOrigin: 'top center',
              width: "calc(100% - 0.5rem)",
            }}
          >
            <TabsTrigger value="pomodoro" className="text-xs py-1">
              {showIcons ? <Clock className="h-4 w-4" /> : "Pomodoro"}
            </TabsTrigger>
            <TabsTrigger value="stopwatch" className="text-xs py-1">
              {showIcons ? <Timer className="h-4 w-4" /> : "Stopwatch"}
            </TabsTrigger>
            <TabsTrigger value="countdown" className="text-xs py-1">
              {showIcons ? <Zap className="h-4 w-4" /> : "Countdown"}
            </TabsTrigger>
          </TabsList>
        </div>

        <div 
          ref={contentRef}
          className="relative z-0 flex-1 min-h-0 overflow-hidden"
        >
          <TabsContent
            value="pomodoro"
            forceMount
            className={cn(
              "w-full h-full m-0",
              "data-[state=active]:flex data-[state=inactive]:hidden",
              "justify-center items-center"
            )}
          >
            <UnifiedTimer config={TIMER_CONFIGS.pomodoro} size={timerSize} />
          </TabsContent>

          <TabsContent
            value="stopwatch"
            forceMount
            className={cn(
              "w-full h-full m-0",
              "data-[state=active]:flex data-[state=inactive]:hidden",
              "justify-center items-center"
            )}
          >
            <UnifiedTimer config={TIMER_CONFIGS.stopwatch} size={timerSize} />
          </TabsContent>

          <TabsContent
            value="countdown"
            forceMount
            className={cn(
              "w-full h-full m-0",
              "data-[state=active]:flex data-[state=inactive]:hidden",
              "justify-center items-center"
            )}
          >
            <UnifiedTimer config={TIMER_CONFIGS.countdown} size={timerSize} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}