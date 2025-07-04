"use client"

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useYouTubePlayerStore, usePlayerActions } from "@/hooks/use-youtube-player"
import { useWindows } from "@/hooks/use-windows"
import { usePreferences } from "@/contexts/preferences-context"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import {
  Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, Shuffle, FileText, Timer,
  LayoutGrid, Heart, List, Music, Settings, Maximize2, Minimize2,
  ListTodo
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { UserAuth } from "@/components/auth/user-auth"
import { TimerPanel } from "./timer-panel"

interface Track {
  id: string;
  title: string;
  artist?: string;
  thumbnail?: string;
  duration?: number;
  url: string;
}

interface MediaControlsProps {
  currentTime?: Date;
  isFavorite?: boolean;
  isReady?: boolean;
  currentTrack?: Track;
}

export default function MediaControls({ isFavorite: initialIsFavorite = false, isReady: initialIsReady = true }: MediaControlsProps) {
  const [localTime, setLocalTime] = useState<Date>(new Date());
  const [isHovered, setIsHovered] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffleOn, setIsShuffleOn] = useState(false);
  const controlsRef = useRef<HTMLDivElement>(null);
  const { currentTrack, isPlaying, isReady: playerReady } = useYouTubePlayerStore();
  const actions = usePlayerActions();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { windowStyles } = usePreferences();
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const volumeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const volumeRef = useRef<HTMLDivElement>(null);

  // Format time as HH:MM AM/PM
  const formatTime = (date: Date): string => date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

  // Format date as Day, Month Date
  const formatDate = (date: Date): string => date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  // Player state
  const { windows, toggleWindow } = useWindows();

  // Local state with props as initial values
  const [isReady] = useState(initialIsReady);
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
  
  // Dynamic styles from preferences
  const controlsStyle = useMemo(() => {
    const defaultStyles = { windowBgColor: '255,255,255', windowBgOpacity: 0.1, windowBgBlur: 16, windowBorderRadius: 16 };
    const styles = { ...defaultStyles, ...windowStyles };
    const blurValue = styles.windowBgBlur > 0 ? `blur(${styles.windowBgBlur}px)` : 'none';

    return {
      backgroundColor: `rgba(${styles.windowBgColor}, ${styles.windowBgOpacity})`,
      backdropFilter: `${blurValue} saturate(180%)`,
      WebkitBackdropFilter: `${blurValue} saturate(180%)`,
      borderRadius: `${styles.windowBorderRadius}px`,
      borderColor: `rgba(255, 255, 255, 0.2)`,
      borderWidth: '1px',
    };
  }, [windowStyles]);

  // Optimized volume toggle handler
  const handleVolumeToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    actions.toggleMute();
  }, [actions, isMuted]);

  useEffect(() => {
    const timer = setInterval(() => setLocalTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true));
    } else if (document.exitFullscreen) {
      document.exitFullscreen().then(() => setIsFullscreen(false));
    }
  }, []);

  // Keyboard event listener for "F" key to toggle fullscreen
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'f' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        // Only trigger if not typing in an input field
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA' && !target.isContentEditable) {
          e.preventDefault();
          toggleFullscreen();
        }
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [toggleFullscreen]);

  const buttonVariants = { 
    initial: { scale: 1 }, 
    tap: { scale: 0.95 }, 
    hover: { scale: 1.1, transition: { type: 'spring' as const, stiffness: 400, damping: 10 } } 
  };

  // Optimized volume change handler - immediate UI update, debounced API call
  const handleVolumeChange = useCallback((newVolume: number) => {
    // Immediate UI update for smooth interaction
    setVolume(newVolume);
    
    // Clear existing timeout
    if (volumeTimeoutRef.current) {
      clearTimeout(volumeTimeoutRef.current);
    }
    
    // Debounce the actual API call
    volumeTimeoutRef.current = setTimeout(() => {
      actions.setVolume(newVolume);
      if (newVolume > 0 && isMuted) {
        setIsMuted(false);
        actions.toggleMute();
      }
    }, 16); // Reduced to ~60fps for smoother updates
  }, [actions, isMuted]);

  const handlePlayPause = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!playerReady) return;
    try { 
      isPlaying ? await actions.pause() : await actions.play(); 
    } catch (error) { 
      console.error('Error toggling play/pause:', error); 
    }
  }, [actions, isPlaying, playerReady]);

  const handleShuffleToggle = useCallback(() => {
    setIsShuffleOn(prev => !prev);
    actions.toggleShuffle();
  }, [actions]);
  

  
  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFavorite = useCallback(() => setIsFavorite(prev => !prev), []);
  const handleOpenPlaylist = useCallback(() => toggleWindow("playlist"), [toggleWindow]);
  const handleOpenSettings = useCallback((e: React.MouseEvent) => { 
    e.stopPropagation(); 
    toggleWindow("settings"); 
  }, [toggleWindow]);

  const formatTimeDisplay = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Handle volume slider mouse interactions
  const handleVolumeSliderMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const slider = e.currentTarget.parentElement!;
    const rect = slider.getBoundingClientRect();
    
    const handleMouseMove = (me: MouseEvent) => {
      const newVolume = Math.max(0, Math.min(1, 1 - ((me.clientY - rect.top) / rect.height)));
      handleVolumeChange(newVolume);
    };
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [handleVolumeChange]);

  // Handle volume slider hover with debouncing
  const handleVolumeHover = useCallback((show: boolean) => {
    if (volumeTimeoutRef.current) {
      clearTimeout(volumeTimeoutRef.current);
    }
    
    if (show) {
      setShowVolumeSlider(true);
    } else {
      volumeTimeoutRef.current = setTimeout(() => {
        setShowVolumeSlider(false);
      }, 150);
    }
  }, []);

  return (
    <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center px-4">
      <div className="w-full max-w-4xl">
        <div className="relative">
          <motion.div
            ref={controlsRef}
            className="flex items-center justify-evenly gap-2 p-1 shadow-2xl 
                      transition-all duration-200 ease-out hover:shadow-lg min-w-[300px] max-w-full
                      hover:translate-y-[-2px] active:translate-y-0 active:scale-[0.995]"
            style={controlsStyle}
            initial={{ y: 100, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } }}
            drag dragConstraints={{ top: 0, left: 0, right: 0, bottom: 0 }} dragElastic={0.1}
            onHoverStart={() => setIsHovered(true)} onHoverEnd={() => setIsHovered(false)}
          >
            <div className="flex justify-between items-center gap-2 w-full p-2 max-w-4xl">
              {/* Left section - Track info with artwork */}
              <div className="flex flex-1 items-center min-w-0 bg-white/5 backdrop-blur-sm rounded-lg pr-2 transition-all duration-200 hover:bg-white/10">
                {currentTrack?.thumbnail ? (
                  <div className="w-10 h-10 rounded-lg overflow-hidden mr-3 flex-shrink-0 shadow-md">
                    <img src={currentTrack.thumbnail} alt={currentTrack.title} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center mr-3 flex-shrink-0 shadow-md">
                    <Music className="h-5 w-5 text-white" />
                  </div>
                )}
                <div className="min-w-0">
                  <div className="text-xs font-medium text-white/90 truncate">{currentTrack?.title || 'No track playing'}</div>
                  {currentTrack?.artist ? (
                    <div className="text-[10px] text-white/60 truncate">{currentTrack.artist}</div>
                  ) : (
                    <div className="text-[10px] text-white/40 italic">Select a track to play</div>
                  )}
                </div>
                {isPlaying && (
                  <div className="ml-2 ml-auto flex space-x-1 transform rotate-180">
                    {[0, 0.5, 1].map((delay) => (
                      <motion.div
                        key={delay}
                        className="h-1 w-1 bg-blue-400 rounded-full"
                        animate={{ height: [0, 8, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay, repeatType: "reverse" }}
                        style={{ transform: "translateY(20px)", rotateX: "180deg" }}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Center section - Playback controls */}
              <div className="flex flex-1 items-center justify-left mx-4 space-x-2">
                <motion.div variants={buttonVariants} whileHover="hover" whileTap="tap" className="relative">
                  <Button variant="ghost" size="icon" disabled={!playerReady} className={`text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200 ease-in-out h-8 w-8 disabled:opacity-50`} onClick={handleShuffleToggle}>
                    <Shuffle className="h-4 w-4" />
                  </Button>
                  {isShuffleOn && (<div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-4 h-0.5 bg-white rounded-full" />)}
                </motion.div>

                <motion.div variants={buttonVariants} whileHover="hover" whileTap="tap">
                  <Button variant="ghost" size="icon" disabled={!playerReady} className="text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200 ease-in-out h-8 w-8 disabled:opacity-50" onClick={actions.playPrev}>
                    <SkipBack className="h-4 w-4" />
                  </Button>
                </motion.div>

                {/* Play/Pause button - made consistent with other buttons */}
                <motion.div variants={buttonVariants} whileHover="hover" whileTap="tap">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    disabled={!playerReady} 
                    className={`text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200 ease-in-out h-10 w-10 disabled:opacity-50`} 
                    onClick={handlePlayPause} 
                    aria-label={isPlaying ? 'Pause' : 'Play'}
                  >
                    {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
                  </Button>
                </motion.div>

                <motion.div variants={buttonVariants} whileHover="hover" whileTap="tap">
                  <Button variant="ghost" size="icon" disabled={!playerReady} className="text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200 ease-in-out h-8 w-8 disabled:opacity-50" onClick={actions.playNext}>
                    <SkipForward className="h-4 w-4" />
                  </Button>
                </motion.div>

                {/* Volume Control Section - Fixed positioning and optimized */}
                <div className="flex items-center ml-2">
                  <motion.div 
                    className="relative" 
                    onMouseEnter={() => handleVolumeHover(true)} 
                    onMouseLeave={() => handleVolumeHover(false)}
                  >
                    <motion.div variants={buttonVariants} whileHover="hover" whileTap="tap">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-white hover:bg-white/10 rounded-full h-8 w-8 md:h-9 md:w-9 relative group" 
                        onClick={handleVolumeToggle}
                      >
                        {isMuted || volume === 0 ? (
                          <VolumeX className="h-4 w-4" />
                        ) : (
                          <Volume2 className="h-4 w-4" />
                        )}
                        <div className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-blue-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      </Button>
                    </motion.div>

                    {/* Volume Slider - Positioned directly above the button */}
                    <AnimatePresence>
                      {showVolumeSlider && (
                        <motion.div
                          className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-black/90 backdrop-blur-md p-3 rounded-lg shadow-lg border border-white/10"
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                          onMouseEnter={() => handleVolumeHover(true)}
                          onMouseLeave={() => handleVolumeHover(false)}
                        >
                          <div className="flex flex-col items-center">
                            <div className="text-[10px] text-white/60 mb-2">
                              {Math.round((isMuted ? 0 : volume) * 100)}%
                            </div>
                            <div className="h-24 w-6 flex items-center justify-center">
                              <div className="h-full w-1 bg-white/20 rounded-full relative cursor-pointer">
                                <div 
                                  className="absolute bottom-0 w-full bg-gradient-to-t from-blue-500 to-blue-300 rounded-full transition-all duration-150" 
                                  style={{ height: `${(isMuted ? 0 : volume) * 100}%` }} 
                                />
                                <div 
                                  className="absolute w-3 h-3 bg-white border-2 border-white/80 rounded-full shadow-lg cursor-pointer transform -translate-x-1/2 -translate-y-1/2 transition-all duration-150 hover:scale-110" 
                                  style={{ 
                                    left: '50%', 
                                    bottom: `${(isMuted ? 0 : volume) * 100}%` 
                                  }}
                                  onMouseDown={handleVolumeSliderMouseDown}
                                />
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                  <div className="h-6 w-px bg-white/10 mx-1" />
                  <div className="flex items-center gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <motion.div variants={buttonVariants} whileHover="hover" whileTap="tap" className="relative">
                          <Button variant="ghost" size="icon" onClick={handleOpenPlaylist} className="text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200 ease-in-out h-8 w-8">
                            <Music className="h-4 w-4" />
                          </Button>
                          {windows.playlist?.isOpen && (<div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-4 h-0.5 bg-white rounded-full" />)}
                        </motion.div>
                      </TooltipTrigger>
                      <TooltipContent side="top">Playlist</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <motion.div variants={buttonVariants} whileHover="hover" whileTap="tap" className="relative">
                          <Button variant="ghost" size="icon" className="text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200 ease-in-out h-8 w-8" onClick={() => toggleWindow("notes")}>
                            <FileText className="h-4 w-4" />
                          </Button>
                          {windows.notes?.isOpen && (<div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-4 h-0.5 bg-white rounded-full" />)}
                        </motion.div>
                      </TooltipTrigger>
                      <TooltipContent side="top">Notes</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <motion.div variants={buttonVariants} whileHover="hover" whileTap="tap" className="relative">
                          <Button variant="ghost" size="icon" className="text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200 ease-in-out h-8 w-8" onClick={() => toggleWindow("tasks")}>
                            <ListTodo className="h-4 w-4" />
                          </Button>
                          {windows.tasks?.isOpen && (<div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-4 h-0.5 bg-white rounded-full" />)}
                        </motion.div>
                      </TooltipTrigger>
                      <TooltipContent side="top">Tasks</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <motion.div variants={buttonVariants} whileHover="hover" whileTap="tap" className="relative">
                          <Button variant="ghost" size="icon" onClick={() => toggleWindow("timer")} className="text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200 ease-in-out h-8 w-8">
                            <Timer className="h-4 w-4" />
                          </Button>
                          {windows.timer?.isOpen && (<div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-4 h-0.5 bg-white rounded-full" />)}
                        </motion.div>
                      </TooltipTrigger>
                      <TooltipContent side="top">Timer</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <motion.div variants={buttonVariants} whileHover="hover" whileTap="tap" className="relative">
                          <Button variant="ghost" size="icon" onClick={toggleFavorite} disabled={!playerReady} className={`text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200 ease-in-out h-8 w-8 disabled:opacity-50 ${isFavorite ? "text-red-400" : ""}`}>
                            <Heart className={`h-4 w-4 ${isFavorite ? "fill-current" : ""}`} />
                          </Button>
                        </motion.div>
                      </TooltipTrigger>
                      <TooltipContent side="top">{isFavorite ? "Remove from favorites" : "Add to favorites"}</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <motion.div variants={buttonVariants} whileHover="hover" whileTap="tap" className="relative">
                          <Button variant="ghost" size="icon" onClick={handleOpenSettings} className="text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200 ease-in-out h-8 w-8">
                            <Settings className="h-4 w-4" />
                          </Button>
                          {windows.settings?.isOpen && (<div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-4 h-0.5 bg-white rounded-full" />)}
                        </motion.div>
                      </TooltipTrigger>
                      <TooltipContent side="top"><p>Settings</p></TooltipContent>
                    </Tooltip>
                  </div>
                </div>
                <div className="h-6 w-px bg-white/10" />
              </div>
              
              {/* User Section */}
              <div className="hidden md:flex items-center space-x-3 mx-2">
                <UserAuth />
                <div className="h-6 w-px bg-white/10" />
              </div>
              
              {/* Time and Date - Right Section */}
              <div className="flex items-center space-x-3">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/10"
                      onClick={toggleFullscreen}
                    >
                      {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>{isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}</p>
                  </TooltipContent>
                </Tooltip>
                <div className="h-6 w-px bg-white/10" />
                <div className="flex flex-col items-end">
                  <div className="text-sm font-medium text-white/90 whitespace-nowrap">{formatTime(localTime)}</div>
                  <div className="text-[10px] text-white/60 whitespace-nowrap">{formatDate(localTime)}</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}