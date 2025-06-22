"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Minus, X, Maximize2, Minimize2, Grip } from "lucide-react"
import { useWindows, type WindowType } from "@/hooks/use-windows"
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
  const [isHovered, setIsHovered] = useState(false)
  const [isHeaderVisible, setIsHeaderVisible] = useState(true)
  const [headerTimeout, setHeaderTimeout] = useState<NodeJS.Timeout | null>(null)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [initialPos, setInitialPos] = useState({ x: 0, y: 0 })
  const [initialSize, setInitialSize] = useState({ width: 0, height: 0 })

  const windowRef = useRef<HTMLDivElement>(null)

  // Define the window styles type
  type WindowStyles = {
    headerAutoHide: boolean;
    headerHideDelay: number;
    windowBgOpacity: number;
    windowBgColor: string;
    windowBorderRadius: number;
    windowShadow: string;
  };

  // Get window styles from preferences with proper typing
  const { windowStyles } = usePreferences()
  
  // Define default window styles
  const defaultWindowStyles: WindowStyles = {
    headerAutoHide: false,
    headerHideDelay: 2000,
    windowBgOpacity: 0.85,
    windowBgColor: '24,24,28',
    windowBorderRadius: 8,
    windowShadow: '0 8px 30px rgba(0, 0, 0, 0.3)'
  }
  
  // Merge with default styles and ensure all properties are defined
  const mergedStyles: WindowStyles = {
    ...defaultWindowStyles,
    ...(windowStyles || {})
  } as WindowStyles
  
  // Apply window styles as CSS variables
  useEffect(() => {
    document.documentElement.style.setProperty('--window-bg-opacity', mergedStyles.windowBgOpacity.toString());
    document.documentElement.style.setProperty('--window-bg-color', mergedStyles.windowBgColor);
    document.documentElement.style.setProperty('--window-border-radius', `${mergedStyles.windowBorderRadius}px`);
    document.documentElement.style.setProperty('--window-shadow', mergedStyles.windowShadow);
  }, [mergedStyles])

  // Handle header visibility based on hover and preferences
  useEffect(() => {
    // Clear any existing timeouts when dependencies change
    const currentTimeout = headerTimeout;
    
    if (!mergedStyles.headerAutoHide) {
      setIsHeaderVisible(true)
      return
    }
    
    if (isHovered) {
      setIsHeaderVisible(true)
      if (currentTimeout) clearTimeout(currentTimeout)
    } else {
      const timer = setTimeout(() => {
        setIsHeaderVisible(false)
      }, mergedStyles.headerHideDelay)
      setHeaderTimeout(timer)
    }
    
    return () => {
      if (currentTimeout) clearTimeout(currentTimeout)
    }
  }, [isHovered, mergedStyles.headerAutoHide, mergedStyles.headerHideDelay])

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
    // Update CSS variables for global use
    document.documentElement.style.setProperty('--window-bg-opacity', mergedStyles.windowBgOpacity.toString());
    document.documentElement.style.setProperty('--window-bg-color', mergedStyles.windowBgColor);
    document.documentElement.style.setProperty('--window-border-radius', `${mergedStyles.windowBorderRadius}px`);
    document.documentElement.style.setProperty('--window-shadow', mergedStyles.windowShadow);
    
    const baseStyles = {
      '--window-bg-opacity': mergedStyles.windowBgOpacity,
      '--window-bg-color': mergedStyles.windowBgColor,
      '--window-border-radius': `${mergedStyles.windowBorderRadius}px`,
      '--window-shadow': mergedStyles.windowShadow,
    }

    if (isMobile) {
      return {
        ...baseStyles,
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
        ...baseStyles,
        width: "calc(100% - 40px)",
        height: "calc(100% - 140px)",
        top: "60px",
        left: "20px",
        transform: "none",
        zIndex: 20 + (windowState.zIndex || 0),
      }
    }

    return {
      ...baseStyles,
      width: `${windowState.position.width || defaultWidth}px`,
      height: `${Math.max(getMinHeight(), windowState.position.height || defaultHeight)}px`,
      top: `${windowState.position.y}px`,
      left: `${windowState.position.x}px`,
      transform: isVisible ? "scale(1)" : "scale(0.95)",
      zIndex: 20 + (windowState.zIndex || 0),
    }
  }

  const windowPositionStyles = getWindowStyles()
  
  // Memoize the computed styles to prevent unnecessary updates
  const computedStyles = useMemo(() => ({
    bgColor: windowStyles?.windowBgColor || '24,24,28',
    bgOpacity: windowStyles?.windowBgOpacity || 0.85,
    borderRadius: windowStyles?.windowBorderRadius || 8,
    shadow: windowStyles?.windowShadow || '0 8px 30px rgba(0, 0, 0, 0.3)'
  }), [
    windowStyles?.windowBgColor,
    windowStyles?.windowBgOpacity,
    windowStyles?.windowBorderRadius,
    windowStyles?.windowShadow
  ]);
  
  // Apply window styles when they change
  useEffect(() => {
    if (!windowRef.current) return;
    const { bgColor, bgOpacity, borderRadius, shadow } = computedStyles;
    const windowElement = windowRef.current;

    // Only update styles if they've actually changed
    const currentBg = windowElement.style.getPropertyValue('--window-bg-color');
    if (currentBg !== bgColor) {
      windowElement.style.setProperty('--window-bg-color', bgColor);

      // Update card and header backgrounds
      const card = windowElement.querySelector('.window-card');
      const header = windowElement.querySelector('.window-header');

      if (card instanceof HTMLElement) {
        card.style.backgroundColor = `rgba(${bgColor}, ${bgOpacity})`;
      }

      if (header instanceof HTMLElement) {
        header.style.backgroundColor = `rgba(${bgColor}, ${Math.min(bgOpacity + 0.1, 1)})`;
      }
    }

    // Update other styles
    windowElement.style.setProperty('--window-bg-opacity', bgOpacity.toString());
    windowElement.style.setProperty('--window-border-radius', `${borderRadius}px`);
    windowElement.style.setProperty('--window-shadow', shadow);
  }, [computedStyles]);

  return (
    <div
      ref={windowRef}
      className={cn(
        "fixed flex flex-col bg-transparent rounded-lg shadow-lg overflow-visible", // allow header to overflow
        windowState.isMaximized ? "inset-0 m-0 rounded-none" : "",
        isVisible ? "opacity-100" : "opacity-0 pointer-events-none",
        isDragging ? "cursor-grabbing" : "",
        isResizing ? 'select-none' : ''
      )}
      style={{
        ...windowPositionStyles,
        transform: (windowPositionStyles.transform || 'none') + (isDragging ? ' scale(1.02)' : ' scale(1)'),
        zIndex: windowPositionStyles.zIndex || 1000,
        boxSizing: 'border-box',
        isolation: 'isolate',
        resize: 'none',
        overflow: 'visible', // allow header to overflow above
        minWidth: `${minWidth}px`,
        minHeight: `${getMinHeight()}px`,
        borderRadius: `var(--window-border-radius, 8px)`,
        boxShadow: `var(--window-shadow, 0 8px 30px rgba(0, 0, 0, 0.3))`,
        pointerEvents: 'auto',
        width: windowState.isMaximized ? '100%' : `${windowState.position.width || defaultWidth}px`,
        height: windowState.isMaximized ? '100%' : `${Math.max(getMinHeight(), windowState.position.height || defaultHeight)}px`
      }}
      onClick={handleWindowClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      data-window-type={type}
      data-visible={isVisible}
    >
      {/* Header absolutely positioned above the window, outside its bounding box */}
      <div
        className="window-header absolute left-0 right-0 z-20"
        style={{
          bottom: '101%', // sits directly above the window panel
          marginBottom: '0px',
          pointerEvents: isHeaderVisible ? 'auto' : 'none',
          borderRadius: computedStyles.borderRadius,
          boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
          transform: isHeaderVisible ? 'translateY(0)' : 'translateY(8px)', // slight offset when hidden
          opacity: isHeaderVisible ? 1 : 0,
          transition: 'transform 200ms ease, opacity 200ms ease',
        }}
      >
        <CardHeader
          className={`flex flex-row items-center justify-between space-y-0 py-2 px-4 border-b border-gray-700/30 transition-colors duration-200 ${
            isDragging ? "bg-gray-800/50" : "hover:bg-gray-800/30"
          } ${isDragging ? "cursor-grabbing" : "cursor-move"}`}
          style={{
            backgroundColor: `rgba(${computedStyles.bgColor}, ${Math.min(computedStyles.bgOpacity + 0.1, 1)})`,
            backdropFilter: 'blur(24px)',
            position: 'relative',
            zIndex: 10,
            transition: 'background-color 300ms ease-in-out',
            borderRadius: computedStyles.borderRadius,
          }}
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
              className="h-6 w-6 text-gray-300/80 hover:text-white hover:bg-gray-700/50 transition-all duration-200 hover:scale-110"
              onClick={() => closeWindow(type)}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-gray-300/80 hover:text-white hover:bg-gray-700/50 transition-all duration-200 hover:scale-110"
              onClick={() => toggleMaximize(type)}
            >
              {windowState.isMaximized ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-gray-300/80 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 hover:scale-110"
              onClick={handleClose}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </CardHeader>
      </div>
      {/* Main window panel: rounded, shadowed */}
      <div
        className="relative w-full h-full"
        style={{
          height: '100%',
          minHeight: '100%',
          overflow: 'hidden',
          borderRadius: `${computedStyles.borderRadius}px`,
          boxShadow: computedStyles.shadow,
        }}
      >
        <Card
          className="w-full h-full flex flex-col border-0"
          style={{
            backgroundColor: `rgba(${computedStyles.bgColor}, ${computedStyles.bgOpacity})`,
            backdropFilter: 'blur(24px)',
            borderRadius: `${computedStyles.borderRadius}px`,
            border: 'none',
            outline: 'none',
            position: 'relative',
            overflow: 'hidden',
            height: '100%',
            transition: 'background-color 300ms ease-in-out, border-radius 300ms ease-in-out',
            paddingTop: 0 // no header space inside panel
          }}
        >
          <CardContent
            className="flex-1 p-0 overflow-hidden"
            style={{
              height: '100%',
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {children}
          </CardContent>
          {/* Resize handles */}
          {!windowState.isMaximized && !isMobile && (
            <>
              {/* Bottom right resize handle */}
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
    </div>
  );
}

