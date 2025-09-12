"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Upload, Loader2, Sparkles, ChevronDown, Play, Pause } from "lucide-react"

const SimpleButton = ({
  children,
  onClick,
  disabled = false,
  className = "",
}: {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  className?: string
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`
      inline-flex items-center justify-center gap-2 px-6 py-3 
      bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400
      text-white font-bold rounded-lg border-4 border-black
      shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
      hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-150
      disabled:cursor-not-allowed disabled:hover:translate-x-0 disabled:hover:translate-y-0
      disabled:hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
      ${className}
    `}
  >
    {children}
  </button>
)

export default function HomePage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  const scrollToArtFactory = () => {
    document.getElementById("art-factory-section")?.scrollIntoView({
      behavior: "smooth",
    })
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
      setError(null)
    }
  }

  const handleGenerate = async () => {
    if (!selectedFile) {
      setError("Please upload the image first")
      return
    }

    setIsGenerating(true)
    setGeneratedImage(null)
    setError(null)

    try {
      const analyzeForm = new FormData()
      analyzeForm.append("image", selectedFile)

      const analyzeResponse = await fetch("/api/analyze", {
        method: "POST",
        body: analyzeForm,
      })

      if (!analyzeResponse.ok) {
        throw new Error("Image analysis failed")
      }

      const analyzeData = await analyzeResponse.json()
      const prompt = analyzeData.prompt

      if (!prompt) {
        throw new Error("无法生成描述")
      }

      const generateForm = new FormData()
      generateForm.append("image", selectedFile)
      generateForm.append("prompt", prompt)

      const generateResponse = await fetch("/api/generate", {
        method: "POST",
        body: generateForm,
      })

      if (!generateResponse.ok) {
        throw new Error("图片生成失败")
      }

      const generateData = await generateResponse.json()

      if (generateData.error) {
        throw new Error(generateData.error)
      }

      if (generateData.imageUrl) {
        setGeneratedImage(generateData.imageUrl)
      } else {
        throw new Error("未能生成图片")
      }
    } catch (error) {
      console.error("Generation failed:", error)
      setError(error instanceof Error ? error.message : "生成失败")
    } finally {
      setIsGenerating(false)
    }
  }

  const toggleAudio = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
        setIsPlaying(false)
      } else {
        audioRef.current.play()
        setIsPlaying(true)
      }
    }
  }

  const handleAudioEnded = () => {
    setIsPlaying(false)
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="fixed inset-0 w-full h-full object-cover z-0"
        style={{ minWidth: "100%", minHeight: "100%" }}
      >
        <source src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/9%E6%9C%8811%E6%97%A5%281%29-kXJ1gsy7cgQHMhAhgDf3WXOOUFF0d6.mp4" type="video/mp4" />
      </video>

      <div className="absolute inset-0 bg-black/40 z-10"></div>

      <audio ref={audioRef} onEnded={handleAudioEnded} preload="auto">
        <source src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/We%20were%20sittin_%20in%20class_%20watchin_%20Fox%20a-Fl77ZbUMdpw7zahKjYzBS8bBZ26YvS.mp3" type="audio/mpeg" />
      </audio>

      <div className="relative z-20">
        <section className="min-h-screen flex flex-col items-center justify-center text-center px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-black text-white drop-shadow-lg uppercase tracking-wider mb-6 animate-bounce">
              $SPVERSE
            </h1>
            <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold text-yellow-400 drop-shadow-lg uppercase tracking-wide mb-12">
              JOIN THE SOUTHPARK UNIVERSE
            </h2>
            <div className="mb-8">
              <SimpleButton onClick={toggleAudio} className="text-xl px-8 py-4 mb-6">
                {isPlaying ? (
                  <>
                    <Pause className="mr-2 h-6 w-6" />🎵 Pause Theme
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-6 w-6" />🎵 Play Theme
                  </>
                )}
              </SimpleButton>
            </div>
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
              <SimpleButton className="text-xl px-8 py-4">🐦 Follow X</SimpleButton>
              <SimpleButton className="text-xl px-8 py-4">🏠 Join Community</SimpleButton>
            </div>
          </div>

          <div
            className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce cursor-pointer"
            onClick={scrollToArtFactory}
          >
            <ChevronDown className="h-8 w-8 text-white" />
            <p className="text-white font-bold mt-2">Scroll Down</p>
          </div>
        </section>

        <section id="art-factory-section" className="min-h-screen">
          <header className="text-center py-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="animate-bounce">
                <Sparkles className="h-10 w-10 text-yellow-400" />
              </div>
              <h1 className="text-5xl md:text-6xl font-black text-white drop-shadow-lg uppercase tracking-wide">
                🎨 Oh My God! AI Art Factory! 🎨
              </h1>
              <div className="animate-bounce" style={{ animationDelay: "0.5s" }}>
                <Sparkles className="h-10 w-10 text-yellow-400" />
              </div>
            </div>
            <div className="bg-black/80 backdrop-blur-md rounded-xl p-4 max-w-3xl mx-auto border-3 border-yellow-400">
              <p className="text-xl text-white font-bold drop-shadow-lg shadow-black/50">
                🚀 Sweet! Turn your lame photos into EPIC South Park masterpieces! No more boring selfies, mkay? 🚀
              </p>
            </div>
          </header>

          <main className="max-w-6xl mx-auto px-4 pb-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
              <Card className="bg-black/80 backdrop-blur-md rounded-xl border-3 border-yellow-400">
                <CardContent className="p-4 sm:p-6 lg:p-8">
                  <div className="bg-yellow-400/20 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 border-2 border-dashed border-yellow-400">
                    <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-wide text-center">
                      📤 Respect My Upload Zone! 📤
                    </h2>
                  </div>

                  <div className="border-4 border-dashed border-white rounded-xl p-4 sm:p-6 lg:p-8 text-center hover:border-yellow-400 hover:bg-yellow-400/10 transition-all duration-300">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="file-upload"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer block">
                      {previewUrl ? (
                        <div className="space-y-3 sm:space-y-4">
                          <div className="border-4 border-yellow-400 rounded-xl p-2 bg-yellow-400/20">
                            <img
                              src={previewUrl || "/placeholder.svg"}
                              alt="Preview"
                              className="max-w-full max-h-48 sm:max-h-64 mx-auto rounded-lg border-2 border-white"
                            />
                          </div>
                          <div className="bg-white rounded-lg p-2 sm:p-3 border-2 border-white">
                            <p className="text-xs sm:text-sm text-black font-bold">
                              🔄 Screw this pic, upload another one!
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3 sm:space-y-4">
                          <div className="animate-bounce">
                            <Upload className="mx-auto h-16 w-16 sm:h-20 sm:w-20 text-yellow-400" />
                          </div>
                          <div className="bg-white rounded-lg p-3 sm:p-4 border-2 border-white">
                            <p className="text-lg sm:text-xl font-black text-black">
                              🎪 Dude! Drop your crappy photo here! 🎪
                            </p>
                            <p className="text-xs sm:text-sm text-gray-500 mt-2">
                              or click to find that perfect pic, you guys!
                            </p>
                          </div>
                        </div>
                      )}
                    </label>
                  </div>

                  <SimpleButton
                    onClick={handleGenerate}
                    disabled={!selectedFile || isGenerating}
                    className="w-full mt-4 sm:mt-6 text-lg sm:text-xl py-4 sm:py-6"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 sm:h-6 sm:w-6 animate-spin" />🎭 Oh snap! Making magic
                        happen...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-5 w-5 sm:h-6 sm:w-6" />🚀 Make Me Look AWESOME!
                      </>
                    )}
                  </SimpleButton>

                  {error && (
                    <div className="mt-4 p-3 sm:p-4 bg-red-500/20 border-2 border-red-500 rounded-lg">
                      <p className="text-red-500 font-bold text-center text-sm sm:text-base">⚠️ {error}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-black/80 backdrop-blur-md rounded-xl border-3 border-yellow-400">
                <CardContent className="p-4 sm:p-6 lg:p-8">
                  <div className="bg-yellow-400/20 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 border-2 border-dashed border-yellow-400">
                    <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-wide text-center">
                      🎨 Holy Crap! Your Masterpiece! 🎨
                    </h2>
                  </div>

                  <div className="border-4 border-dashed border-white rounded-xl p-4 sm:p-6 lg:p-8 min-h-[300px] sm:min-h-[400px] flex items-center justify-center">
                    {isGenerating ? (
                      <div className="text-center space-y-3 sm:space-y-4">
                        <Loader2 className="mx-auto h-16 w-16 sm:h-20 sm:w-20 animate-spin text-yellow-400" />
                        <div className="bg-white rounded-lg p-3 sm:p-4 border-2 border-white">
                          <p className="text-lg sm:text-xl font-black text-black">
                            🎪 Kenny's working on your masterpiece...
                          </p>
                          <p className="text-xs sm:text-sm text-gray-500 mt-2">
                            Don't kill Kenny while we work our magic!
                          </p>
                        </div>
                      </div>
                    ) : generatedImage ? (
                      <div className="space-y-3 sm:space-y-4 w-full animate-fade-in-up">
                        <div className="border-4 border-yellow-400 rounded-xl p-2 bg-yellow-400/20">
                          <img
                            src={generatedImage || "/placeholder.svg"}
                            alt="Generated"
                            className="max-w-full max-h-full mx-auto rounded-lg border-2 border-white"
                          />
                        </div>
                        <div className="text-center">
                          <SimpleButton
                            onClick={() => {
                              const link = document.createElement("a")
                              link.href = generatedImage
                              link.download = "south-park-masterpiece.jpg"
                              link.click()
                            }}
                            className="text-sm sm:text-base px-4 sm:px-6 py-2 sm:py-3"
                          >
                            💾 Sweet! Download This Epic Art!
                          </SimpleButton>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center space-y-3 sm:space-y-4 animate-bounce">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-yellow-400/30 rounded-xl flex items-center justify-center mx-auto border-3 border-yellow-400">
                          <Sparkles className="h-10 w-10 sm:h-12 sm:w-12 text-yellow-400" />
                        </div>
                        <div className="bg-white rounded-lg p-3 sm:p-4 border-2 border-white">
                          <p className="text-black font-bold text-base sm:text-lg">
                            🎪 Dude! Your totally awesome creation will show up here!
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>

          <footer className="text-center py-8 border-t-4 border-yellow-400 bg-yellow-400/20 backdrop-blur-sm">
            <div className="bg-white rounded-lg p-3 border-2 border-white max-w-md mx-auto">
              <p className="text-sm text-black font-bold">🎭 Powered by AI Magic (and lots of Cheesy Poofs)</p>
            </div>
          </footer>
        </section>
      </div>
    </div>
  )
}
