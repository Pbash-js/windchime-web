"use client"

import { useEffect, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useLoading } from "@/contexts/loading-context"
import { LoadingScreen } from "@/components/loading-screen"
import { WelcomeModal } from "@/components/welcome-modal"
import { WindowManager } from "@/components/window-manager"
import { usePreferences } from "@/contexts/preferences-context"
import { useAuth } from "@/contexts/auth-context"
import { useYouTubePlayerStore } from "@/hooks/use-youtube-player"

const backgroundMap: Record<string, {path: string, type: 'image' | 'video'}> = {
  bedroom: { path: "/images/bedroom-scene.webm", type: 'video' },
  library: { path: "/images/library-scene.png", type: 'image' },
  nature: { path: "/images/nature-scene.png", type: 'image' },
  office: { path: "/images/office-scene.png", type: 'image' },
  'arona-cherry-blossom': { path: "https://static.moewalls.com/videos/preview/2025/arona-cherry-blossom-blue-archive-preview.webm", type: 'video' },
  'gojo-kitty': { path: "https://static.moewalls.com/videos/preview/2023/gojo-and-kitty-jujutsu-kaisen-preview.webm", type: 'video' },
  'dragon-slayer': { path: "https://static.moewalls.com/videos/preview/2023/the-dragon-slayer-sword-berserk-preview.webm", type: 'video' },
  'lofi-house': { path: "https://static.moewalls.com/videos/preview/2024/lofi-house-cloudy-day-1-preview.webm", type: 'video' },
  'lofi-furries': { path: "https://static.moewalls.com/videos/preview/2023/lofi-furries-night-camping-preview.webm", type: 'video' },
  'lofi-homework': { path: "https://static.moewalls.com/videos/preview/2022/lofi-girl-doing-homework-preview.webm", type: 'video' },
  'thousand-years': { path: "https://static.moewalls.com/videos/preview/2024/my-wife-is-from-thousand-years-ago-pixel-preview.webm", type: 'video' },
  'train-cloudy': { path: "https://static.moewalls.com/videos/preview/2024/train-cloudy-day-preview.webm", type: 'video' },
  'cat-rain': { path: "https://static.moewalls.com/videos/preview/2023/cat-watching-rain-preview.webm", type: 'video' },
  'autumn-bedroom': { path: "https://static.moewalls.com/videos/preview/2023/autumn-bedroom-preview.webm", type: 'video' },
}

export default function HomePage() {
  const [showWelcome, setShowWelcome] = useState(false)
  const [background, setBackground] = useState(backgroundMap['bedroom'])
  const { isLoading, markAsLoaded } = useLoading()
  const { user } = useAuth()
  const { backgroundScene } = usePreferences()
  const [contentLoaded, setContentLoaded] = useState(false)
  const [hasPlayedRandomTrack, setHasPlayedRandomTrack] = useState(false)
  const { player, isReady, tracks, currentTrack, actions } = useYouTubePlayerStore()

  // Play a random track when the player is ready and content is loaded
  useEffect(() => {
    if (isReady && contentLoaded && !hasPlayedRandomTrack && tracks.length > 0) {
      const randomIndex = Math.floor(Math.random() * tracks.length)
      // Set isPlaying to true before playing the track
      actions.setIsPlaying(true)
      actions.playTrack(randomIndex)
      setHasPlayedRandomTrack(true)
    }
  }, [isReady, contentLoaded, hasPlayedRandomTrack, tracks, actions])

  // Mark content as loaded
  useEffect(() => {
    if (!contentLoaded) {
      // Mark as loaded after a short delay for smooth transition
      const timer = setTimeout(() => {
        setContentLoaded(true)
        markAsLoaded()
      }, 1000)
      
      return () => clearTimeout(timer)
    }
  }, [markAsLoaded, contentLoaded])

  // Show welcome modal only for new users or first visit
  useEffect(() => {
    if (contentLoaded) {
      const hasVisited = localStorage.getItem("windchime-visited")
      setShowWelcome(!hasVisited)
    }
  }, [contentLoaded])

  // Update background when background scene changes with smooth transition
  useEffect(() => {
    const newBackground = backgroundMap[backgroundScene] || backgroundMap['bedroom']
    
    // Only update if the background has changed
    if (newBackground.path !== background.path) {
      // Start fade out
      const bgElement = document.getElementById('background-container')
      if (bgElement) {
        bgElement.style.opacity = '0'
        
        // After fade out, update the background and fade in
        setTimeout(() => {
          setBackground(newBackground)
          // Force reflow
          void bgElement.offsetHeight
          // Fade in
          bgElement.style.transition = 'opacity 0.5s ease-in-out'
          bgElement.style.opacity = '1'
        }, 300) // Match this with the CSS transition duration
      } else {
        // Fallback if element not found
        setBackground(newBackground)
      }
    }
  }, [backgroundScene, background])

  const handleWelcomeClose = useCallback(() => {
    setShowWelcome(false)
    localStorage.setItem("windchime-visited", "true")
  }, [])

  return (
    <div className="relative h-screen w-full overflow-hidden">
      <LoadingScreen isLoading={isLoading} />
      
      <AnimatePresence mode="wait">
        {!isLoading && (
          <motion.div 
            key="app-content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="h-full w-full"
            onAnimationComplete={() => {
              // Ensure loading is marked as complete when animation finishes
              if (isLoading) {
                markAsLoaded()
              }
            }}
          >
            {/* Background */}
            <div 
              id="background-container"
              className="absolute inset-0 w-full h-full transition-opacity duration-500 ease-in-out overflow-hidden"
              style={{
                zIndex: -1,
              }}
            >
              {background.type === 'video' ? (
                <video
                  key={background.path}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                  src={background.path}
                />
              ) : (
                <div 
                  className="w-full h-full bg-cover bg-center bg-no-repeat"
                  style={{
                    backgroundImage: `url(${background.path})`,
                  }}
                />
              )}
            </div>

            {/* Main Content */}
            <div className="relative z-10 h-full w-full">
              {/* Window Manager handles all draggable windows */}
              <WindowManager />
              
              {/* Welcome Modal */}
              {showWelcome && <WelcomeModal onClose={handleWelcomeClose} />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
