"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Play, Pause, RotateCcw, Flag, Clock } from "lucide-react"

interface StopwatchTimerProps {
  scale?: number;
  isSmall?: boolean;
}

export function StopwatchTimer({ scale = 1, isSmall = false }: StopwatchTimerProps) {
  const [time, setTime] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [laps, setLaps] = useState<number[]>([])
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTime((prevTime) => prevTime + 10) // Update every 10ms
      }, 10)
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning])

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60000)
    const seconds = Math.floor((time % 60000) / 1000)
    const milliseconds = Math.floor((time % 1000) / 10)
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}.${milliseconds
      .toString()
      .padStart(2, "0")}`
  }

  const handleStart = () => {
    setIsRunning(true)
  }

  const handlePause = () => {
    setIsRunning(false)
  }

  const handleReset = () => {
    setIsRunning(false)
    setTime(0)
    setLaps([])
  }

  const handleLap = () => {
    setLaps((prevLaps) => [...prevLaps, time])
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
      sessionType: {
        fontSize: `${fontSize * 0.6}rem`,
        fontWeight: 500,
        textTransform: 'uppercase' as const,
        letterSpacing: '0.05em',
        marginBottom: `${padding * 0.5}rem`,
        color: 'rgba(255, 255, 255, 0.7)',
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
      millisecondsDisplay: {
        fontSize: `${fontSize * 0.5}rem`,
        opacity: 0.8,
        marginLeft: '0.2em',
      },
      // Consistent button sizes based on scale
      buttonSize: Math.round(32 * scale),
      iconButtonSize: Math.round(24 * scale),
    };
  }, [scale]);

  const isCompact = isSmall;

  return (
    <div className="h-full w-full flex flex-col items-center justify-center p-1 text-white">
      <div 
        className="w-full max-w-full flex flex-col items-center transition-all duration-300"
        style={getDynamicStyles.container}
      >
        {/* Session Type with Icon */}
        <div className="flex flex-col items-center space-y-1 mb-2">
          <div 
            className="uppercase tracking-wider text-gray-400 transition-all duration-200"
            style={getDynamicStyles.sessionType}
          >
            STOPWATCH
          </div>
          <div className="p-1 rounded-full bg-gray-800/50">
            <Clock className="h-3 w-3 text-white" />
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
              stroke="#FF6B6B"
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 45}`}
              strokeDashoffset={laps.length > 0 ? `${2 * Math.PI * 45 * (1 - ((time - laps[laps.length - 1]) / 10000))}` : '0'}
              className="transition-all duration-1000 ease-linear"
            />
          </svg>
          
          {/* Time Display */}
          <div 
            className="relative z-10 font-mono font-light text-center"
            style={getDynamicStyles.timeDisplay}
          >
            {formatTime(time).split('.')[0]}
            <span 
              className="opacity-80"
              style={getDynamicStyles.millisecondsDisplay}
            >
              .{formatTime(time).split('.')[1]}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center space-x-2 sm:space-x-3 mt-2 mb-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleReset}
            className="text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-all duration-200"
            style={{
              width: getDynamicStyles.buttonSize,
              height: getDynamicStyles.buttonSize,
              minWidth: getDynamicStyles.buttonSize,
            }}
          >
            <RotateCcw className="h-3 w-3" />
          </Button>

          <Button
            onClick={isRunning ? handlePause : handleStart}
            className="rounded-full bg-gradient-to-br from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 transition-all duration-200"
            style={{
              width: `${Number(getDynamicStyles.buttonSize) * 1.25}px`,
              height: `${Number(getDynamicStyles.buttonSize) * 1.25}px`,
              minWidth: `${Number(getDynamicStyles.buttonSize) * 1.25}px`,
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
            onClick={handleLap}
            disabled={!isRunning}
            className="text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-all duration-200 disabled:opacity-30 disabled:pointer-events-none"
            style={{
              width: getDynamicStyles.buttonSize,
              height: getDynamicStyles.buttonSize,
              minWidth: getDynamicStyles.buttonSize,
            }}
          >
            <Flag className="h-3 w-3" />
          </Button>
        </div>

        {/* Laps - Hidden in compact mode */}
        {!isCompact && laps.length > 0 && (
          <div className="w-full max-h-32 overflow-y-auto">
            <div className="space-y-2 px-2">
              {laps
                .slice()
                .reverse()
                .map((lapTime, index) => (
                  <div
                    key={laps.length - index}
                    className="flex justify-between items-center text-xs py-1.5 px-3 rounded bg-gray-800/50"
                  >
                    <span className="text-gray-300">Lap {laps.length - index}</span>
                    <span className="text-white font-mono">{formatTime(lapTime)}</span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
