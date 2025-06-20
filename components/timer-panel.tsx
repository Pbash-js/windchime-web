"use client"

import { useState, useEffect, useRef } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PomodoroTimer } from "@/components/pomodoro-timer"
import { StopwatchTimer } from "@/components/stopwatch-timer"
import { CountdownTimer } from "@/components/countdown-timer"
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

export function TimerPanel() {
  const [activeTab, setActiveTab] = useState<TimerTab>("pomodoro")
  const tabsRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

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

  return (
    <div 
      className="h-full w-full flex flex-col bg-transparent relative isolate"
      style={{
        '--z-base': Z_INDEX.BASE,
        '--z-content': Z_INDEX.CONTENT,
        '--z-tabs': Z_INDEX.TABS,
      } as React.CSSProperties}
    >
      <Tabs 
        value={activeTab} 
        onValueChange={(v) => setActiveTab(v as TimerTab)} 
        className="h-full w-full flex flex-col"
      >
        <div 
          ref={tabsRef}
          className="relative z-[var(--z-tabs)]"
        >
          <TabsList 
            className={cn(
              "grid grid-cols-3 mx-4 mt-4 mb-2 flex-shrink-0",
              "bg-gray-800/50 backdrop-blur-sm border border-gray-700/50"
            )}
          >
            <TabsTrigger 
              value="pomodoro" 
              className="text-xs hover:bg-gray-700/50 data-[state=active]:bg-blue-600/50"
            >
              Pomodoro
            </TabsTrigger>
            <TabsTrigger 
              value="stopwatch" 
              className="text-xs hover:bg-gray-700/50 data-[state=active]:bg-blue-600/50"
            >
              Stopwatch
            </TabsTrigger>
            <TabsTrigger 
              value="countdown" 
              className="text-xs hover:bg-gray-700/50 data-[state=active]:bg-blue-600/50"
            >
              Countdown
            </TabsTrigger>
          </TabsList>
        </div>

        <div 
          ref={contentRef}
          className="relative z-[var(--z-content)] flex-1 overflow-hidden"
        >
          <TabsContent
            value="pomodoro"
            className={cn(
              "h-full w-full m-0 p-4",
              "data-[state=active]:flex data-[state=inactive]:hidden",
              "items-center justify-center"
            )}
            forceMount
          >
            <PomodoroTimer />
          </TabsContent>

          <TabsContent
            value="stopwatch"
            className={cn(
              "h-full w-full m-0 p-4",
              "data-[state=active]:flex data-[state=inactive]:hidden",
              "items-center justify-center"
            )}
            forceMount
          >
            <StopwatchTimer />
          </TabsContent>

          <TabsContent
            value="countdown"
            className={cn(
              "h-full w-full m-0 p-4",
              "data-[state=active]:flex data-[state=inactive]:hidden",
              "items-center justify-center"
            )}
            forceMount
          >
            <CountdownTimer />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
