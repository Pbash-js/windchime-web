import { useState, useEffect } from "react"

type ViewMode = "list" | "gallery"

export function useViewMode(initialMode: ViewMode = "list") {
  const [viewMode, setViewMode] = useState<ViewMode>(initialMode)
  const [isFullScreen, setIsFullScreen] = useState(false)

  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement)
    }

    // Check initial fullscreen state
    handleFullScreenChange()

    // Listen for fullscreen changes
    document.addEventListener('fullscreenchange', handleFullScreenChange)
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullScreenChange)
    }
  }, [])

  const toggleViewMode = () => {
    // Only allow switching to gallery mode when in fullscreen
    const newMode = viewMode === 'list' && isFullScreen ? 'gallery' : 'list'
    setViewMode(newMode)
    localStorage.setItem('viewMode', newMode)
  }

  // Only show gallery toggle when in fullscreen
  const canUseGallery = isFullScreen
  
  // Ensure we're not in gallery mode when exiting fullscreen
  useEffect(() => {
    if (!isFullScreen && viewMode === 'gallery') {
      setViewMode('list')
      localStorage.setItem('viewMode', 'list')
    }
  }, [isFullScreen, viewMode])

  return {
    viewMode: canUseGallery ? viewMode : 'list',
    isFullScreen,
    toggleViewMode: canUseGallery ? toggleViewMode : () => {},
    showGalleryToggle: isFullScreen
  }
}
