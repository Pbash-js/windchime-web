"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

export type BaseWindowType = "tasks" | "notes" | "timer" | "calendar" | "settings" | "playlist" | "customLinks" | "widgets"
export type WidgetWindowType = `widget-${string}`
export type WindowType = BaseWindowType | WidgetWindowType

export const isWidgetWindow = (type: string): type is WidgetWindowType => {
  return type.startsWith('widget-');
}

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
  openWindow: (type: WindowType, position?: WindowPosition) => void
  closeWindow: (type: WindowType) => void
  toggleWindow: (type: WindowType) => void
  updatePosition: (type: WindowType, position: WindowPosition) => void
  toggleMaximize: (type: WindowType) => void
  focusWindow: (type: WindowType) => void
  isWidgetWindow: (type: string) => type is WidgetWindowType
  getNewWidgetPosition: () => WindowPosition
}

// Helper to get initial position for a window type
const getInitialPosition = (type: WindowType): WindowPosition => {
  // For widget windows, use a staggered position
  if (isWidgetWindow(type)) {
    const widgetWindows = Object.entries(useWindows.getState().windows)
      .filter(([key]) => isWidgetWindow(key))
      .sort((a, b) => a[1].zIndex - b[1].zIndex);
    
    const baseX = 50 + (widgetWindows.length * 20);
    const baseY = 50 + (widgetWindows.length * 20);
    
    return {
      x: Math.min(baseX, window.innerWidth - 500),
      y: Math.min(baseY, window.innerHeight - 400),
      width: 450,
      height: 500
    };
  }
  
  // For regular windows, use predefined positions
  const positions: Record<BaseWindowType, WindowPosition> = {
    tasks: { x: 50, y: 50, width: 320, height: 400 },
    notes: { x: 75, y: 75, width: 380, height: 450 },
    timer: { x: 100, y: 100, width: 400, height: 350 },
    calendar: { x: 125, y: 125, width: 350, height: 450 },
    settings: { x: 150, y: 150, width: 400, height: 450 },
    playlist: { x: 175, y: 175, width: 450, height: 500 },
    customLinks: { x: 200, y: 200, width: 400, height: 500 },
    widgets: { x: 225, y: 225, width: 400, height: 500 },
  };
  
  return positions[type as BaseWindowType] || { x: 100, y: 100, width: 450, height: 500 };
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
      isWidgetWindow,
      getNewWidgetPosition: () => {
        return getInitialPosition('widget-123' as WidgetWindowType);
      },
      windows: {
        tasks: {
          isOpen: false,
          position: getInitialPosition("tasks"),
          isMaximized: false,
          zIndex: 0,
        },
        widgets: {
          isOpen: false,
          position: getInitialPosition("widgets"),
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
        customLinks: {
          isOpen: false,
          position: getInitialPosition("customLinks"),
          isMaximized: false,
          zIndex: 0,
        },
      },
      maxZIndex: 0,
      openWindow: (type: WindowType, position?: WindowPosition) =>
        set((state) => {
          const newZIndex = state.maxZIndex + 1;
          const windowPosition = position || getInitialPosition(type);
          
          // If window doesn't exist, create it with default position
          if (!state.windows[type]) {
            return {
              windows: {
                ...state.windows,
                [type]: {
                  isOpen: true,
                  position: windowPosition,
                  isMaximized: false,
                  zIndex: newZIndex,
                },
              },
              maxZIndex: newZIndex,
            };
          }

          // If window exists but is closed, open it and bring to front
          if (!state.windows[type].isOpen) {
            return {
              windows: {
                ...state.windows,
                [type]: {
                  ...state.windows[type],
                  isOpen: true,
                  position: windowPosition,
                  zIndex: newZIndex,
                },
              },
              maxZIndex: newZIndex,
            };
          }

          // If window is already open, just bring to front
          return {
            windows: {
              ...state.windows,
              [type]: {
                ...state.windows[type],
                zIndex: newZIndex,
              },
            },
            maxZIndex: newZIndex,
          };
        }),
      closeWindow: (type: WindowType) =>
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
          console.log(`Toggling window ${type}, current state:`, state.windows[type]);
          
          // If window doesn't exist in state, initialize it as closed
          if (!state.windows[type]) {
            const newZIndex = state.maxZIndex + 1;
            const newState = {
              windows: {
                ...state.windows,
                [type]: {
                  isOpen: true,
                  position: getInitialPosition(type as BaseWindowType),
                  isMaximized: false,
                  zIndex: newZIndex,
                },
              },
              maxZIndex: newZIndex,
            };
            console.log(`Initializing and opening window ${type} with z-index ${newZIndex}`);
            return newState;
          }
          
          const isCurrentlyOpen = state.windows[type].isOpen;
          let newState;
          
          if (!isCurrentlyOpen) {
            const newZIndex = state.maxZIndex + 1;
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
            };
            console.log(`Opening window ${type} with z-index ${newZIndex}`);
          } else {
            newState = {
              windows: {
                ...state.windows,
                [type]: {
                  ...state.windows[type],
                  isOpen: false,
                },
              },
              maxZIndex: state.maxZIndex,
            };
            console.log(`Closing window ${type}`);
          }
          
          logWindowState(`toggleWindow (${!state.windows[type]?.isOpen ? 'open' : 'close'})`, type, newState);
          return newState;
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
      name: "windchime-windows",
    },
  ),
)
