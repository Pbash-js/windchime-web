"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

const TEXTS = [
  "Loading your digital sanctuary...",
  "Preparing your workspace...",
  "Almost there..."
]

export function LoadingScreen({ isLoading }: { isLoading: boolean }) {
  const [currentTextIndex, setCurrentTextIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(false)

  // Text rotation effect
  useEffect(() => {
    if (!isLoading) return
    
    const interval = setInterval(() => {
      setCurrentTextIndex((prev) => (prev + 1) % TEXTS.length)
    }, 3000)

    return () => clearInterval(interval)
  }, [isLoading])

  // Handle visibility with a small delay to allow for smooth transitions
  useEffect(() => {
    if (isLoading) {
      setIsVisible(true)
    } else {
      // Add a small delay before hiding to allow exit animation to complete
      const timer = setTimeout(() => setIsVisible(false), 500)
      return () => clearTimeout(timer)
    }
  }, [isLoading])

  if (!isVisible) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
        className="fixed inset-0 z-[9999] flex items-center justify-center"
      >
        {/* Background video */}
        <div className="absolute inset-0 overflow-hidden">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          >
            <source src="/images/bedroom-scene.webm" type="video/webm" />
          </video>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
        </div>

        {/* Main content */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{
            scale: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
            opacity: { duration: 0.4, ease: "easeOut" }
          }}
          className="relative w-full max-w-md aspect-square p-8"
        >
          {/* Glass card */}
          <div className="absolute inset-0 bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl" />
          
          {/* Animated border */}
          <motion.div 
            className="absolute inset-0 rounded-3xl p-[1px]"
            style={{
              background: 'linear-gradient(45deg, rgba(255,255,255,0.1), rgba(255,255,255,0.3), rgba(255,255,255,0.1))',
              WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              WebkitMaskComposite: 'xor',
              maskComposite: 'exclude',
              padding: '1px'
            }}
            animate={{
              backgroundPosition: ['0% 0%', '200% 200%']
            }}
            transition={{
              backgroundPosition: {
                duration: 8,
                repeat: Infinity,
                ease: 'linear',
                repeatType: 'reverse'
              }
            }}
          />

          {/* Content */}
          <div className="relative z-10 h-full flex flex-col items-center justify-center text-center">
            <motion.div
              className="w-24 h-24 mb-6 relative"
              initial={{ scale: 0.8, opacity: 0, rotate: -15 }}
              animate={{ 
                scale: 1, 
                opacity: 1, 
                rotate: 0,
                transition: { 
                  type: 'spring',
                  damping: 10,
                  stiffness: 100
                }
              }}
            >
              <div className="w-full h-full rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                <img 
                  src="/images/windchimefavicon.ico" 
                  alt="Windchime Logo" 
                  className="w-12 h-12"
                />
              </div>
            </motion.div>

            {/* Text */}
            <div className="h-8 mb-8 overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentTextIndex}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -20, opacity: 0 }}
                  transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                  className="text-lg font-medium text-white/90"
                >
                  {TEXTS[currentTextIndex]}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Progress indicator */}
            <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  repeatType: 'reverse',
                  ease: 'easeInOut'
                }}
                className="h-full bg-gradient-to-r from-blue-400 to-purple-400 rounded-full"
              />
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
