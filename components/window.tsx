"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Minus, X, Maximize2, Minimize2, GripHorizontal, GripVertical, Grip } from "lucide-react"
import { useWindows, type WindowType } from "@/hooks/use-windows"
import { useMobile } from "@/hooks/use-mobile"

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

export function Window({
  title,
  icon,
  type,
  children,
  defaultWidth = 400,
  defaultHeight = 500,
  minWidth = 300,
  minHeight = 200,
}: WindowProps) {
  const { windows, closeWindow, toggleMaximize, focusWindow } = useWindows()
  
  // Memoize the updatePosition function to prevent unnecessary effect re-runs
  const updatePosition = useCallback((type: WindowType, position: { x: number; y: number; width?: number; height?: number }) => {
    useWindows.getState().updatePosition(type, position)
  }, [])
  const windowState = windows[type]
  const isMobile = useMobile()

  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [resizeDirection, setResizeDirection] = useState<null | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw'>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [initialPos, setInitialPos] = useState({ x: 0, y: 0 })
  const [initialSize, setInitialSize] = useState({ width: 0, height: 0 })

  const windowRef = useRef<HTMLDivElement>(null)

  // Animate window appearance
  // Handle mounting and unmounting with animation
  const [isMounted, setIsMounted] = useState(false)
  
  useEffect(() => {
    setIsMounted(true)
    const timer = setTimeout(() => setIsVisible(true), 50)
    return () => {
      clearTimeout(timer)
      setIsMounted(false)
    }
  }, [])

  // Set initial position if not already set
  useEffect(() => {
    if (!windowState.position.width) {
      updatePosition(type, {
        ...windowState.position,
        width: defaultWidth,
        height: defaultHeight,
      })
    }
  }, [])

  // Handle window resizing
  useEffect(() => {
    if (isMobile || windowState.isMaximized || !resizeDirection) return
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return
      
      const deltaX = e.clientX - dragStart.x
      const deltaY = e.clientY - dragStart.y
      
      let newX = initialPos.x
      let newY = initialPos.y
      let newWidth = initialSize.width
      let newHeight = initialSize.height
      
      // Handle resizing from different directions
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
      
      // Constrain to viewport
      const maxX = window.innerWidth - newWidth
      const maxY = window.innerHeight - newHeight
      newX = Math.max(0, Math.min(maxX, newX))
      newY = Math.max(0, Math.min(maxY, newY))
      
      updatePosition(type, { 
        x: newX, 
        y: newY, 
        width: newWidth, 
        height: newHeight 
      })
    }
    
    const handleMouseUp = () => {
      setIsResizing(false)
      setResizeDirection(null)
    }
    
    // Add event listeners when resizing starts
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove, { passive: true })
      document.addEventListener('mouseup', handleMouseUp, { passive: true })
      document.body.style.userSelect = 'none'
      
      // Cleanup function
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        document.body.style.userSelect = ''
      }
    }
    
    // No cleanup needed if not resizing
    return undefined
  }, [isResizing, resizeDirection, dragStart, initialPos, initialSize, minWidth, type, isMobile, windowState.isMaximized])
  
  // Simple, smooth drag handling
  useEffect(() => {
    if (isMobile || windowState.isMaximized || isResizing) return
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return
      
      const deltaX = e.clientX - dragStart.x
      const deltaY = e.clientY - dragStart.y

      // Get current window dimensions
      const width = windowState.position.width || defaultWidth;
      const height = Math.max(getMinHeight(), windowState.position.height || defaultHeight);
      const maxX = window.innerWidth - width;
      const maxY = window.innerHeight - height;
      const newX = Math.max(0, Math.min(maxX, initialPos.x + deltaX));
      const newY = Math.max(0, Math.min(maxY, initialPos.y + deltaY));

      updatePosition(type, { x: newX, y: newY });
    }

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false)
      }
    }

    // Add event listeners when dragging starts
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove, { passive: true })
      document.addEventListener('mouseup', handleMouseUp, { passive: true })
      document.body.style.userSelect = 'none'
      
      // Cleanup function
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        document.body.style.userSelect = ''
      }
    }
    
    // No cleanup needed if not dragging
    return undefined
  }, [isDragging, dragStart.x, dragStart.y, initialPos.x, initialPos.y, type, isMobile, windowState.isMaximized, isResizing])

  // Adjust minimum heights for specific window types
  const getMinHeight = () => {
    switch (type) {
      case "calendar":
        return 450
      case "timer":
        return 400
      default:
        return minHeight
    }
  }

  const handleResizeStart = (e: React.MouseEvent, direction: 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw') => {
    if (windowState.isMaximized || isMobile) return
    e.preventDefault()
    e.stopPropagation()
    
    // Focus this window
    focusWindow(type)
    
    setDragStart({ x: e.clientX, y: e.clientY })
    setInitialPos({ x: windowState.position.x, y: windowState.position.y })
    setInitialSize({ 
      width: windowState.position.width || defaultWidth, 
      height: windowState.position.height || defaultHeight 
    })
    setResizeDirection(direction)
    setIsResizing(true)
  }

  const handleDragStart = (e: React.MouseEvent) => {
    if (windowState.isMaximized || isMobile || isResizing) return
    e.preventDefault()

    // Focus this window
    focusWindow(type)

    setDragStart({ x: e.clientX, y: e.clientY })
    setInitialPos({ x: windowState.position.x, y: windowState.position.y })
    setIsDragging(true)
  }

  const handleWindowClick = () => {
    focusWindow(type)
  }

  const handleClose = useCallback(() => {
    // Don't proceed if already closing
    if (!isVisible || !isMounted) return
    
    setIsVisible(false)
    const timer = setTimeout(() => {
      if (isMounted) {
        closeWindow(type)
      }
    }, 200)
    
    return () => clearTimeout(timer)
  }, [isVisible, isMounted, closeWindow, type])

  // Calculate styles based on window state
  const getWindowStyles = () => {
    if (isMobile) {
      return {
        width: "100%",
        height: "100%",
        top: 0,
        left: 0,
        transform: "none",
        zIndex: 20 + (windowState.zIndex || 0),
      }
    }

    if (windowState.isMaximized) {
      return {
        width: "calc(100% - 40px)",
        height: "calc(100% - 140px)",
        top: "60px",
        left: "20px",
        transform: "none",
        zIndex: 20 + (windowState.zIndex || 0),
      }
    }

    return {
      width: `${windowState.position.width || defaultWidth}px`,
      height: `${Math.max(getMinHeight(), windowState.position.height || defaultHeight)}px`,
      top: `${windowState.position.y}px`,
      left: `${windowState.position.x}px`,
      transform: isVisible ? "scale(1)" : "scale(0.95)",
      zIndex: 20 + (windowState.zIndex || 0),
    }
  }

  const windowStyles = getWindowStyles()
  
  // Debug log window styles and state
  useEffect(() => {
    console.log(`Window [${type}] rendered with styles:`, {
      ...windowStyles,
      isVisible,
      isDragging,
      isMaximized: windowState.isMaximized
    })
  }, [windowStyles, isVisible, isDragging, windowState.isMaximized, type])

  return (
    <div
      ref={windowRef}
      className={`fixed shadow-2xl transition-all duration-300 ease-out ${
        isVisible ? "opacity-100" : "opacity-0"
      } ${isDragging ? "cursor-grabbing" : ""} ${
        isResizing ? 'select-none' : ''
      }`}
      style={{
        ...windowStyles,
        pointerEvents: 'auto',
        transform: windowStyles.transform || 'none',
        zIndex: windowStyles.zIndex || 1000,
        boxSizing: 'border-box',
        isolation: 'isolate',
        resize: 'none',
        overflow: 'hidden',
        minWidth: `${minWidth}px`,
        minHeight: `${getMinHeight()}px`,
      }}
      data-window-type={type}
      data-visible={isVisible}
      onClick={handleWindowClick}
    >
      <Card className="w-full h-full flex flex-col"
        style={{
          backgroundColor: `rgba(24,24,28, var(--window-bg-opacity, 0.85))`,
          backdropFilter: 'blur(24px)',
        }}
      >
        <CardHeader
          className={`flex flex-row items-center justify-between space-y-0 py-3 px-4 border-b border-gray-700/50 transition-colors duration-200 ${
            isDragging ? "bg-gray-800/50" : "hover:bg-gray-800/30"
          } ${isDragging ? "cursor-grabbing" : "cursor-move"}`}
          onMouseDown={handleDragStart}
        >
          <div className="flex items-center gap-2">
            <div className="transition-transform duration-200 hover:scale-110">{icon}</div>
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-gray-400 hover:text-white hover:bg-gray-700/50 transition-all duration-200 hover:scale-110"
              onClick={() => closeWindow(type)}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-gray-400 hover:text-white hover:bg-gray-700/50 transition-all duration-200 hover:scale-110"
              onClick={() => toggleMaximize(type)}
            >
              {windowState.isMaximized ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 hover:scale-110"
              onClick={handleClose}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-0 overflow-hidden">{children}</CardContent>
        
        {/* Resize handles */}
        {!windowState.isMaximized && !isMobile && (
          <>
            {/* Top */}
            <div 
              className="absolute top-0 left-0 right-0 h-2 cursor-ns-resize"
              onMouseDown={(e) => handleResizeStart(e, 'n')}
            />
            
            {/* Top Right */}
            <div 
              className="absolute top-0 right-0 w-3 h-3 cursor-nesw-resize"
              onMouseDown={(e) => handleResizeStart(e, 'ne')}
            />
            
            {/* Right */}
            <div 
              className="absolute top-0 right-0 bottom-0 w-2 cursor-ew-resize"
              onMouseDown={(e) => handleResizeStart(e, 'e')}
            />
            
            {/* Bottom Right */}
            <div 
              className="absolute bottom-0 right-0 w-3 h-3 cursor-nwse-resize"
              onMouseDown={(e) => handleResizeStart(e, 'se')}
            />
            
            {/* Bottom */}
            <div 
              className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize"
              onMouseDown={(e) => handleResizeStart(e, 's')}
            />
            
            {/* Bottom Left */}
            <div 
              className="absolute bottom-0 left-0 w-3 h-3 cursor-nesw-resize"
              onMouseDown={(e) => handleResizeStart(e, 'sw')}
            />
            
            {/* Left */}
            <div 
              className="absolute top-0 left-0 bottom-0 w-2 cursor-ew-resize"
              onMouseDown={(e) => handleResizeStart(e, 'w')}
            />
            
            {/* Top Left */}
            <div 
              className="absolute top-0 left-0 w-3 h-3 cursor-nwse-resize"
              onMouseDown={(e) => handleResizeStart(e, 'nw')}
            />
            
            {/* Bottom right resize handle (larger area) */}
            <div 
              className="absolute bottom-1 right-1 w-4 h-4 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
              onMouseDown={(e) => handleResizeStart(e, 'se')}
            >
              <Grip className="w-3 h-3 transform rotate-45" />
            </div>
          </>
        )}
      </Card>
    </div>
  )
}
