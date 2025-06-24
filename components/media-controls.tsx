"use client"

import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from "react"
import { motion } from "framer-motion"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Slider } from "@/components/ui/slider"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Play, Pause, SkipForward, SkipBack, Volume2, Heart, List, Music, VolumeX, Shuffle, Settings, Plus } from "lucide-react"
import { useWindows } from "@/hooks/use-windows"
import { useYouTubePlayerStore, usePlayerActions } from "@/hooks/use-youtube-player"
import { useToast } from "@/hooks/use-toast"
import { useFirestore } from "@/hooks/use-firestore"
import { UserAuth } from "@/components/auth/user-auth"
import { Clock, Timer, CheckSquare, FileText, LayoutGrid } from "lucide-react"

interface MediaControlsProps {
  currentTime?: Date
}

// Track title component with tooltip
const TrackTitle = ({ title }: { title?: string }) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <div className="text-sm font-medium text-white truncate">
        {title || 'No track playing'}
      </div>
    </TooltipTrigger>
    <TooltipContent>
      <p>{title || 'No track playing'}</p>
    </TooltipContent>
  </Tooltip>
);

// Memoize the component to prevent unnecessary re-renders
const MemoizedTrackTitle = memo(TrackTitle, (prevProps, nextProps) => {
  // Only re-render if the title actually changes
  return prevProps.title === nextProps.title;
});

