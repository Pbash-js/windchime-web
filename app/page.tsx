"use client"

import { useEffect, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useLoading } from "@/contexts/loading-context"
import { LoadingScreen } from "@/components/loading-screen"
import { WelcomeModal } from "@/components/welcome-modal"
import { WindowManager } from "@/components/window-manager"
import { useFirestorePreferences } from "@/hooks/use-firestore-preferences"
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
  const { preferences, loading: prefsLoading } = useFirestorePreferences()
  const [contentLoaded, setContentLoaded] = useState(false)

  // Mark content as loaded when all data is ready
  useEffect(() => {
    if (!prefsLoading && !contentLoaded) {
      // Mark as loaded after a short delay for smooth transition
      const timer = setTimeout(() => {
        setContentLoaded(true)
        markAsLoaded()
      }, 1000)
      
      return () => clearTimeout(timer)
    }
  }, [prefsLoading, markAsLoaded, contentLoaded])

  // Show welcome modal only for new users or first visit
  useEffect(() => {
    if (contentLoaded) {
      const hasVisited = localStorage.getItem("lofizen-visited")
      setShowWelcome(!hasVisited)
    }
  }, [contentLoaded])

  // Update background image when preferences change
  useEffect(() => {
    if (preferences?.backgroundScene) {
      const backgroundMap: Record<string, string> = {
        bedroom: "/images/bedroom-scene.png",
        library: "/images/library-scene.png",
        nature: "/images/nature-scene.png",
        office: "/images/office-scene.png",
      }
      
      const newBackground = backgroundMap[preferences.backgroundScene as keyof typeof backgroundMap] || availableBackgrounds[0]
      setBackgroundImage(newBackground)
    }
  }, [preferences?.backgroundScene])

  const handleWelcomeClose = useCallback(() => {
    setShowWelcome(false)
    localStorage.setItem("lofizen-visited", "true")
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
              className="fixed inset-0 -z-10 bg-cover bg-center transition-opacity duration-500"
              style={{ 
                backgroundImage: `url(${backgroundImage})`,
                opacity: contentLoaded ? 1 : 0,
                transition: 'opacity 0.5s ease-in-out'
              }}
            >
              <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
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
