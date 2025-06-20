"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

export type WindowType = "tasks" | "notes" | "timer" | "calendar" | "settings" | "playlist"

interface WindowPosition {
  x: number
  y: number
  width?: number
  height?: number
}

interface WindowState {
  isOpen: boolean
  position: WindowPosition
  isMaximized: boolean
  zIndex: number
}

interface WindowsStore {
  windows: Record<WindowType, WindowState>
  maxZIndex: number
  openWindow: (type: WindowType) => void
  closeWindow: (type: WindowType) => void
  toggleWindow: (type: WindowType) => void
  updatePosition: (type: WindowType, position: WindowPosition) => void
  toggleMaximize: (type: WindowType) => void
  focusWindow: (type: WindowType) => void
}

// Better initial positioning to avoid bottom bar
const getInitialPosition = (type: WindowType) => {
  const baseY = 80
  const positions = {
    tasks: { x: 50, y: baseY, width: 320, height: 400 },
    notes: { x: 100, y: baseY + 30, width: 380, height: 450 },
    timer: { x: 150, y: baseY + 60, width: 400, height: 350 },
    calendar: { x: 200, y: baseY + 90, width: 350, height: 450 },
    settings: { x: 250, y: baseY + 120, width: 400, height: 450 },
    playlist: { x: 300, y: baseY + 150, width: 450, height: 500 },
  }
  return positions[type]
}

// Debug function to log window state changes
const logWindowState = (action: string, type: string, state: any) => {
  console.log(`[Window State] ${action} ${type}:`, {
    isOpen: state.windows[type].isOpen,
    zIndex: state.windows[type].zIndex,
    maxZIndex: state.maxZIndex
  })
}

export const useWindows = create<WindowsStore>()(
  persist(
    (set, get) => ({
      windows: {
        tasks: {
          isOpen: false,
          position: getInitialPosition("tasks"),
          isMaximized: false,
          zIndex: 0,
        },
        notes: {
          isOpen: false,
          position: getInitialPosition("notes"),
          isMaximized: false,
          zIndex: 0,
        },
        timer: {
          isOpen: false,
          position: getInitialPosition("timer"),
          isMaximized: false,
          zIndex: 0,
        },
        calendar: {
          isOpen: false,
          position: getInitialPosition("calendar"),
          isMaximized: false,
          zIndex: 0,
        },
        settings: {
          isOpen: false,
          position: getInitialPosition("settings"),
          isMaximized: false,
          zIndex: 0,
        },
        playlist: {
          isOpen: false,
          position: getInitialPosition("playlist"),
          isMaximized: false,
          zIndex: 0,
        },
      },
      maxZIndex: 0,
      openWindow: (type) =>
        set((state) => {
          const newZIndex = state.maxZIndex + 1
          const newState = {
            windows: {
              ...state.windows,
              [type]: {
                ...state.windows[type],
                isOpen: true,
                zIndex: newZIndex,
              },
            },
            maxZIndex: newZIndex,
          }
          logWindowState('openWindow', type, newState)
          return newState
        }),
      closeWindow: (type) =>
        set((state) => {
          const newState = {
            windows: {
              ...state.windows,
              [type]: {
                ...state.windows[type],
                isOpen: false,
              },
            },
          }
          logWindowState('closeWindow', type, newState)
          return newState
        }),
      toggleWindow: (type) =>
        set((state) => {
          console.log(`Toggling window ${type}, current state:`, state.windows[type])
          const isCurrentlyOpen = state.windows[type].isOpen
          let newState
          
          if (!isCurrentlyOpen) {
            const newZIndex = state.maxZIndex + 1
            newState = {
              windows: {
                ...state.windows,
                [type]: {
                  ...state.windows[type],
                  isOpen: true,
                  zIndex: newZIndex,
                },
              },
              maxZIndex: newZIndex,
            }
            console.log(`Opening window ${type} with z-index ${newZIndex}`)
          } else {
            newState = {
              windows: {
                ...state.windows,
                [type]: {
                  ...state.windows[type],
                  isOpen: false,
                },
              },
              maxZIndex: state.maxZIndex
            }
            console.log(`Closing window ${type}`)
          }
          
          logWindowState(`toggleWindow (${isCurrentlyOpen ? 'close' : 'open'})`, type, newState)
          return newState
        }),
      updatePosition: (type, position) =>
        set((state) => ({
          windows: {
            ...state.windows,
            [type]: {
              ...state.windows[type],
              position: {
                ...state.windows[type].position,
                ...position,
              },
            },
          },
        })),
      toggleMaximize: (type) =>
        set((state) => ({
          windows: {
            ...state.windows,
            [type]: {
              ...state.windows[type],
              isMaximized: !state.windows[type].isMaximized,
            },
          },
        })),
      focusWindow: (type) =>
        set((state) => {
          const newZIndex = state.maxZIndex + 1
          return {
            windows: {
              ...state.windows,
              [type]: {
                ...state.windows[type],
                zIndex: newZIndex,
              },
            },
            maxZIndex: newZIndex,
          }
        }),
    }),
    {
      name: "lofizen-windows",
    },
  ),
)
