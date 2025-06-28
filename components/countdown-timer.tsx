"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Play, Pause, RotateCcw, Clock } from "lucide-react"
import { Input } from "@/components/ui/input"

interface CountdownTimerProps {
  scale?: number;
  isSmall?: boolean;
  isCompact?: boolean;
}

export function CountdownTimer({ scale = 1, isSmall = false, isCompact: propIsCompact }: CountdownTimerProps = {}) {
  const isCompact = propIsCompact ?? isSmall; // Use prop if provided, otherwise fall back to isSmall
  const [timeLeft, setTimeLeft] = useState(300) // 5 minutes default
  const [isRunning, setIsRunning] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [inputMinutes, setInputMinutes] = useState("5")
  const [inputSeconds, setInputSeconds] = useState("0")
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const initialTimeRef = useRef(300)

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            setIsRunning(false)
            console.log("Countdown completed!")
            return 0
          }
          return prevTime - 1
        })
      }, 1000)
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning, timeLeft])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return {
      minutes: mins.toString().padStart(2, "0"),
      seconds: secs.toString().padStart(2, "0"),
      full: `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
    }
  }

  const handleStart = () => {
    if (timeLeft > 0) {
      setIsRunning(true)
    }
  }

  const handlePause = () => {
    setIsRunning(false)
  }

  const handleReset = () => {
    setIsRunning(false)
    setTimeLeft(initialTimeRef.current)
  }

  const handleSetTime = () => {
    const minutes = Math.max(0, Math.min(99, Number.parseInt(inputMinutes) || 0))
    const seconds = Math.max(0, Math.min(59, Number.parseInt(inputSeconds) || 0))
    const newTime = minutes * 60 + seconds

    if (newTime > 0) {
      setTimeLeft(newTime)
      initialTimeRef.current = newTime
      setInputMinutes(minutes.toString())
      setInputSeconds(seconds.toString())
    }
    setIsEditing(false)
  }

  const handleEdit = () => {
    handleSetTime()
  }

  const getProgress = () => {
    if (initialTimeRef.current === 0) return 0
    return ((initialTimeRef.current - timeLeft) / initialTimeRef.current) * 100
  }

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
      timeDisplay: {
        fontSize: `${fontSize * 1.5}rem`,
        fontWeight: 300,
        lineHeight: 1,
        textAlign: 'center' as const,
        transition: 'font-size 0.2s ease-out',
        marginBottom: `${padding * 0.5}rem`,
      },
      label: {
        fontSize: `${fontSize * 0.7}rem`,
        fontWeight: 500,
        textTransform: 'uppercase' as const,
        letterSpacing: '0.05em',
        marginBottom: `${padding}rem`,
        color: 'rgba(255, 255, 255, 0.7)',
      },
      // Consistent button sizes based on scale
      buttonSize: Math.round(40 * scale),
      iconSize: Math.round(20 * scale),
    };
  }, [scale]);

  return (
    <div className="h-full w-full flex flex-col items-center justify-center p-1 text-white">
      <div 
        className="w-full space-y-1 sm:space-y-2 flex flex-col items-center"
        style={getDynamicStyles.container}
      >
        {isEditing ? (
          <div className="space-y-2 w-full">
            <div className="text-center">
              <div 
                className="uppercase tracking-wider text-gray-400 mb-1"
                style={getDynamicStyles.label}
              >
                Set Countdown
              </div>
              <div className="flex items-center justify-center space-x-2">
                <div className="flex-1">
                  <label className="block text-[10px] text-gray-400 mb-0.5">Minutes</label>
                  <Input
                    type="number"
                    min="0"
                    max="99"
                    value={inputMinutes}
                    onChange={(e) => setInputMinutes(e.target.value)}
                    className="text-center bg-gray-800/50 border-gray-700 text-white h-7 text-xs"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-[10px] text-gray-400 mb-0.5">Seconds</label>
                  <Input
                    type="number"
                    min="0"
                    max="59"
                    value={inputSeconds}
                    onChange={(e) => setInputSeconds(e.target.value)}
                    className="text-center bg-gray-800/50 border-gray-700 text-white h-7 text-xs"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-center space-x-2">
              <Button
                onClick={handleEdit}
                className="bg-blue-600 hover:bg-blue-700 text-white flex-1 h-7 text-xs"
              >
                Set Time
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsEditing(false)}
                className="flex-1 h-7 text-xs"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="text-center">
              <div 
                className="uppercase tracking-wider text-gray-400 mb-1"
                style={getDynamicStyles.label}
              >
                Countdown
              </div>
              <div 
                className="relative flex items-center justify-center mx-auto mb-2"
                style={{
                  width: `${getDynamicStyles.buttonSize * 3.5}px`,
                  height: `${getDynamicStyles.buttonSize * 3.5}px`,
                }}
              >
                {/* Progress Ring */}
                <svg 
                  className="absolute inset-0 w-full h-full -rotate-90 transition-all duration-300"
                  viewBox="0 0 100 100"
                  style={{
                    transform: `scale(${Math.min(scale, 1.2)})`,
                    transformOrigin: 'center',
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
                    stroke="#4CAF50"
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
                  {formatTime(timeLeft).full}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center space-x-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleReset}
                className="text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-all duration-200"
                style={{
                  width: `${getDynamicStyles.buttonSize}px`,
                  height: `${getDynamicStyles.buttonSize}px`,
                  minWidth: `${getDynamicStyles.buttonSize}px`,
                }}
              >
                <RotateCcw className="h-3 w-3" />
              </Button>
              
              <Button
                onClick={isRunning ? handlePause : handleStart}
                className="rounded-full bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 transition-all duration-200"
                style={{
                  width: `${getDynamicStyles.buttonSize * 1.25}px`,
                  height: `${getDynamicStyles.buttonSize * 1.25}px`,
                  minWidth: `${getDynamicStyles.buttonSize * 1.25}px`,
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
                onClick={() => setIsEditing(true)}
                className="text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-all duration-200"
                style={{
                  width: `${getDynamicStyles.buttonSize}px`,
                  height: `${getDynamicStyles.buttonSize}px`,
                  minWidth: `${getDynamicStyles.buttonSize}px`,
                }}
              >
                <Clock className="h-3 w-3" />
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
