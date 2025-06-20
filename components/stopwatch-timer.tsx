"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Play, Pause, RotateCcw, Flag } from "lucide-react"

export function StopwatchTimer() {
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

  return (
    <div className="h-full w-full flex flex-col items-center justify-center p-4 text-white">
      {/* Timer Display */}
      <div className="w-full max-w-sm flex flex-col items-center justify-center text-center">
        <div className="text-5xl font-mono font-light mb-6">{formatTime(time)}</div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleReset}
            className="text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-200"
          >
            <RotateCcw className="h-5 w-5" />
          </Button>

          <Button
            size="lg"
            onClick={isRunning ? handlePause : handleStart}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 transition-all duration-200"
          >
            {isRunning ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleLap}
            disabled={!isRunning}
            className="text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-50 transition-all duration-200"
          >
            <Flag className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Laps */}
      {laps.length > 0 && (
        <div className="flex-shrink-0 max-h-32 overflow-y-auto">
          <div className="text-sm text-blue-400 mb-2 text-center font-medium">Laps</div>
          <div className="space-y-1 px-2">
            {laps
              .slice()
              .reverse()
              .map((lapTime, index) => (
                <div
                  key={laps.length - index}
                  className="flex justify-between text-sm py-1 px-2 rounded bg-gray-800/30"
                >
                  <span className="text-gray-300">Lap {laps.length - index}</span>
                  <span className="text-white font-mono">{formatTime(lapTime)}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {laps.length === 0 && (
        <div className="flex-shrink-0 text-center text-gray-500 pb-4">
          <div className="text-sm">Start the timer and press the flag</div>
          <div className="text-xs mt-1">to record lap times</div>
        </div>
      )}
    </div>
  )
}
