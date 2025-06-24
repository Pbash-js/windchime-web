"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import { subscribeWithSelector } from "zustand/middleware"

export type BaseWindowType = "tasks" | "notes" | "timer" | "calendar" | "settings" | "playlist" | "customLinks" | "widgets"
export type WidgetWindowType = `widget-${string}`
export type WindowType = BaseWindowType | WidgetWindowType

export const isWidgetWindow = (type: string): type is WidgetWindowType => {
  return type.startsWith('widget-');
}

export interface WindowPosition {
  x: number
  y: number
  width?: number
  height?: number
}

interface WindowState {
  isOpen: boolean
  isMaximized: boolean
  zIndex: number
}

interface WindowsStore {
  windows: Record<WindowType, WindowState>
  maxZIndex: number
  openWindow: (type: WindowType, position?: WindowPosition) => void
  closeWindow: (type: WindowType) => void
  toggleWindow: (type: WindowType) => void
  toggleMaximize: (type: WindowType) => void
  focusWindow: (type: WindowType) => void
  isWidgetWindow: (type: string) => type is WidgetWindowType
  getNewWidgetPosition: () => WindowPosition
}

// Separate store for positions to avoid unnecessary re-renders
interface PositionStore {
  positions: Record<WindowType, WindowPosition>
  updatePosition: (type: WindowType, position: WindowPosition) => void
}

// Debounce utility
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Position store - updates frequently, separate from main store
export const useWindowPositions = create<PositionStore>()(
  persist(
    subscribeWithSelector((set) => ({
      positions: {
        tasks: { x: 50, y: 50, width: 320, height: 400 },
        notes: { x: 75, y: 75, width: 380, height: 450 },
        timer: { x: 100, y: 100, width: 400, height: 350 },
        calendar: { x: 125, y: 125, width: 350, height: 450 },
        settings: { x: 150, y: 150, width: 400, height: 450 },
        playlist: { x: 175, y: 175, width: 450, height: 500 },
        customLinks: { x: 200, y: 200, width: 400, height: 500 },
        widgets: { x: 225, y: 225, width: 400, height: 500 },
      },
      updatePosition: (type, position) =>
        set((state) => ({
          positions: {
            ...state.positions,
            [type]: { ...state.positions[type], ...position }
          }
        }))
    })),
    {
      name: 'windchime-window-positions',
      // Only persist position data, not the entire state
      partialize: (state) => ({ positions: state.positions })
    }
  )
)

// Helper to get initial position for a window type
const getInitialPosition = (type: WindowType): WindowPosition => {
  if (isWidgetWindow(type)) {
    const widgetWindows = Object.entries(useWindows.getState().windows)
      .filter(([key]) => isWidgetWindow(key))
      .sort((a, b) => a[1].zIndex - b[1].zIndex);
    
    const baseX = 50 + (widgetWindows.length * 20);
    const baseY = 50 + (widgetWindows.length * 20);
    
    return {
      x: Math.min(baseX, typeof window !== 'undefined' ? window.innerWidth - 500 : 500),
      y: Math.min(baseY, typeof window !== 'undefined' ? window.innerHeight - 400 : 400),
      width: 450,
      height: 500
    };
  }
  
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

// Debounced position update
const debouncedUpdatePosition = debounce((type: WindowType, position: WindowPosition) => {
  useWindowPositions.getState().updatePosition(type, position);
}, 16); // ~60fps

// Main windows store
export const useWindows = create<WindowsStore>()(
  persist(
    subscribeWithSelector((set, get) => ({
      isWidgetWindow,
      getNewWidgetPosition: () => {
        return getInitialPosition('widget-123' as WidgetWindowType);
      },
      windows: {
        tasks: { isOpen: false, isMaximized: false, zIndex: 0 },
        widgets: { isOpen: false, isMaximized: false, zIndex: 0 },
        notes: { isOpen: false, isMaximized: false, zIndex: 0 },
        timer: { isOpen: false, isMaximized: false, zIndex: 0 },
        calendar: { isOpen: false, isMaximized: false, zIndex: 0 },
        settings: { isOpen: false, isMaximized: false, zIndex: 0 },
        playlist: { isOpen: false, isMaximized: false, zIndex: 0 },
        customLinks: { isOpen: false, isMaximized: false, zIndex: 0 },
      },
      maxZIndex: 0,
      
      openWindow: (type: WindowType, position?: WindowPosition) => {
        const state = get()
        const existingWindow = state.windows[type]
        
        // Early return if already open and focused
        if (existingWindow?.isOpen && existingWindow.zIndex === state.maxZIndex) {
          return
        }
        
        const newZIndex = state.maxZIndex + 1
        const windowPosition = position || getInitialPosition(type)
        
        // Update position in separate store
        useWindowPositions.getState().updatePosition(type, windowPosition)
        
        set((state) => {
          if (!state.windows[type]) {
            return {
              windows: {
                ...state.windows,
                [type]: {
                  isOpen: true,
                  isMaximized: false,
                  zIndex: newZIndex,
                },
              },
              maxZIndex: newZIndex,
            };
          }

          if (!state.windows[type].isOpen) {
            return {
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
          }

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
        })
      },
      
      closeWindow: (type: WindowType) =>
        set((state) => ({
          windows: {
            ...state.windows,
            [type]: {
              ...state.windows[type],
              isOpen: false,
            },
          },
        })),
        
      toggleWindow: (type) =>
        set((state) => {
          if (!state.windows[type]) {
            const newZIndex = state.maxZIndex + 1;
            // Initialize position
            useWindowPositions.getState().updatePosition(type, getInitialPosition(type));
            return {
              windows: {
                ...state.windows,
                [type]: {
                  isOpen: true,
                  isMaximized: false,
                  zIndex: newZIndex,
                },
              },
              maxZIndex: newZIndex,
            };
          }
          
          const isCurrentlyOpen = state.windows[type].isOpen;
          
          if (!isCurrentlyOpen) {
            const newZIndex = state.maxZIndex + 1;
            return {
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
          } else {
            return {
              windows: {
                ...state.windows,
                [type]: {
                  ...state.windows[type],
                  isOpen: false,
                },
              },
            };
          }
        }),
        
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
        
      // Debounced position update
      updatePosition: debouncedUpdatePosition,
    })),
    {
      name: "windchime-windows",
    },
  ),
)