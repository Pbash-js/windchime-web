"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"

export function CalendarWindow() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [showEventForm, setShowEventForm] = useState(false)
  const [eventTitle, setEventTitle] = useState("")
  const [eventTime, setEventTime] = useState("09:00")
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [events, setEvents] = useState([
    {
      id: 1,
      text: "Team Meeting",
      start: "2024-01-15T09:00:00",
      end: "2024-01-15T10:00:00",
      backColor: "#3b82f6",
    },
    {
      id: 2,
      text: "Focus Session",
      start: "2024-01-15T14:00:00",
      end: "2024-01-15T15:30:00",
      backColor: "#10b981",
    },
  ])

  const handleAddEvent = () => {
    if (eventTitle.trim()) {
      const newEvent = {
        id: Date.now(),
        text: eventTitle,
        start: `${selectedDate.toISOString().split("T")[0]}T${eventTime}:00`,
        end: `${selectedDate.toISOString().split("T")[0]}T${eventTime}:00`,
        backColor: "#3b82f6",
      }
      setEvents([...events, newEvent])
      setEventTitle("")
      setShowEventForm(false)
    }
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    })
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }

    return days
  }

  const navigateMonth = (direction: number) => {
    const newMonth = new Date(currentMonth)
    newMonth.setMonth(currentMonth.getMonth() + direction)
    setCurrentMonth(newMonth)
  }

  const todaysEvents = events.filter((event) => event.start.startsWith(selectedDate.toISOString().split("T")[0]))

  return (
    <div className="h-full flex flex-col text-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 flex-shrink-0 border-b border-gray-700/50">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-4 w-4 text-blue-400" />
          <h2 className="text-sm font-semibold">Calendar</h2>
        </div>
        <Button
          size="sm"
          onClick={() => setShowEventForm(!showEventForm)}
          className="bg-blue-600 hover:bg-blue-700 transition-all duration-200 h-6 px-2 text-xs"
        >
          <Plus className="h-3 w-3 mr-1" />
          Add
        </Button>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden min-h-0">
        {/* Calendar Navigation */}
        <div className="p-3 flex-shrink-0">
          <div className="flex items-center justify-between bg-gray-800/50 rounded-lg p-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateMonth(-1)}
              className="h-6 w-6 p-0 text-gray-400 hover:text-white"
            >
              <ChevronLeft className="h-3 w-3" />
            </Button>
            <h3 className="text-sm font-semibold text-blue-400">{formatDate(currentMonth)}</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateMonth(1)}
              className="h-6 w-6 p-0 text-gray-400 hover:text-white"
            >
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Calendar Grid - Increased minimum height */}
        <div className="flex-1 px-3 overflow-hidden min-h-[240px]">
          <div className="bg-gray-800/30 rounded-lg p-2 h-full flex flex-col">
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-2 flex-shrink-0">
              {["S", "M", "T", "W", "T", "F", "S"].map((day) => (
                <div key={day} className="text-center text-xs font-medium text-gray-400 py-1">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar days - Ensure proper grid sizing */}
            <div className="grid grid-cols-7 gap-1 flex-1 min-h-[180px]">
              {getDaysInMonth(currentMonth).map((date, i) => {
                if (!date) {
                  return <div key={i} className="min-h-[24px]" />
                }

                const isToday = date.toDateString() === new Date().toDateString()
                const isSelected = date.toDateString() === selectedDate.toDateString()

                return (
                  <button
                    key={i}
                    onClick={() => setSelectedDate(date)}
                    className={`min-h-[24px] rounded text-xs transition-all duration-200 hover:bg-gray-700/50 flex items-center justify-center ${
                      isToday
                        ? "bg-blue-600 text-white font-semibold"
                        : isSelected
                          ? "bg-gray-600 text-white"
                          : "text-gray-300 hover:text-white"
                    }`}
                  >
                    {date.getDate()}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Events Section */}
        <div className="p-3 flex-shrink-0">
          <div className="bg-gray-800/30 rounded-lg p-2">
            <h4 className="text-xs font-medium text-gray-400 mb-2">
              {selectedDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })} Events
            </h4>
            <div className="space-y-1 max-h-16 overflow-y-auto">
              {todaysEvents.map((event) => (
                <div key={event.id} className="flex items-center gap-2 p-1 bg-gray-700/50 rounded text-xs">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: event.backColor }} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-white truncate">{event.text}</div>
                  </div>
                  <div className="text-gray-400 text-xs">
                    {new Date(event.start).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              ))}
              {todaysEvents.length === 0 && (
                <div className="text-center py-2 text-gray-500 text-xs">No events scheduled</div>
              )}
            </div>
          </div>
        </div>

        {/* Add Event Form */}
        {showEventForm && (
          <div className="p-3 flex-shrink-0 border-t border-gray-700/50">
            <div className="bg-gray-800/50 rounded-lg p-2 space-y-2">
              <Input
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                placeholder="Event title..."
                className="bg-gray-700 border-gray-600 text-white text-xs h-6"
              />
              <div className="flex gap-2">
                <Input
                  type="time"
                  value={eventTime}
                  onChange={(e) => setEventTime(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white text-xs h-6"
                />
                <Button onClick={handleAddEvent} size="sm" className="bg-blue-600 hover:bg-blue-700 h-6 px-3 text-xs">
                  Add
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
