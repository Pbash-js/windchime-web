"use client"

import { useState, useEffect, useRef } from "react"

interface Track {
  id: string
  title: string
  artist: string
  startTime: number // in seconds
  endTime: number
}

const TRACKS: Track[] = [
  { id: "1", title: "Intro", artist: "Various", startTime: 0, endTime: 15 },
  { id: "2", title: "Snowman", artist: "WYS", startTime: 15, endTime: 205 },
  { id: "3", title: "Cotton Cloud", artist: "Fatb", startTime: 205, endTime: 328 },
  { id: "4", title: "the places we used to walk", artist: "rook1e x tender spring", startTime: 328, endTime: 464 },
  { id: "5", title: "wool gloves", artist: "imagiro", startTime: 464, endTime: 628 },
  { id: "6", title: "I'm sorry", artist: "Glimlip x Yasper", startTime: 628, endTime: 763 },
  { id: "7", title: "Nova", artist: "mell-ø", startTime: 763, endTime: 864 },
  { id: "8", title: "carried away", artist: "goosetaf x the fields tape x francis", startTime: 864, endTime: 980 },
  { id: "9", title: "snow & sand", artist: "j'san x epektase", startTime: 980, endTime: 1142 },
  { id: "10", title: "Single Phial", artist: "HM Surf", startTime: 1142, endTime: 1246 },
  { id: "11", title: "Drops", artist: "cocabona x Glimlip", startTime: 1246, endTime: 1363 },
  { id: "12", title: "espresso", artist: "Aso", startTime: 1363, endTime: 1510 },
  { id: "13", title: "Luminescence", artist: "Ambulo x mell-ø", startTime: 1510, endTime: 1610 },
  { id: "14", title: "Explorers", artist: "DLJ x BIDØ", startTime: 1610, endTime: 1728 },
  { id: "15", title: "Wish You Were Mine", artist: "Sarcastic Sounds", startTime: 1728, endTime: 1851 },
  { id: "16", title: "Reflections", artist: "BluntOne", startTime: 1851, endTime: 1968 },
  { id: "17", title: "Alone Time", artist: "Purrple Cat", startTime: 1968, endTime: 2168 },
  { id: "18", title: "Owls of the Night", artist: "Kupla", startTime: 2168, endTime: 2308 },
  { id: "19", title: "Steps", artist: "dryhope", startTime: 2308, endTime: 2454 },
  { id: "20", title: "amber", artist: "ENRA", startTime: 2454, endTime: 2540 },
  { id: "21", title: "fever", artist: "Psalm Trees", startTime: 2540, endTime: 2691 },
  { id: "22", title: "Circle", artist: "H.1", startTime: 2691, endTime: 2801 },
  { id: "23", title: "Cuddlin", artist: "Pandrezz", startTime: 2801, endTime: 2972 },
  { id: "24", title: "Late Night Call", artist: "Jordy Chandra", startTime: 2972, endTime: 3104 },
  { id: "25", title: "Gyoza", artist: "less.people", startTime: 3104, endTime: 3222 },
  { id: "26", title: "Keyframe", artist: "G Mills", startTime: 3222, endTime: 3392 },
  { id: "27", title: "breeze", artist: "mvdb", startTime: 3392, endTime: 3486 },
  { id: "28", title: "Lunar Drive", artist: "Mondo Loops", startTime: 3486, endTime: 3600 },
]

const YOUTUBE_VIDEO_ID = "lTRiuFIWV54"

declare global {
  interface Window {
    YT: any
    onYouTubeIframeAPIReady: () => void
  }
}

