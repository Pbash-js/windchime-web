"use client"

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Minus, X, Maximize2, Minimize2, Grip } from "lucide-react"
import { useWindows, useWindowPositions, type WindowType, type WindowPosition } from "@/hooks/use-windows"
import { useMobile } from "@/hooks/use-mobile"
import { usePreferences } from "@/contexts/preferences-context"

interface WindowProps {
  title: string
  icon?: React.ReactNode
  type: WindowType
  children: React.ReactNode
  defaultWidth?: number
  defaultHeight?: number
  minWidth?: number
  minHeight?: number
}

// Shallow comparison for selectors
function shallow<T>(a: T, b: T): boolean {
  if (a === b) return true
  if (!a || !b) return false
  
  const keysA = Object.keys(a as any)
  const keysB = Object.keys(b as any)
  
  if (keysA.length !== keysB.length) return false
  
  for (const key of keysA) {
    if ((a as any)[key] !== (b as any)[key]) return false
  }
  
  return true
}

export const Window = React.memo(function Window({
  title,
  icon,
  type,
  children,
  defaultWidth = 400,
  defaultHeight = 500,
  minWidth = 300,
  minHeight = 200,
}: WindowProps) {
  // Select window state with type safety and default value
  const windowState = useWindows((state) => state.windows[type] || {
    isOpen: true,
    isMaximized: false,
    zIndex: 0
  })
  
  // Select position with type safety and default value
  const position = useWindowPositions((state) => state.positions[type] || {
    x: 100,
    y: 100,
    width: defaultWidth,
    height: defaultHeight
  })
  
  // Select window actions with stable references
  const closeWindow = useWindows((state) => state.closeWindow)
  const toggleMaximize = useWindows((state) => state.toggleMaximize)
  const focusWindow = useWindows((state) => state.focusWindow)
  
  // Select position update function with stable reference
  const updatePosition = useWindowPositions((state) => state.updatePosition)

  const isMobile = useMobile()
  const { windowStyles } = usePreferences()

  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [resizeDirection, setResizeDirection] = useState<null | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw'>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [isHeaderVisible, setIsHeaderVisible] = useState(false)
  const headerTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [initialPos, setInitialPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [initialSize, setInitialSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 })
  
  // Add temporary position state for smooth dragging
  const [tempPosition, setTempPosition] = useState<{ x: number; y: number } | null>(null)
  const [tempSize, setTempSize] = useState<{ width: number; height: number } | null>(null)

  const windowRef = useRef<HTMLDivElement>(null)
  const dragHandlerRef = useRef<number | undefined>(undefined)

  // Default window styles
  const defaultWindowStyles = {
    headerAutoHide: true,
    headerHideDelay: 2000,
    windowBgOpacity: 0.85,
    windowBgColor: '24,24,28',
    windowBorderRadius: 8,
    windowShadow: '0 8px 30px rgba(0, 0, 0, 0.3)'
  }
  
  const mergedStyles = {
    ...defaultWindowStyles,
    ...(windowStyles || {})
  }

  // Define getMinHeight before it's used in useMemo
  const getMinHeight = useCallback(() => {
    switch (type) {
      case "calendar":
        return 450
      case "timer":
        return 400
      default:
        return minHeight
    }
  }, [type, minHeight])

  // Get current position (temp position during drag/resize, otherwise stored position)
  const currentPosition = useMemo(() => {
    const basePos = position || { x: 100, y: 100, width: defaultWidth, height: defaultHeight }
    return {
      x: tempPosition?.x ?? basePos.x,
      y: tempPosition?.y ?? basePos.y,
      width: tempSize?.width ?? basePos.width ?? defaultWidth,
      height: tempSize?.height ?? basePos.height ?? defaultHeight
    }
  }, [position, tempPosition, tempSize, defaultWidth, defaultHeight])

  // Memoize window styles calculation
  const windowStylesCSS = useMemo(() => {
    if (isMobile) {
      return {
        width: "100%",
        height: "100%",
        top: 0,
        left: 0,
        transform: isVisible ? "scale(1)" : "scale(0.95)",
        zIndex: 20 + (windowState?.zIndex || 0),
      }
    }

    if (windowState?.isMaximized) {
      return {
        width: "calc(100% - 40px)",
        height: "calc(100% - 140px)",
        top: "60px",
        left: "20px",
        transform: isVisible ? "scale(1)" : "scale(0.95)",
        zIndex: 20 + (windowState.zIndex || 0),
      }
    }

    return {
      width: `${currentPosition.width}px`,
      height: `${Math.max(getMinHeight(), currentPosition.height)}px`,
      top: `${currentPosition.y}px`,
      left: `${currentPosition.x}px`,
      transform: isVisible ? "scale(1)" : "scale(0.95)",
      zIndex: 20 + (windowState?.zIndex || 0),
    }
  }, [currentPosition, windowState?.isMaximized, windowState?.zIndex, isMobile, isVisible, getMinHeight])

  // Handle header visibility on hover
  useEffect(() => {
    if (isHovered) {
      setIsHeaderVisible(true)
      if (headerTimeoutRef.current) {
        clearTimeout(headerTimeoutRef.current)
        headerTimeoutRef.current = null
      }
    } else {
      headerTimeoutRef.current = setTimeout(() => {
        setIsHeaderVisible(false)
      }, 300)
    }
    
    return () => {
      if (headerTimeoutRef.current) {
        clearTimeout(headerTimeoutRef.current)
        headerTimeoutRef.current = null
      }
    }
  }, [isHovered])

  // Mount animation
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50)
    return () => clearTimeout(timer)
  }, [])

  // Initialize position if not set
  useEffect(() => {
    if (!position) {
      updatePosition(type, {
        x: 100,
        y: 100,
        width: defaultWidth,
        height: defaultHeight,
      })
    }
  }, [position, type, defaultWidth, defaultHeight, updatePosition])

  // Drag handling - FIXED VERSION
  useEffect(() => {
    if (isMobile || windowState?.isMaximized || isResizing || !isDragging) return
    
    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault()
      const newX = Math.max(0, Math.min(window.innerWidth - currentPosition.width, initialPos.x + (e.clientX - dragStart.x)))
      const newY = Math.max(0, Math.min(window.innerHeight - currentPosition.height, initialPos.y + (e.clientY - dragStart.y)))
      
      // Update temporary position for smooth visual feedback
      setTempPosition({ x: newX, y: newY })
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      document.body.style.cursor = ''
      
      // Commit the temporary position to the store
      if (tempPosition) {
        updatePosition(type, { 
          x: tempPosition.x, 
          y: tempPosition.y,
          width: currentPosition.width,
          height: currentPosition.height
        })
        setTempPosition(null)
      }
    }

    document.addEventListener('mousemove', handleMouseMove, { passive: false })
    document.addEventListener('mouseup', handleMouseUp, { passive: false })
    document.body.style.userSelect = 'none'
    document.body.style.cursor = 'grabbing'
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
    }
  }, [isDragging, dragStart, initialPos, isMobile, windowState?.isMaximized, isResizing, currentPosition, type, updatePosition, tempPosition])

  // Resize handling - FIXED VERSION
  useEffect(() => {
    if (isMobile || windowState?.isMaximized || !resizeDirection || !isResizing) return
    
    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault()
      const deltaX = e.clientX - dragStart.x
      const deltaY = e.clientY - dragStart.y
      
      let newX = initialPos.x
      let newY = initialPos.y
      let newWidth = initialSize.width
      let newHeight = initialSize.height
      
      if (resizeDirection.includes('e')) {
        newWidth = Math.max(minWidth, initialSize.width + deltaX)
      }
      if (resizeDirection.includes('s')) {
        newHeight = Math.max(getMinHeight(), initialSize.height + deltaY)
      }
      if (resizeDirection.includes('w')) {
        const newWidthValue = Math.max(minWidth, initialSize.width - deltaX)
        newX = initialPos.x + (initialSize.width - newWidthValue)
        newWidth = newWidthValue
      }
      if (resizeDirection.includes('n')) {
        const newHeightValue = Math.max(getMinHeight(), initialSize.height - deltaY)
        newY = initialPos.y + (initialSize.height - newHeightValue)
        newHeight = newHeightValue
      }
      
      const maxX = window.innerWidth - newWidth
      const maxY = window.innerHeight - newHeight
      newX = Math.max(0, Math.min(maxX, newX))
      newY = Math.max(0, Math.min(maxY, newY))
      
      // Update temporary position and size for smooth visual feedback
      setTempPosition({ x: newX, y: newY })
      setTempSize({ width: newWidth, height: newHeight })
    }
    
    const handleMouseUp = () => {
      setIsResizing(false)
      setResizeDirection(null)
      document.body.style.cursor = ''
      
      // Commit the temporary position and size to the store
      if (tempPosition && tempSize) {
        updatePosition(type, { 
          x: tempPosition.x, 
          y: tempPosition.y, 
          width: tempSize.width, 
          height: tempSize.height 
        })
        setTempPosition(null)
        setTempSize(null)
      }
    }
    
    document.addEventListener('mousemove', handleMouseMove, { passive: false })
    document.addEventListener('mouseup', handleMouseUp, { passive: false })
    document.body.style.userSelect = 'none'
    
    // Set appropriate cursor based on resize direction
    const cursorMap: Record<string, string> = {
      'n': 'ns-resize',
      'e': 'ew-resize',
      's': 'ns-resize',
      'w': 'ew-resize',
      'ne': 'nesw-resize',
      'nw': 'nwse-resize',
      'se': 'nwse-resize',
      'sw': 'nesw-resize'
    }
    document.body.style.cursor = cursorMap[resizeDirection] || 'default'
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
    }
  }, [isResizing, resizeDirection, dragStart, initialPos, initialSize, minWidth, type, isMobile, windowState?.isMaximized, getMinHeight, updatePosition, tempPosition, tempSize])

  const handleResizeStart = useCallback((e: React.MouseEvent, direction: 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw') => {
    if (windowState?.isMaximized || isMobile) return
    e.preventDefault()
    e.stopPropagation()
    
    focusWindow(type)
    
    setDragStart({ 
      x: e.clientX, 
      y: e.clientY 
    })
    setInitialPos({ 
      x: currentPosition.x, 
      y: currentPosition.y 
    })
    setInitialSize({ 
      width: currentPosition.width, 
      height: currentPosition.height 
    })
    setResizeDirection(direction)
    setIsResizing(true)
  }, [windowState?.isMaximized, isMobile, focusWindow, type, currentPosition])

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    if (isMobile || windowState?.isMaximized) return
    
    focusWindow(type)
    setIsDragging(true)
    setDragStart({ 
      x: e.clientX, 
      y: e.clientY 
    })
    setInitialPos({ 
      x: currentPosition.x, 
      y: currentPosition.y 
    })
  }, [isMobile, windowState?.isMaximized, currentPosition, type, focusWindow])

  const handleWindowClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    focusWindow(type)
  }, [focusWindow, type])

  const handleClose = useCallback(() => {
    if (!isVisible) return
    
    setIsVisible(false)
    setTimeout(() => {
      closeWindow(type)
    }, 200)
  }, [isVisible, closeWindow, type])

  // Only render if window is open or not yet initialized
  if (windowState?.isOpen === false) return null

  return (
    <>
      {/* Header - Separate from the window to avoid overflow issues */}
      <div
        className="window-header"
        style={{
          position: 'fixed',
          left: windowState.isMaximized ? '0' : `${currentPosition.x}px`,
          right: windowState.isMaximized ? '0' : 'auto',
          top: windowState.isMaximized ? '0' : `${currentPosition.y - 36}px`,
          height: '36px',
          width: windowState.isMaximized ? '100%' : `${currentPosition.width}px`,
          zIndex: -30 + (windowState?.zIndex + 50 || 0),
          pointerEvents: isHeaderVisible ? 'auto' : 'none',
          opacity: isHeaderVisible ? 1 : 0,
          transition: 'opacity 150ms ease, transform 150ms ease',
          transform: isHeaderVisible ? 'translateY(0)' : 'translateY(36px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 12px',
          backgroundColor: `rgba(${mergedStyles.windowBgColor}, ${mergedStyles.windowBgOpacity})`,
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          // borderTopLeftRadius: '8px',
          // borderTopRightRadius: '8px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          cursor: isDragging ? 'grabbing' : 'move'
        }}
        onMouseDown={handleDragStart}
        onMouseEnter={() => {
          setIsHovered(true)
          setIsHeaderVisible(true)
        }}
        onMouseLeave={() => {
          setIsHovered(false)
        }}
      >
        <div className="flex items-center gap-2">
          <div className="transition-transform duration-200 hover:scale-110">{icon}</div>
          <div className="text-sm font-medium text-gray-100 truncate">{title}</div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation()
              closeWindow(type)
            }}
            className="h-6 w-6 flex items-center justify-center text-gray-300/80 hover:text-white hover:bg-gray-700/50 rounded transition-all duration-200 hover:scale-110"
            aria-label="Minimize window"
          >
            <Minus className="h-3 w-3" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              toggleMaximize(type)
            }}
            className="h-6 w-6 flex items-center justify-center text-gray-300/80 hover:text-white hover:bg-gray-700/50 rounded transition-all duration-200 hover:scale-110"
            aria-label={windowState.isMaximized ? 'Restore window' : 'Maximize window'}
          >
            {windowState.isMaximized ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleClose()
            }}
            className="h-6 w-6 flex items-center justify-center text-gray-300/80 hover:text-red-400 hover:bg-red-500/10 rounded transition-all duration-200 hover:scale-110"
            aria-label="Close window"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Window Content */}
      <div
        ref={windowRef}
        className={cn(
          'fixed flex flex-col bg-transparent shadow-lg',
          windowState.isMaximized ? 'inset-0 m-0 rounded-none' : 'rounded-lg',
          isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none',
          isDragging ? 'cursor-grabbing' : '',
          isResizing ? 'select-none' : ''
        )}
        style={{
          ...windowStylesCSS,
          boxSizing: 'border-box',
          isolation: 'isolate',
          minWidth: `${minWidth}px`,
          minHeight: `${getMinHeight()}px`,
          borderRadius: `${mergedStyles.windowBorderRadius}px`,
          boxShadow: mergedStyles.windowShadow,
          pointerEvents: 'auto',
          willChange: isDragging || isResizing ? 'transform' : 'auto',
          contain: 'layout style paint',
          overflow: 'hidden',
          backgroundColor: `rgba(${mergedStyles.windowBgColor}, ${mergedStyles.windowBgOpacity})`,
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}
        onClick={handleWindowClick}
        onMouseEnter={() => {
          setIsHovered(true)
          setIsHeaderVisible(true)
        }}
        onMouseLeave={() => {
          setIsHovered(false)
        }}
        data-window-type={type}
        data-visible={isVisible}
      >
        {/* Content */}
        <div className="relative w-full h-full overflow-auto">
          {children}
        </div>
      </div>
      
      {/* Resize handle */}
      {!windowState.isMaximized && !isMobile && (
        <div
          className="fixed w-4 h-4 flex items-center justify-center text-gray-400 hover:text-white transition-colors cursor-se-resize"
          style={{
            left: `${currentPosition.x + currentPosition.width - 20}px`,
            top: `${currentPosition.y + currentPosition.height - 20}px`,
            zIndex: 100 + (windowState?.zIndex || 0),
            pointerEvents: 'auto',
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
            handleResizeStart(e, 'se');
          }}
        >
          <Grip className="w-3 h-3 transform rotate-45" />
        </div>
      )}
    </>
  );
})