export default function MediaControls({ currentTime: propCurrentTime }: MediaControlsProps) {
  // Memoize the current time to prevent unnecessary re-renders
  const [localTime, setLocalTime] = useState<Date>(propCurrentTime || new Date());
  
  // State that doesn't need to trigger re-renders when changed
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  const lastActivityRef = useRef(Date.now());
  
  // UI state
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [hasCustomLinks, setHasCustomLinks] = useState(false);
  const [customLinks, setCustomLinks] = useState<Array<{id: string, title: string, url: string}>>([]);
  const [isAddingTrack, setIsAddingTrack] = useState(false);
  const [newTrackUrl, setNewTrackUrl] = useState('');
  const [newTrackTitle, setNewTrackTitle] = useState('');
  const [newTrackArtist, setNewTrackArtist] = useState('');
  
  // Auth state
  const { user } = useAuth();
  
  const { toggleWindow, windows } = useWindows();
  const { toast } = useToast();
  const { getDocument } = useFirestore(user ? `users/${user.uid}/preferences` : 'temp/preferences');
  
  // Get player state with individual selectors to prevent unnecessary re-renders
  const isPlaying = useYouTubePlayerStore(state => state.isPlaying);
  const volume = useYouTubePlayerStore(state => state.volume);
  const currentTrack = useYouTubePlayerStore(state => state.currentTrack);
  const isMuted = useYouTubePlayerStore(state => state.isMuted);
  const isShuffleEnabled = useYouTubePlayerStore(state => state.isShuffleEnabled);
  const isReady = useYouTubePlayerStore(state => state.isReady);
  const tracks = useYouTubePlayerStore(state => state.tracks);
  const currentTime = useYouTubePlayerStore(state => state.currentTime);
  const duration = useYouTubePlayerStore(state => state.duration);
  const player = useYouTubePlayerStore(state => state.player);
  
  // Get player actions with useCallback to prevent unnecessary re-renders
  const { play, pause, playNext, playPrev, seekTo, setVolume, toggleMute, toggleShuffle, setCurrentTime, playTrack } = 
    useYouTubePlayerStore(useCallback((state) => state.actions, []));
  
  // Alias for consistency
  const nextTrack = playNext;
  const previousTrack = playPrev;
  
  // Handle play/pause toggle
  const togglePlayPause = useCallback(() => {
    if (!isReady) return;
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isReady, isPlaying, play, pause]);
  
  // Handle volume change
  const handleVolumeChange = useCallback((value: number[]) => {
    const newVolume = value[0] / 100;
    setVolume(newVolume);
  }, [setVolume]);
  
  // Handle seek
  const handleSeek = useCallback((value: number[]) => {
    if (!isReady || !player) return;
    const newTime = value[0];
    seekTo(newTime);
  }, [isReady, player, seekTo]);
  
  // Time formatting functions
  const formatDuration = useCallback((seconds: number) => {
    if (isNaN(seconds)) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  }, []);
  
  const formatTimeDisplay = useCallback((date: Date) => {
    if (!(date instanceof Date)) return '--:--';
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const minutesStr = minutes < 10 ? '0' + minutes : minutes;
    return `${hours}:${minutesStr} ${ampm}`;
  }, []);
  
  // Format time for display (replaces formatTimeDisplay)
  
  // Update local time if prop changes
  useEffect(() => {
    if (propCurrentTime) {
      setLocalTime(propCurrentTime);
    }
  }, [propCurrentTime]);

  // Auto-update time if not controlled by props
  useEffect(() => {
    if (propCurrentTime) return;
    
    let intervalId: NodeJS.Timeout;
    let lastSecond = -1;
    
    const updateTime = () => {
      const now = new Date();
      const currentSecond = now.getSeconds();
      
      // Only update if the second has changed
      if (currentSecond !== lastSecond) {
        lastSecond = currentSecond;
        setLocalTime(now);
      }
    };
    
    // Initial update
    updateTime();
    
    // Set up interval for updates
    intervalId = setInterval(updateTime, 200);
    
    return () => clearInterval(intervalId);
  }, [propCurrentTime]);

  // Check for custom links
  useEffect(() => {
    let isMounted = true;
    
    const loadCustomLinks = async () => {
      if (!user) return;
      
      try {
        const linksData = await getDocument('customLinks');
        if (!isMounted) return;
        
        const links = linksData?.links || [];
        const validLinks = links.filter((link: any) => 
          link?.id && link?.title && link?.url
        );
        
        setCustomLinks(validLinks);
        setHasCustomLinks(validLinks.length > 0);
      } catch (error) {
        console.error('Error loading custom links:', error);
        if (isMounted) {
          setCustomLinks([]);
          setHasCustomLinks(false);
        }
      }
    };
    
    loadCustomLinks();
    return () => { isMounted = false; };
  }, [user, getDocument]);

  // Memoize track progress calculation
  const progress = useMemo(() => {
    if (!currentTrack || !duration) return 0;
    return (currentTime / duration) * 100;
  }, [currentTime, duration, currentTrack]);

  // Memoize formatted time display
  const formattedTime = useMemo(() => {
    const formatTime = (timeInSeconds: number) => {
      const minutes = Math.floor(timeInSeconds / 60);
      const seconds = Math.floor(timeInSeconds % 60);
      return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };
    
    return {
      current: formatTime(currentTime || 0),
      total: formatTime(duration || 0)
    };
  }, [currentTime, duration]);

  const handleOpenSettings = useCallback(() => {
    toggleWindow("settings");
  }, [toggleWindow]);

  const handleOpenPlaylist = useCallback(() => {
    toggleWindow("playlist");
  }, [toggleWindow]);
  
  // Toggle play/pause
  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);
  
  // Toggle favorite status
  const isFavorite = false;

  const toggleFavorite = useCallback(() => {
    if (!currentTrack) return;
    // Implement favorite functionality
    toast({
      title: isFavorite ? "Removed from favorites" : "Added to favorites",
      description: isFavorite ? "Track removed from your favorites" : "Track added to your favorites",
    });
  }, [currentTrack, isFavorite, toast]);

  const handleAddTrack = useCallback(() => {
    if (!newTrackUrl || !newTrackTitle) return;
    
    // In a real implementation, you would validate the URL and add the track
    // For now, we'll just show a success message
    toast({
      title: "Track added",
      description: `${newTrackTitle} has been added to the playlist`,
    });
    
    // Reset form
    setNewTrackUrl('');
    setNewTrackTitle('');
    setNewTrackArtist('');
    setIsAddingTrack(false);
  }, [newTrackUrl, newTrackTitle, toast]);

  const getCurrentTrackDisplay = () => {
    if (!currentTrack) return "No track selected"
    return `${currentTrack.title} - ${currentTrack.artist}`
  }

  const handleOpenWidgetsPanel = () => {
    // The widgets panel is a special case that doesn't need to be in the windows record
    // since it's managed by the widgets panel component itself
    const widgetPanel = document.querySelector('[data-window-type="widgets"]') as HTMLElement;
    if (widgetPanel) {
      if (widgetPanel.style.display === 'none') {
        widgetPanel.style.display = 'block';
        widgetPanel.style.zIndex = '9999';
      } else {
        widgetPanel.style.display = 'none';
      }
    }
  }

  const loadWidgets = useCallback(async () => {
    if (!user) return
    
    try {
      // You'll need to implement this function in your useFirestore hook
      // const data = await getDocument('widgets')
      // if (data?.widgets) {
      //   setWidgets(data.widgets)
      // }
    } catch (error) {
      console.error('Error loading widgets:', error)
    }
  }, [user])

  // Load widgets on mount
  useEffect(() => {
    loadWidgets()
  }, [loadWidgets])

  const containerVariants: Record<string, any> = {
    collapsed: {
      y: 100,
      opacity: 0,
      transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }
    },
    expanded: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }
    },
    mini: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }
    }
  }

  const miniPlayerVariants: Record<string, any> = {
    collapsed: { 
      x: 0,
      opacity: 1,
      transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }
    },
    expanded: { 
      x: -50,
      opacity: 1,
      transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }
    }
  }

  //   if (!date) return '--:--'
  //   return date.toLocaleTimeString('en-US', {
  //     hour: '2-digit',
  //     minute: '2-digit',
  //     hour12: true
  //   })
  // }

  // const handleVolumeChange = (value: number[]) => {
  //   setVolume(value[0])
  // }

  // const handleOpenSettings = () => {
  //   toggleWindow("settings")
  // }

  // const handleOpenPlaylist = () => {
  //   toggleWindow("playlist")
  // }

  // const handleOpenWidgetsPanel = () => {
  //   // The widgets panel is a special case that doesn't need to be in the windows record
  //   // since it's managed by the widgets panel component itself
  //   const widgetPanel = document.querySelector('[data-window-type="widgets"]') as HTMLElement;
  //   if (widgetPanel) {
  //     if (widgetPanel.style.display === 'none') {
  //       widgetPanel.style.display = 'block';
  //       widgetPanel.style.zIndex = '9999';
  //     } else {
  //       widgetPanel.style.display = 'none';
  //     }
  //   }
  // }

  // const getCurrentTrackDisplay = () => {
  //   if (!currentTrack) return "No track selected"
  //   return `${currentTrack.title} - ${currentTrack.artist}`
  // }
  
  // const handleAddTrack = () => {
  //   if (!newTrackUrl || !newTrackTitle) return;
    
  //   // Extract video ID from YouTube URL
  //   const videoId = new URL(newTrackUrl).searchParams.get('v');
  //   if (!videoId) {
  //     toast({
  //       title: 'Invalid YouTube URL',
  //       description: 'Please enter a valid YouTube video URL',
  //       variant: 'destructive',
  //     });
  //     return;
  //   }
    
  //   // Add the new track
  //   addTrack({
  //     title: newTrackTitle,
  //     artist: newTrackArtist || 'Unknown Artist',
  //     startTime: 0,
  //     endTime: 300, // Default to 5 minutes, can be adjusted by user
  //   });
    
  //   // Reset form
  //   setNewTrackUrl('');
  //   setNewTrackTitle('');
  //   setNewTrackArtist('');
  //   setIsAddingTrack(false);
    
  //   toast({
  //     title: 'Track added',
  //     description: `${newTrackTitle} has been added to the playlist`,
  //   });
  // }


  // // Load widgets from Firestore
  // const loadWidgets = useCallback(async () => {
  //   if (!user) return
    
  //   try {
  //     // You'll need to implement this function in your useFirestore hook
  //     // const data = await getDocument('widgets')
  //     // if (data?.widgets) {
  //     //   setWidgets(data.widgets)
  //     // }
  //   } catch (error) {
  //     console.error('Error loading widgets:', error)
  //   }
  // }, [user])
  
  // // Load widgets on mount
  // useEffect(() => {
  //   loadWidgets()
  // }, [loadWidgets])

  // // Animation variants for framer-motion
  // const containerVariants: Record<string, any> = {
  //   collapsed: {
  //     y: 100,
  //     opacity: 0,
  //     transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }
  //   },
  //   expanded: {
  //     y: 0,
  //     opacity: 1,
  //     transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }
  //   },
  //   mini: {
  //     y: 0,
  //     opacity: 1,
  //     transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }
  //   }
  // }

  // const miniPlayerVariants: Record<string, any> = {
  //   collapsed: { 
  //     x: 0,
  //     opacity: 1,
  //     transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }
  //   },
  //   expanded: { 
  //     x: -50,
  //     opacity: 0,
  //     transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] }
  //   }
  // }

  const timeWidgetVariants = {
    collapsed: { 
      x: 0,
      opacity: 1,
      transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }
    },
    expanded: { 
      x: 50,
      opacity: 0,
      transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] }
    }
  } as const

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
        <div className="flex items-center gap-2">
          {/* Mini Music Player */}
          <motion.div 
            className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-xl p-3 shadow-lg cursor-pointer"
            onClick={() => setIsExpanded(true)}
          >
            <div className="flex items-center space-x-4">
              <div className="text-sm font-medium text-foreground/80 max-w-[200px] truncate">
                {getCurrentTrackDisplay()}
              </div>
              <Dialog open={isAddingTrack} onOpenChange={setIsAddingTrack}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Plus className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Track</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="track-url">YouTube URL</Label>
                      <Input
                        id="track-url"
                        placeholder="https://www.youtube.com/watch?v=..."
                        value={newTrackUrl}
                        onChange={(e) => setNewTrackUrl(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="track-title">Title</Label>
                      <Input
                        id="track-title"
                        placeholder="Track title"
                        value={newTrackTitle}
                        onChange={(e) => setNewTrackTitle(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="track-artist">Artist (optional)</Label>
                      <Input
                        id="track-artist"
                        placeholder="Artist name"
                        value={newTrackArtist}
                        onChange={(e) => setNewTrackArtist(e.target.value)}
                      />
                    </div>
                    <Button onClick={handleAddTrack} disabled={!newTrackUrl || !newTrackTitle}>
                      Add Track
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            {isReady && currentTrack && (
              <div className="mt-2 w-full bg-white/20 rounded-full h-1">
                <div
                  className="bg-blue-400 h-1 rounded-full transition-all duration-1000"
                  style={{ width: `${progress}%` }}
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
              <span className="text-xs font-mono">{formatTimeDisplay(localTime)}</span>
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
              {/* Current Track Info - Memoized */}
              <div className="flex-1 min-w-0 px-3 py-1 bg-black/20 rounded-lg overflow-hidden max-w-[200px] sm:max-w-[300px] md:max-w-[400px]">
                <MemoizedTrackTitle title={currentTrack?.title} />
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
                disabled={!isReady}
                className={`hover:bg-white/10 transition-all duration-200 ease-in-out hover:scale-110 disabled:opacity-50 ${
                  isShuffleEnabled ? "text-blue-400" : "text-white"
                }`}
              >
                <Shuffle className={`h-4 w-4 ${!isShuffleEnabled ? 'opacity-50' : ''}`} />
              </Button>

              {/* Previous Track */}
              <Button
                variant="ghost"
                size="icon"
                onClick={previousTrack}
                disabled={!isReady}
                className="text-white hover:bg-white/10 transition-all duration-200 ease-in-out hover:scale-110 disabled:opacity-50"
              >
                <SkipBack className="h-5 w-5" />
              </Button>

              {/* Play/Pause */}
              <Button
                variant="ghost"
                size="icon"
                onClick={togglePlay}
                disabled={!isReady}
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
                disabled={!isReady}
                className="text-white hover:bg-white/10 transition-all duration-200 ease-in-out hover:scale-110 disabled:opacity-50"
              >
                <SkipForward className="h-5 w-5" />
              </Button>

              <div className="flex items-center gap-2 group">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleMute}
                  disabled={!isReady}
                  className="text-white hover:bg-white/10 transition-all duration-200 ease-in-out disabled:opacity-50"
                >
                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </Button>
                <div className="w-20 opacity-100 transition-opacity duration-200">
                  <Slider
                    value={[isMuted ? 0 : volume * 100]}
                    onValueChange={handleVolumeChange}
                    max={100}
                    step={1}
                    className="w-full"
                    disabled={!isReady}
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
              
              {/* Widgets Panel Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => toggleWindow("widgets")}
                className={`text-white hover:bg-white/10 transition-all duration-200 ease-in-out hover:scale-110 ${
                  windows.widgets?.isOpen 
                    ? "bg-white/20 scale-110" 
                    : ""
                }`}
                title="Widgets"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>



              <div className="w-px h-6 bg-white/20 hidden md:block" />

              <Button
                variant="ghost"
                size="icon"
                onClick={toggleFavorite}
                disabled={!isReady}
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

              <div className="w-px h-6 bg-white/20" />

              <UserAuth />
            </div>
          </div>
        </div>
      </motion.div>
    </>
  )
}

