"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Play, Pause, RotateCcw, Settings } from "lucide-react"
import { Input } from "@/components/ui/input"

export function CountdownTimer() {
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
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
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

  const handleEdit = () => {
    if (isEditing) {
      // Save the new time
      const minutes = Math.max(0, Math.min(99, Number.parseInt(inputMinutes) || 0))
      const seconds = Math.max(0, Math.min(59, Number.parseInt(inputSeconds) || 0))
      const newTime = minutes * 60 + seconds

      if (newTime > 0) {
        setTimeLeft(newTime)
        initialTimeRef.current = newTime
        setInputMinutes(minutes.toString())
        setInputSeconds(seconds.toString())
      }
    } else {
      // Enter edit mode
      const minutes = Math.floor(timeLeft / 60)
      const seconds = timeLeft % 60
      setInputMinutes(minutes.toString())
      setInputSeconds(seconds.toString())
    }

    setIsEditing(!isEditing)
  }

  const getProgress = () => {
    if (initialTimeRef.current === 0) return 0
    return ((initialTimeRef.current - timeLeft) / initialTimeRef.current) * 100
  }

  return (
    <div className="h-full w-full flex flex-col items-center justify-center p-4 text-white">
      <div className="w-full max-w-sm space-y-6">
        {/* Timer Display or Edit Form */}
        {isEditing ? (
          <div className="space-y-4">
            <div className="text-sm text-orange-400 uppercase tracking-wider">Set Timer</div>
            <div className="flex items-center justify-center gap-2">
              <div className="flex flex-col items-center gap-1">
                <Input
                  type="number"
                  value={inputMinutes}
                  onChange={(e) => setInputMinutes(e.target.value)}
                  className="w-16 text-center bg-gray-800/50 border-gray-700 text-white text-lg"
                  min="0"
                  max="99"
                />
                <span className="text-xs text-gray-400">min</span>
              </div>
              <span className="text-2xl text-gray-400 mb-4">:</span>
              <div className="flex flex-col items-center gap-1">
                <Input
                  type="number"
                  value={inputSeconds}
                  onChange={(e) => setInputSeconds(e.target.value)}
                  className="w-16 text-center bg-gray-800/50 border-gray-700 text-white text-lg"
                  min="0"
                  max="59"
                />
                <span className="text-xs text-gray-400">sec</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-sm text-orange-400 uppercase tracking-wider transition-all duration-300">
              Countdown Timer
            </div>
            <div className="relative group">
              <div
                className={`text-5xl font-mono font-light transition-all duration-300 ${
                  isRunning ? "scale-105" : "scale-100"
                } ${timeLeft <= 10 && timeLeft > 0 ? "text-red-400 animate-pulse" : ""}`}
              >
                {formatTime(timeLeft)}
              </div>

              {/* Progress Ring */}
              <svg
                className="absolute inset-0 w-full h-full -rotate-90 transition-all duration-300"
                viewBox="0 0 100 100"
              >
                <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke={timeLeft <= 10 && timeLeft > 0 ? "rgba(239,68,68,0.8)" : "rgba(249,115,22,0.8)"}
                  strokeWidth="2"
                  strokeDasharray={`${2 * Math.PI * 45}`}
                  strokeDashoffset={`${2 * Math.PI * 45 * (1 - getProgress() / 100)}`}
                  className="transition-all duration-1000 ease-linear"
                  style={{
                    filter: isRunning ? "drop-shadow(0 0 8px currentColor)" : "none",
                  }}
                />
              </svg>

              {/* Pulse effect when running */}
              {isRunning && <div className="absolute inset-0 rounded-full animate-pulse bg-orange-500/5" />}
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleReset}
            className="text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-200 hover:scale-110"
          >
            <RotateCcw className="h-5 w-5" />
          </Button>

          {!isEditing && (
            <Button
              size="lg"
              onClick={isRunning ? handlePause : handleStart}
              disabled={timeLeft === 0}
              className="bg-orange-600 hover:bg-orange-700 text-white px-8 transition-all duration-300 hover:scale-105 shadow-lg shadow-orange-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRunning ? (
                <Pause className="h-6 w-6 transition-transform duration-200" />
              ) : (
                <Play className="h-6 w-6 transition-transform duration-200" />
              )}
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={handleEdit}
            className={`hover:bg-white/10 transition-all duration-200 hover:scale-110 ${
              isEditing ? "text-orange-400" : "text-gray-400 hover:text-white"
            }`}
          >
            <Settings className="h-5 w-5" />
          </Button>
        </div>

        {isEditing && (
          <Button
            onClick={handleEdit}
            className="bg-orange-600 hover:bg-orange-700 text-white transition-all duration-200 hover:scale-105"
          >
            Set Timer
          </Button>
        )}

        {timeLeft === 0 && !isEditing && <div className="text-lg text-red-400 animate-bounce">Time's up! 🎉</div>}
      </div>
    </div>
  )
}