export function useYouTubePlayer() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolumeState] = useState(70)
  const [isMuted, setIsMuted] = useState(false)
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0)
  const [isFavorite, setIsFavorite] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [isShuffleEnabled, setIsShuffleEnabled] = useState(false)
  const [shuffledIndices, setShuffledIndices] = useState<number[]>([])
  const [isPlayerReady, setIsPlayerReady] = useState(false)

  const playerRef = useRef<any>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const previousVolumeRef = useRef(70)

  const [currentTrack, setCurrentTrack] = useState(TRACKS[currentTrackIndex])
  const currentTrackRef = useRef(TRACKS[currentTrackIndex])

  // Update currentTrack whenever currentTrackIndex changes
  useEffect(() => {
    const newTrack = TRACKS[currentTrackIndex]
    setCurrentTrack(newTrack)
    currentTrackRef.current = newTrack
  }, [currentTrackIndex])

  // --- YouTube IFrame API bootstrap ------------------------------
  useEffect(() => {
    if (typeof window === "undefined") return

    const loadYouTubeAPI = () => {
      // Already loaded → just init the player
      if (window.YT && window.YT.Player) {
        initializePlayer()
        return
      }

      // If a script with this ID is already in the DOM, wait for API-ready
      if (document.getElementById("youtube-iframe-api")) return

      // Otherwise, append it once to <head>
      const script = document.createElement("script")
      script.id = "youtube-iframe-api"
      script.src = "https://www.youtube.com/iframe_api"
      document.head.appendChild(script)

      // YouTube will call this when it’s ready
      window.onYouTubeIframeAPIReady = () => initializePlayer()
    }

    loadYouTubeAPI()

    // Cleanup: stop timers when component unmounts
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Initialize shuffle indices
  useEffect(() => {
    const indices = Array.from({ length: TRACKS.length }, (_, i) => i)
    setShuffledIndices(shuffleArray([...indices]))
  }, [])

  const initializePlayer = () => {
    if (playerRef.current) return

    playerRef.current = new window.YT.Player("youtube-player", {
      height: "0",
      width: "0",
      videoId: YOUTUBE_VIDEO_ID,
      playerVars: {
        autoplay: 0,
        controls: 0,
        disablekb: 1,
        fs: 0,
        iv_load_policy: 3,
        modestbranding: 1,
        rel: 0,
        showinfo: 0,
      },
      events: {
        onReady: onPlayerReady,
        onStateChange: onPlayerStateChange,
      },
    })
  }

  const onPlayerReady = () => {
    setIsPlayerReady(true)
    if (playerRef.current) {
      playerRef.current.setVolume(volume)
      playerRef.current.seekTo(currentTrack.startTime, true)
    }
  }

  const onPlayerStateChange = (event: any) => {
    if (event.data === window.YT.PlayerState.PLAYING) {
      setIsPlaying(true)
      startTimeTracking()
    } else if (event.data === window.YT.PlayerState.PAUSED) {
      setIsPlaying(false)
      stopTimeTracking()
    } else if (event.data === window.YT.PlayerState.ENDED) {
      nextTrack()
    }
  }

  // Track end detection effect
  const trackEndTimeRef = useRef(currentTrack.endTime)
  
  useEffect(() => {
    trackEndTimeRef.current = currentTrack.endTime
  }, [currentTrack])
  
  useEffect(() => {
    if (!playerRef.current || !isPlayerReady) return

    const checkTrackEnd = () => {
      const currentTime = playerRef.current.getCurrentTime()
      if (currentTime >= trackEndTimeRef.current) {
        nextTrack()
      }
    }

    const interval = setInterval(checkTrackEnd, 1000)
    return () => clearInterval(interval)
  }, [isPlayerReady])

  const startTimeTracking = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)

    intervalRef.current = setInterval(() => {
      if (playerRef.current && playerRef.current.getCurrentTime) {
        const time = playerRef.current.getCurrentTime()
        setCurrentTime(time)
      }
    }, 1000)
  }

  const stopTimeTracking = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  const shuffleArray = (array: number[]) => {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  const getNextTrackIndex = () => {
    if (isShuffleEnabled) {
      const currentShuffleIndex = shuffledIndices.indexOf(currentTrackIndex)
      const nextShuffleIndex = (currentShuffleIndex + 1) % shuffledIndices.length
      return shuffledIndices[nextShuffleIndex]
    } else {
      return (currentTrackIndex + 1) % TRACKS.length
    }
  }

  const getPreviousTrackIndex = () => {
    if (isShuffleEnabled) {
      const currentShuffleIndex = shuffledIndices.indexOf(currentTrackIndex)
      const prevShuffleIndex = currentShuffleIndex === 0 ? shuffledIndices.length - 1 : currentShuffleIndex - 1
      return shuffledIndices[prevShuffleIndex]
    } else {
      return currentTrackIndex === 0 ? TRACKS.length - 1 : currentTrackIndex - 1
    }
  }

  const togglePlay = () => {
    if (!isPlayerReady || !playerRef.current) return

    if (isPlaying) {
      playerRef.current.pauseVideo()
    } else {
      // Ensure we're at the right position for the current track
      const currentPlayerTime = playerRef.current.getCurrentTime()
      if (currentPlayerTime < currentTrack.startTime || currentPlayerTime >= currentTrack.endTime) {
        playerRef.current.seekTo(currentTrack.startTime, true)
      }
      playerRef.current.playVideo()
    }
  }

  const setVolume = (newVolume: number) => {
    setVolumeState(newVolume)
    if (playerRef.current && isPlayerReady) {
      playerRef.current.setVolume(newVolume)
    }
    if (newVolume > 0 && isMuted) {
      setIsMuted(false)
    }
  }

  const toggleMute = () => {
    if (!playerRef.current || !isPlayerReady) return

    if (isMuted) {
      setIsMuted(false)
      setVolumeState(previousVolumeRef.current)
      playerRef.current.setVolume(previousVolumeRef.current)
    } else {
      previousVolumeRef.current = volume
      setIsMuted(true)
      playerRef.current.setVolume(0)
    }
  }

  const nextTrack = () => {
    const nextIndex = getNextTrackIndex()
    const nextTrack = TRACKS[nextIndex]
    
    // Update the track index and track info
    setCurrentTrackIndex(nextIndex)
    setCurrentTrack(nextTrack)
    currentTrackRef.current = nextTrack

    if (playerRef.current && isPlayerReady) {
      playerRef.current.seekTo(nextTrack.startTime, true)
      if (isPlaying) {
        playerRef.current.playVideo()
      }
    }

    console.log("Next track:", nextTrack.title, "by", nextTrack.artist)
  }

  const previousTrack = () => {
    const prevIndex = getPreviousTrackIndex()
    const prevTrack = TRACKS[prevIndex]
    
    // Update the track index and track info
    setCurrentTrackIndex(prevIndex)
    setCurrentTrack(prevTrack)
    currentTrackRef.current = prevTrack

    if (playerRef.current && isPlayerReady) {
      playerRef.current.seekTo(prevTrack.startTime, true)
      if (isPlaying) {
        playerRef.current.playVideo()
      }
    }

    console.log("Previous track:", prevTrack.title, "by", prevTrack.artist)
  }

  const toggleShuffle = () => {
    setIsShuffleEnabled(!isShuffleEnabled)
    if (!isShuffleEnabled) {
      // Re-shuffle when enabling
      const indices = Array.from({ length: TRACKS.length }, (_, i) => i)
      setShuffledIndices(shuffleArray([...indices]))
    }
  }

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite)
    console.log(isFavorite ? "Removed from favorites" : "Added to favorites")
  }

  const seekToTrack = (trackIndex: number) => {
    const track = TRACKS[trackIndex]
    setCurrentTrackIndex(trackIndex)
    setCurrentTrack(track)
    currentTrackRef.current = track

    if (playerRef.current && isPlayerReady) {
      playerRef.current.seekTo(track.startTime, true)
      if (isPlaying) {
        playerRef.current.playVideo()
      }
    }
  }

  const getTrackProgress = () => {
    if (!currentTrack) return 0
    const trackDuration = currentTrack.endTime - currentTrack.startTime
    const trackCurrentTime = Math.max(0, currentTime - currentTrack.startTime)
    return Math.min(100, (trackCurrentTime / trackDuration) * 100)
  }

  const getTrackTimeRemaining = () => {
    if (!currentTrack) return "0:00"
    const remaining = Math.max(0, currentTrack.endTime - currentTime)
    const minutes = Math.floor(remaining / 60)
    const seconds = Math.floor(remaining % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  return {
    isPlaying,
    volume,
    currentTrack,
    currentTrackIndex,
    isMuted,
    isFavorite,
    currentTime,
    isShuffleEnabled,
    isPlayerReady,
    tracks: TRACKS,
    togglePlay,
    setVolume,
    nextTrack,
    previousTrack,
    toggleMute,
    toggleFavorite,
    toggleShuffle,
    seekToTrack,
    getTrackProgress,
    getTrackTimeRemaining,
  }
}
