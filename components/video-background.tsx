"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"

export function VideoBackground() {
  const video1Ref = useRef<HTMLVideoElement>(null)
  const video2Ref = useRef<HTMLVideoElement>(null)
  const [activeVideo, setActiveVideo] = useState<1 | 2>(1)
  const [showFallback, setShowFallback] = useState(false)

  useEffect(() => {
    const initVideo = (videoRef: React.RefObject<HTMLVideoElement>, videoName: string) => {
      if (videoRef.current) {
        console.log(`[v0] Initializing ${videoName}`)

        videoRef.current.addEventListener("canplay", () => {
          console.log(`[v0] ${videoName} can play`)
          setShowFallback(false)
        })

        videoRef.current.addEventListener("error", (e) => {
          console.log(`[v0] ${videoName} error:`, e)
          setShowFallback(true)
        })

        videoRef.current.play().catch((error) => {
          console.log(`[v0] ${videoName} play error:`, error)
          // Don't show fallback for autoplay policy errors
          if (!error.message.includes("interact")) {
            setShowFallback(true)
          }
        })
      }
    }

    initVideo(video1Ref, "Video 1")
    initVideo(video2Ref, "Video 2")
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY
      const windowHeight = window.innerHeight

      // Switch to video 2 when scrolled past the first screen
      const shouldShowVideo2 = scrollY > windowHeight * 0.7

      if (shouldShowVideo2 && activeVideo !== 2) {
        console.log("[v0] Switching to video 2")
        setActiveVideo(2)
      } else if (!shouldShowVideo2 && activeVideo !== 1) {
        console.log("[v0] Switching back to video 1")
        setActiveVideo(1)
      }
    }

    window.addEventListener("scroll", handleScroll)
    handleScroll() // Call once to set initial state
    return () => window.removeEventListener("scroll", handleScroll)
  }, [activeVideo])

  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden z-0">
      <video
        ref={video1Ref}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
          activeVideo === 1 ? "opacity-100" : "opacity-0"
        }`}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
      >
        <source src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/9%E6%9C%8811%E6%97%A5%281%29-kXJ1gsy7cgQHMhAhgDf3WXOOUFF0d6.mp4" type="video/mp4" />
      </video>

      <video
        ref={video2Ref}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
          activeVideo === 2 ? "opacity-100" : "opacity-0"
        }`}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
      >
        <source src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/9%E6%9C%8811%E6%97%A5%281%29-kXJ1gsy7cgQHMhAhgDf3WXOOUFF0d6.mp4" type="video/mp4" />
      </video>

      {showFallback && (
        <div
          className={`absolute inset-0 transition-opacity duration-1000 ${
            activeVideo === 1
              ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
              : "bg-gradient-to-br from-blue-900 via-blue-800 to-slate-900"
          }`}
        />
      )}

      {/* Dark overlay for better text readability */}
      <div className="absolute inset-0 bg-black/30" />
    </div>
  )
}
