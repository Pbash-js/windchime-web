"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  Heart,
  List,
  FileText,
  Link,
  Crown,
  Clock,
  CheckSquare,
  Timer,
  Settings,
  Calendar,
  Music,
  VolumeX,
  Shuffle,
  ShuffleIcon as ShuffleOff,
} from "lucide-react"
import { useWindows } from "@/hooks/use-windows"
import { useYouTubePlayer } from "@/hooks/use-youtube-player"
import { useToast } from "@/hooks/use-toast"
import { EnhancedUserProfile } from "@/components/enhanced-user-profile"

interface MediaControlsProps {
  currentTime?: Date
}

export function MediaControls({ currentTime }: MediaControlsProps) {
  // Local state for the clock
  const [localTime, setLocalTime] = useState<Date>(() => currentTime || new Date());

  useEffect(() => {
    // Update every second
    const interval = setInterval(() => {
      setLocalTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const [isExpanded, setIsExpanded] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const [lastActivity, setLastActivity] = useState(Date.now())
  const { toggleWindow, windows } = useWindows()
  const { toast } = useToast()
  const {
    isPlaying,
    volume,
    currentTrack,
    isMuted,
    isFavorite,
    isShuffleEnabled,
    isPlayerReady,
    togglePlay,
    setVolume,
    nextTrack,
    previousTrack,
    toggleMute,
    toggleFavorite,
    toggleShuffle,
    getTrackProgress,
    getTrackTimeRemaining,
  } = useYouTubePlayer()

  const timeoutRef = useRef<NodeJS.Timeout>()
  const controlsRef = useRef<HTMLDivElement>(null)

  // Activity detection for dynamic expansion
  useEffect(() => {
    const handleActivity = () => {
      setLastActivity(Date.now())
      if (!isExpanded) {
        setIsExpanded(true)
      }
    }

    const handleMouseMove = (e: MouseEvent) => {
      // Expand when mouse is near bottom of screen
      if (e.clientY > window.innerHeight - 150) {
        handleActivity()
      }
    }

    const handleMouseLeave = () => {
      if (!isHovering) {
        setIsExpanded(false)
      }
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("keydown", handleActivity)
    document.addEventListener("click", handleActivity)
    document.addEventListener("mouseleave", handleMouseLeave)

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("keydown", handleActivity)
      document.removeEventListener("click", handleActivity)
      document.removeEventListener("mouseleave", handleMouseLeave)
    }
  }, [isExpanded, isHovering])

  // Auto-collapse after inactivity
  useEffect(() => {
    if (!isExpanded) return
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      if (Date.now() - lastActivity > 3000 && !isHovering) {
        setIsExpanded(false)
      }
    }, 3000)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [lastActivity, isExpanded, isHovering])

  const formatTime = (date: Date) => {
    if (!date) return '--:--'
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0])
  }

  const handleOpenSettings = () => {
    toggleWindow("settings")
  }

  const handleOpenPlaylist = () => {
    toggleWindow("playlist")
  }

  const getCurrentTrackDisplay = () => {
    if (!currentTrack) return "No track selected"
    return `${currentTrack.title} - ${currentTrack.artist}`
  }

  // Animation variants for framer-motion
  const containerVariants = {
    collapsed: {
      y: 100,
      opacity: 0,
      transition: { duration: 0.3, ease: "easeInOut" }
    },
    expanded: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.3, ease: "easeInOut" }
    },
    mini: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.3, ease: "easeInOut" }
    }
  }

  const miniPlayerVariants = {
    collapsed: { 
      x: 0,
      opacity: 1,
      transition: { duration: 0.3, ease: "easeInOut" }
    },
    expanded: { 
      x: -50,
      opacity: 0,
      transition: { duration: 0.2, ease: "easeInOut" }
    }
  }

  const timeWidgetVariants = {
    collapsed: { 
      x: 0,
      opacity: 1,
      transition: { duration: 0.3, ease: "easeInOut" }
    },
    expanded: { 
      x: 50,
      opacity: 0,
      transition: { duration: 0.2, ease: "easeInOut" }
    }
  }

  return (
    <>
      {/* Hidden YouTube Player */}
      <div id="youtube-player" style={{ display: "none" }} />

      {/* Persistent Mini Widgets */}
      <div 
        className={`fixed bottom-4 right-4 z-30 transition-all duration-300 ease-in-out ${
          isExpanded ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
      >
        <div className="flex items-center gap-3">
          {/* Mini Music Player */}
          <motion.div 
            className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-xl p-3 shadow-lg cursor-pointer"
            onClick={() => setIsExpanded(true)}
            initial="collapsed"
            animate={isExpanded ? "expanded" : "collapsed"}
            variants={miniPlayerVariants}
          >
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation()
                  togglePlay()
                }}
                disabled={!isPlayerReady}
                className="text-white hover:bg-white/10 h-8 w-8 disabled:opacity-50"
              >
                {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
              </Button>
              <div className="text-xs text-white/80 max-w-32 truncate">
                {isPlayerReady ? getCurrentTrackDisplay() : "Loading..."}
              </div>
            </div>
            {isPlayerReady && currentTrack && (
              <div className="mt-2 w-full bg-white/20 rounded-full h-1">
                <div
                  className="bg-blue-400 h-1 rounded-full transition-all duration-1000"
                  style={{ width: `${getTrackProgress()}%` }}
                />
              </div>
            )}
          </motion.div>

          {/* Mini Time Widget */}
          <motion.div 
            className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-xl p-3 shadow-lg cursor-pointer"
            onClick={() => setIsExpanded(true)}
            initial="collapsed"
            animate={isExpanded ? "expanded" : "collapsed"}
            variants={timeWidgetVariants}
          >
            <div className="flex items-center gap-2 text-white">
              <Clock className="h-3 w-3" />
              <span className="text-xs font-mono">{formatTime(localTime)}</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Full Expanded Controls */}
      <motion.div
        ref={controlsRef}
        className="fixed bottom-4 left-4 right-4 z-40"
        initial="collapsed"
        animate={isExpanded ? "expanded" : "collapsed"}
        variants={containerVariants}
        onMouseEnter={() => {
          setIsHovering(true)
          setIsExpanded(true)
        }}
        onMouseLeave={() => setIsHovering(false)}
        onClick={() => setIsExpanded(true)}
        style={{
          pointerEvents: isExpanded ? 'auto' : 'none'
        }}
      >
        <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl" style={{
          pointerEvents: 'auto'
        }}>
          <div className="flex items-center justify-between gap-4">
            {/* Media Info and Controls */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {/* Current Track Info */}
              <div className="flex-1 min-w-0 px-3 py-1 bg-black/20 rounded-lg overflow-hidden">
                <div className="text-sm font-medium text-white truncate">
                  {currentTrack?.title || 'No track playing'}
                </div>
                <div className="text-xs text-gray-400 truncate">
                  {currentTrack?.artist || '—'}
                </div>
              </div>
              
              <div className="w-px h-6 bg-white/20" />
              
              {/* Shuffle Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleShuffle}
                disabled={!isPlayerReady}
                className={`hover:bg-white/10 transition-all duration-200 ease-in-out hover:scale-110 disabled:opacity-50 ${
                  isShuffleEnabled ? "text-blue-400" : "text-white"
                }`}
              >
                {isShuffleEnabled ? <Shuffle className="h-4 w-4" /> : <ShuffleOff className="h-4 w-4" />}
              </Button>

              {/* Previous Track */}
              <Button
                variant="ghost"
                size="icon"
                onClick={previousTrack}
                disabled={!isPlayerReady}
                className="text-white hover:bg-white/10 transition-all duration-200 ease-in-out hover:scale-110 disabled:opacity-50"
              >
                <SkipBack className="h-5 w-5" />
              </Button>

              {/* Play/Pause */}
              <Button
                variant="ghost"
                size="icon"
                onClick={togglePlay}
                disabled={!isPlayerReady}
                className="text-white hover:bg-white/10 transition-all duration-200 ease-in-out hover:scale-110 disabled:opacity-50"
              >
                {isPlaying ? (
                  <Pause className="h-5 w-5 transition-transform duration-200" />
                ) : (
                  <Play className="h-5 w-5 transition-transform duration-200" />
                )}
              </Button>

              {/* Next Track */}
              <Button
                variant="ghost"
                size="icon"
                onClick={nextTrack}
                disabled={!isPlayerReady}
                className="text-white hover:bg-white/10 transition-all duration-200 ease-in-out hover:scale-110 disabled:opacity-50"
              >
                <SkipForward className="h-5 w-5" />
              </Button>

              <div className="flex items-center gap-2 group">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleMute}
                  disabled={!isPlayerReady}
                  className="text-white hover:bg-white/10 transition-all duration-200 ease-in-out disabled:opacity-50"
                >
                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </Button>
                <div className="w-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <Slider
                    value={[isMuted ? 0 : volume]}
                    onValueChange={handleVolumeChange}
                    max={100}
                    step={1}
                    className="w-full"
                    disabled={!isPlayerReady}
                  />
                </div>
              </div>

              <div className="w-px h-6 bg-white/20 hidden md:block" />

              {/* App Windows Buttons */}
              <Button
                variant="ghost"
                size="icon"
                className={`text-white hover:bg-white/10 transition-all duration-200 ease-in-out hover:scale-110 ${
                  windows.tasks.isOpen ? "bg-white/20 scale-110" : ""
                }`}
                onClick={() => toggleWindow("tasks")}
              >
                <CheckSquare className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className={`text-white hover:bg-white/10 transition-all duration-200 ease-in-out hover:scale-110 ${
                  windows.notes.isOpen ? "bg-white/20 scale-110" : ""
                }`}
                onClick={() => toggleWindow("notes")}
              >
                <FileText className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className={`text-white hover:bg-white/10 transition-all duration-200 ease-in-out hover:scale-110 ${
                  windows.timer.isOpen ? "bg-white/20 scale-110" : ""
                }`}
                onClick={() => toggleWindow("timer")}
              >
                <Timer className="h-4 w-4" />
              </Button>

              <div className="w-px h-6 bg-white/20 hidden md:block" />

              <Button
                variant="ghost"
                size="icon"
                onClick={toggleFavorite}
                disabled={!isPlayerReady}
                className={`hover:bg-white/10 transition-all duration-200 ease-in-out hover:scale-110 disabled:opacity-50 ${
                  isFavorite ? "text-red-400" : "text-white"
                }`}
              >
                <Heart className={`h-4 w-4 ${isFavorite ? "fill-current" : ""}`} />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={handleOpenPlaylist}
                className={`hover:bg-white/10 transition-all duration-200 ease-in-out hover:scale-110 ${
                  windows.playlist.isOpen ? "bg-white/20 scale-110" : ""
                }`}
              >
                <List className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => toggleWindow("playlist")}
                className="text-white hover:bg-white/10 transition-all duration-200 ease-in-out hover:scale-110 hidden md:flex"
              >
                <Music className="h-4 w-4" />
              </Button>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleOpenSettings()
                    }}
                    className="text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200 ease-in-out h-8 w-8"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Settings</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  )
}
