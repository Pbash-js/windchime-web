"use client"

import { useEffect, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useLoading } from "@/contexts/loading-context"
import { LoadingScreen } from "@/components/loading-screen"
import { WelcomeModal } from "@/components/welcome-modal"
import { WindowManager } from "@/components/window-manager"
import { usePreferences } from "@/contexts/preferences-context"
import { useAuth } from "@/contexts/auth-context"

const availableBackgrounds = [
  "/images/bedroom-scene.png",
  "/images/library-scene.png",
  "/images/nature-scene.png",
  "/images/office-scene.png"
]

export default function HomePage() {
  const [showWelcome, setShowWelcome] = useState(false)
  const [backgroundImage, setBackgroundImage] = useState(availableBackgrounds[0])
  const { isLoading, markAsLoaded } = useLoading()
  const { user } = useAuth()
  const { backgroundScene } = usePreferences()
  const [contentLoaded, setContentLoaded] = useState(false)

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

  // Update background image when background scene changes with smooth transition
  useEffect(() => {
    const backgroundMap: Record<string, string> = {
      bedroom: "/images/bedroom-scene.png",
      library: "/images/library-scene.png",
      nature: "/images/nature-scene.png",
      office: "/images/office-scene.png",
    }
    
    const newBackground = backgroundMap[backgroundScene] || availableBackgrounds[0]
    
    // Only update if the background has changed
    if (newBackground !== backgroundImage) {
      // Start fade out
      const bgElement = document.getElementById('background-image')
      if (bgElement) {
        bgElement.style.opacity = '0'
        
        // After fade out, update the image and fade in
        setTimeout(() => {
          setBackgroundImage(newBackground)
          // Force reflow
          void bgElement.offsetHeight
          // Fade in
          bgElement.style.transition = 'opacity 0.5s ease-in-out'
          bgElement.style.opacity = '1'
        }, 300) // Match this with the CSS transition duration
      } else {
        // Fallback if element not found
        setBackgroundImage(newBackground)
      }
    }
  }, [backgroundScene, backgroundImage])

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
            {/* Background Image */}
            <div 
              id="background-image"
              className="fixed inset-0 -z-10 bg-cover bg-center transition-opacity duration-300 ease-in-out"
              style={{ 
                backgroundImage: `url(${backgroundImage})`,
                opacity: contentLoaded ? 1 : 0,
                willChange: 'opacity',
                backgroundAttachment: 'fixed'
              }}
            >
              <div className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-300 ease-in-out" />
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
