"use client"

import { useState, useEffect, useRef } from "react"

interface Track {
  id: string
  title: string
  artist: string
  duration: number
}

const SAMPLE_TRACKS: Track[] = [
  { id: "1", title: "Chill Vibes", artist: "LoFi Collective", duration: 180 },
  { id: "2", title: "Study Session", artist: "Ambient Sounds", duration: 240 },
  { id: "3", title: "Focus Flow", artist: "Peaceful Beats", duration: 200 },
  { id: "4", title: "Calm Waters", artist: "Nature Sounds", duration: 300 },
]

export function useMediaPlayer() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolumeState] = useState(70)
  const [isMuted, setIsMuted] = useState(false)
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0)
  const [isFavorite, setIsFavorite] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const previousVolumeRef = useRef(70)

  const currentTrack = SAMPLE_TRACKS[currentTrackIndex]?.title || "LoFi Hip Hop - Chill Beats"

  // Initialize audio element
  useEffect(() => {
    audioRef.current = new Audio()
    audioRef.current.volume = volume / 100

    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  // Update volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume / 100
    }
  }, [volume, isMuted])

  const togglePlay = () => {
    setIsPlaying(!isPlaying)
    // In a real app, this would control actual audio playback
    console.log(isPlaying ? "Pausing" : "Playing", currentTrack)
  }

  const setVolume = (newVolume: number) => {
    setVolumeState(newVolume)
    if (newVolume > 0 && isMuted) {
      setIsMuted(false)
    }
  }

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false)
      setVolumeState(previousVolumeRef.current)
    } else {
      previousVolumeRef.current = volume
      setIsMuted(true)
    }
  }

  const nextTrack = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % SAMPLE_TRACKS.length)
    console.log("Next track:", SAMPLE_TRACKS[(currentTrackIndex + 1) % SAMPLE_TRACKS.length]?.title)
  }

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite)
    console.log(isFavorite ? "Removed from favorites" : "Added to favorites")
  }

  return {
    isPlaying,
    volume,
    currentTrack,
    isMuted,
    isFavorite,
    currentTime,
    togglePlay,
    setVolume,
    nextTrack,
    toggleMute,
    toggleFavorite,
  }
}
