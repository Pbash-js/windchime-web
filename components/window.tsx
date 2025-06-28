"use client"

import React, { useState, useEffect, useRef, useCallback, useMemo, ReactElement } from "react"
import { cn } from "@/lib/utils"
import { Minus, X, Maximize2, Minimize2, Grip } from "lucide-react"
import { useWindows, type WindowType } from "@/hooks/use-windows"
import { useMobile } from "@/hooks/use-mobile"
import { usePreferences } from "@/contexts/preferences-context"
import { useWindowPositions } from "@/hooks/use-windows"

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

type IconProps = {
  className?: string;
  size?: number;
  [key:string]: any;
};

type IconElement = ReactElement<IconProps>;

const HEADER_HEIGHT = 36;

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
  // Hooks and State
  const windowState = useWindows((state) => state.windows[type]);
  const { closeWindow, toggleMaximize, focusWindow } = useWindows();
  const { positions, updatePosition } = useWindowPositions();
  const windowPosition = positions[type] || { x: 100, y: 100, width: defaultWidth, height: defaultHeight };
  const preferences = usePreferences();
  const isMobile = useMobile();

  // Refs for direct DOM manipulation (performance optimization)
  const windowRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const dragInfoRef = useRef({ 
    isDragging: false, 
    isResizing: false,
    startX: 0, 
    startY: 0,
    initialX: 0,
    initialY: 0,
    initialWidth: 0,
    initialHeight: 0,
    rafId: 0
  });

  const [isVisible, setIsVisible] = useState(false);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const headerTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => { 
    setIsVisible(true); 
  }, []);

  // Auto-hide header functionality
  const showHeader = useCallback(() => {
    setIsHeaderVisible(true);
    if (headerTimeoutRef.current) {
      clearTimeout(headerTimeoutRef.current);
    }
    headerTimeoutRef.current = setTimeout(() => {
      setIsHeaderVisible(false);
    }, 3000);
  }, []);

  const hideHeader = useCallback(() => {
    if (headerTimeoutRef.current) {
      clearTimeout(headerTimeoutRef.current);
    }
    setIsHeaderVisible(false);
  }, []);

  const keepHeaderVisible = useCallback(() => {
    if (headerTimeoutRef.current) {
      clearTimeout(headerTimeoutRef.current);
    }
    setIsHeaderVisible(true);
  }, []);

  // Show header on mouse enter, hide after delay
  useEffect(() => {
    const windowEl = windowRef.current;
    if (!windowEl) return;

    const handleMouseEnter = () => showHeader();
    const handleMouseLeave = () => {
      if (headerTimeoutRef.current) {
        clearTimeout(headerTimeoutRef.current);
      }
      headerTimeoutRef.current = setTimeout(() => {
        setIsHeaderVisible(false);
      }, 1000);
    };

    windowEl.addEventListener('mouseenter', handleMouseEnter);
    windowEl.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      windowEl.removeEventListener('mouseenter', handleMouseEnter);
      windowEl.removeEventListener('mouseleave', handleMouseLeave);
      if (headerTimeoutRef.current) {
        clearTimeout(headerTimeoutRef.current);
      }
    };
  }, [showHeader]);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => closeWindow(type), 200);
  }, [closeWindow, type]);

  const mergedStyles = useMemo(() => ({
    ...preferences.windowStyles,
    windowBgBlur: preferences.windowStyles?.windowBgBlur ?? 5,
    windowBgColor: preferences.windowStyles?.windowBgColor ?? '24,24,28',
    windowBgOpacity: preferences.windowStyles?.windowBgOpacity ?? 0.85,
    windowBorderRadius: preferences.windowStyles?.windowBorderRadius ?? 8,
  }), [preferences.windowStyles]);

  const textColorClass = useMemo(() => {
    const rgbMatch = mergedStyles.windowBgColor.match(/(\d+),\s*(\d+),\s*(\d+)/);
    if (!rgbMatch) return 'text-white/90';
    const [_, r, g, b] = rgbMatch.map(Number);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.6 ? 'text-gray-900/90' : 'text-white/90';
  }, [mergedStyles.windowBgColor]);
  
  const blurValue = useMemo(() => (mergedStyles.windowBgBlur > 0 ? `blur(${mergedStyles.windowBgBlur}px)` : 'none'), [mergedStyles.windowBgBlur]);

  const handleFocus = useCallback(() => {
    if (dragInfoRef.current.isDragging || dragInfoRef.current.isResizing) return;
    focusWindow(type);
  }, [focusWindow, type]);

  // Optimized drag with direct DOM manipulation
  const handleDragStart = useCallback((e: React.MouseEvent) => {
    if (isMobile || windowState?.isMaximized) return;
    e.preventDefault();
    e.stopPropagation();
    focusWindow(type);
    keepHeaderVisible(); // Keep header visible during drag
    
    const windowEl = windowRef.current;
    if (!windowEl) return;

    dragInfoRef.current = {
      ...dragInfoRef.current,
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      initialX: windowPosition.x,
      initialY: windowPosition.y
    };

    // Disable transitions during drag for performance
    windowEl.style.transition = 'none';
    windowEl.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragInfoRef.current.isDragging || !windowEl) return;
      
      // Cancel any pending animation frame
      if (dragInfoRef.current.rafId) {
        cancelAnimationFrame(dragInfoRef.current.rafId);
      }

      // Use requestAnimationFrame for smooth updates
      dragInfoRef.current.rafId = requestAnimationFrame(() => {
        const newX = dragInfoRef.current.initialX + (e.clientX - dragInfoRef.current.startX);
        const newY = dragInfoRef.current.initialY + (e.clientY - dragInfoRef.current.startY);
        
        windowEl.style.left = `${newX}px`;
        windowEl.style.top = `${newY}px`;
      });
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (!windowEl) return;
      
      dragInfoRef.current.isDragging = false;
      
      // Cancel any pending animation frame
      if (dragInfoRef.current.rafId) {
        cancelAnimationFrame(dragInfoRef.current.rafId);
        dragInfoRef.current.rafId = 0;
      }

      // Calculate final position and update state
      const finalX = dragInfoRef.current.initialX + (e.clientX - dragInfoRef.current.startX);
      const finalY = dragInfoRef.current.initialY + (e.clientY - dragInfoRef.current.startY);
      
      // Re-enable transitions after a frame to prevent bounce
      requestAnimationFrame(() => {
        if (windowEl) {
          windowEl.style.transition = 'opacity 0.3s ease-out, transform 0.3s ease-out';
          windowEl.style.cursor = '';
        }
        document.body.style.userSelect = '';
      });

      // Update position in state
      updatePosition(type, { ...windowPosition, x: finalX, y: finalY });
      
      // Resume auto-hide after drag
      showHeader();
      
      // Cleanup
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [isMobile, windowState?.isMaximized, focusWindow, type, windowPosition, updatePosition, keepHeaderVisible, showHeader]);

  // Optimized resize with direct DOM manipulation
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    focusWindow(type);
    keepHeaderVisible(); // Keep header visible during resize
    
    const windowEl = windowRef.current;
    const bodyEl = bodyRef.current;
    if (!windowEl || !bodyEl) return;

    dragInfoRef.current = {
      ...dragInfoRef.current,
      isResizing: true,
      startX: e.clientX,
      startY: e.clientY,
      initialWidth: windowPosition.width || defaultWidth,
      initialHeight: windowPosition.height || defaultHeight
    };

    // Disable transitions during resize
    windowEl.style.transition = 'none';
    bodyEl.style.transition = 'none';
    document.body.style.userSelect = 'none';

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragInfoRef.current.isResizing || !windowEl || !bodyEl) return;
      
      // Cancel any pending animation frame
      if (dragInfoRef.current.rafId) {
        cancelAnimationFrame(dragInfoRef.current.rafId);
      }

      // Use requestAnimationFrame for smooth updates
      dragInfoRef.current.rafId = requestAnimationFrame(() => {
        const dx = e.clientX - dragInfoRef.current.startX;
        const dy = e.clientY - dragInfoRef.current.startY;
        const newWidth = Math.max(minWidth, dragInfoRef.current.initialWidth + dx);
        const newHeight = Math.max(minHeight, dragInfoRef.current.initialHeight + dy);
        
        windowEl.style.width = `${newWidth}px`;
        windowEl.style.height = `${newHeight + HEADER_HEIGHT}px`;
      });
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (!windowEl || !bodyEl) return;
      
      dragInfoRef.current.isResizing = false;
      
      // Cancel any pending animation frame
      if (dragInfoRef.current.rafId) {
        cancelAnimationFrame(dragInfoRef.current.rafId);
        dragInfoRef.current.rafId = 0;
      }

      // Calculate final size
      const dx = e.clientX - dragInfoRef.current.startX;
      const dy = e.clientY - dragInfoRef.current.startY;
      const finalWidth = Math.max(minWidth, dragInfoRef.current.initialWidth + dx);
      const finalHeight = Math.max(minHeight, dragInfoRef.current.initialHeight + dy);
      
      // Re-enable transitions after a frame
      requestAnimationFrame(() => {
        if (windowEl && bodyEl) {
          windowEl.style.transition = 'opacity 0.3s ease-out, transform 0.3s ease-out';
          bodyEl.style.transition = '';
        }
        document.body.style.userSelect = '';
      });

      // Update size in state
      updatePosition(type, { ...windowPosition, width: finalWidth, height: finalHeight });
      
      // Resume auto-hide after resize
      showHeader();
      
      // Cleanup
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [focusWindow, type, windowPosition, defaultWidth, minWidth, minHeight, updatePosition, keepHeaderVisible, showHeader]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (dragInfoRef.current.rafId) {
        cancelAnimationFrame(dragInfoRef.current.rafId);
      }
      if (headerTimeoutRef.current) {
        clearTimeout(headerTimeoutRef.current);
      }
    };
  }, []);

  if (!windowState?.isOpen) return null;

  const sharedBgStyle = {
    backgroundColor: `rgba(${mergedStyles.windowBgColor}, ${mergedStyles.windowBgOpacity})`,
    backdropFilter: `${blurValue} saturate(180%)`,
    WebkitBackdropFilter: `${blurValue} saturate(180%)`,
  };

  const isMaximized = windowState.isMaximized;
  const currentWidth = windowPosition.width || defaultWidth;
  const currentHeight = windowPosition.height || defaultHeight;

  return (
    <div
      ref={windowRef}
      className={cn('fixed')}
      style={{
        left: isMaximized ? '20px' : `${windowPosition.x}px`,
        top: isMaximized ? '24px' : `${windowPosition.y}px`,
        width: isMaximized ? 'calc(100% - 40px)' : `${currentWidth}px`,
        height: isMaximized ? 'calc(100% - 140px + 36px)' : `${currentHeight + HEADER_HEIGHT}px`,
        zIndex: 10 + (windowState.zIndex || 0),
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'scale(1)' : 'scale(0.95)',
        // Only transition properties that don't conflict with drag/resize
        transition: 'opacity 0.3s ease-out, transform 0.3s ease-out',
        pointerEvents: 'auto',
        willChange: 'transform', // Optimize for animations
      }}
      onMouseDown={handleFocus}
      data-window-type={type}
    >
      <div
        className="window-header absolute flex items-center justify-between px-3"
        style={{
          ...sharedBgStyle,
          top: 0,
          left: 0,
          width: '100%',
          height: `${HEADER_HEIGHT}px`,
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          cursor: 'move',
          opacity: isHeaderVisible ? 1 : 0,
          transform: isHeaderVisible ? 'translateY(0)' : 'translateY(100%)',
          transition: 'opacity 0.15s ease-out, transform 0.3s ease-out',
          pointerEvents: isHeaderVisible ? 'auto' : 'none',
        }}
        onMouseDown={handleDragStart}
        onMouseEnter={keepHeaderVisible}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="transition-transform duration-200 hover:scale-110 flex-shrink-0">
            {React.isValidElement<IconProps>(icon) ? React.cloneElement(icon, {
              className: cn(textColorClass, icon.props?.className || ''), size: 16
            }) : icon}
          </div>
          <div className={`text-sm font-medium truncate ${textColorClass}`}>{title}</div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button 
            onClick={(e) => { e.stopPropagation(); toggleMaximize(type); }} 
            className={`h-6 w-6 flex items-center justify-center rounded-full transition-all duration-200 hover:scale-110 ${textColorClass.includes('white') ? 'text-white/80 hover:bg-white/10' : 'text-gray-700 hover:bg-black/5'}`}
          >
            {isMaximized ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); handleClose(); }} 
            className={`h-6 w-6 flex items-center justify-center rounded-full transition-all duration-200 hover:scale-110 ${textColorClass.includes('white') ? 'text-white/80 hover:bg-white/10' : 'text-gray-700 hover:bg-black/5'}`}
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>
      
      <div
        ref={bodyRef}
        className={cn('absolute w-full', textColorClass)}
        style={{
          top: `${HEADER_HEIGHT}px`,
          left: 0,
          height: `calc(100% - ${HEADER_HEIGHT}px)`,
          borderRadius: `${mergedStyles.windowBorderRadius}px`,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          overflow: 'hidden',
          ...sharedBgStyle
        }}
      >
        <div className="relative w-full h-full overflow-auto">
          {children}
        </div>
      </div>

      {/* Resize grip */}
      {!isMaximized && !isMobile && (
        <div
          className="absolute bottom-0 right-0 w-6 h-6 flex items-end justify-end p-1 text-gray-400 hover:text-white transition-colors cursor-se-resize z-10"
          onMouseDown={handleResizeStart}
        >
          <Grip className="w-3 h-3 transform rotate-45" />
        </div>
      )}
    </div>
  );
});