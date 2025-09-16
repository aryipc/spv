"use client"

import type React from "react"

import { useState, useRef } from "react"

const Upload = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
    />
  </svg>
)

const Loader2 = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
    />
  </svg>
)

const Sparkles = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M5 3l1.5 1.5L5 6l-1.5-1.5L5 3zM19 3l1.5 1.5L19 6l-1.5-1.5L19 3zM12 8l1.5 1.5L12 11l-1.5-1.5L12 8zM5 21l1.5-1.5L5 18l-1.5 1.5L5 21zM19 21l1.5-1.5L19 18l-1.5 1.5L19 21z"
    />
  </svg>
)

const ChevronDown = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
)

const Play = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M8 5v14l11-7z" />
  </svg>
)

const Pause = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
  </svg>
)

const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={className}>{children}</div>
)

const CardContent = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={className}>{children}</div>
)

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
  const [isDraggingOver, setIsDraggingOver] = useState(false) // New state for drag-and-drop
  const audioRef = useRef<HTMLAudioElement>(null)

  const scrollToArtFactory = () => {
    document.getElementById("art-factory-section")?.scrollIntoView({
      behavior: "smooth",
    })
  }
  
  // Helper function to process the selected file
  const processFile = (file: File | undefined | null) => {
    if (file && file.type.startsWith("image/")) {
        setSelectedFile(file)
        const url = URL.createObjectURL(file)
        setPreviewUrl(url)
        setError(null)
    } else if (file) {
        setError("Please upload a valid image file.")
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    processFile(file)
  }
  
  // New: Drag and drop handlers
  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDraggingOver(true)
  }

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDraggingOver(false)
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDraggingOver(false)
    const file = event.dataTransfer.files?.[0]
    processFile(file)
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
        throw new Error("Failed to generate description")
      }

      const generateForm = new FormData()
      generateForm.append("image", selectedFile)
      generateForm.append("prompt", prompt)

      const generateResponse = await fetch("/api/generate", {
        method: "POST",
        body: generateForm,
      })

      if (!generateResponse.ok) {
        throw new Error("Image generation failed")
      }

      const generateData = await generateResponse.json()

      if (generateData.error) {
        throw new Error(generateData.error)
      }

      if (generateData.imageUrl) {
        setGeneratedImage(generateData.imageUrl)
      } else {
        throw new Error("No image was generated")
      }
    } catch (error) {
      console.error("Generation failed:", error)
      setError(error instanceof Error ? error.message : "Generation failed")
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

      <div className="fixed top-4 right-4 z-30">
        <SimpleButton onClick={toggleAudio} className="text-sm px-4 py-2">
          {isPlaying ? (
            <>
              <Pause className="mr-1 h-4 w-4" />
              Music Off
            </>
          ) : (
            <>
              <Play className="mr-1 h-4 w-4" />
              Music On
            </>
          )}
        </SimpleButton>
      </div>

      <div className="relative z-20">
        <section className="min-h-screen flex flex-col items-center justify-center text-center px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-black text-white drop-shadow-lg uppercase tracking-wider mb-6 animate-bounce">
              $SPVERSE
            </h1>
            <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold text-yellow-400 drop-shadow-lg uppercase tracking-wide mb-12">
              Join the South Park Universe
            </h2>
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
              <a
                href="https://x.com/SouthPark_verse"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 text-xl
                  bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg border-4 border-black
                  shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
                  hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-150"
              >
                🐦 Follow X
              </a>
              <a
                href="https://x.com/i/communities/1966768241793265996"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 text-xl
                  bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg border-4 border-black
                  shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
                  hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-150"
              >
                🏠 Join Community
              </a>
              <a
                href="https://pump.fun/board"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 text-xl
                  bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg border-4 border-black
                  shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
                  hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-150"
              >
                📊 Open Chart
              </a>
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
                Oh My God! You Are In the Universe!
              </h1>
              <div className="animate-bounce" style={{ animationDelay: "0.5s" }}>
                <Sparkles className="h-10 w-10 text-yellow-400" />
              </div>
            </div>
            <div className="bg-black/80 backdrop-blur-md rounded-xl p-4 max-w-3xl mx-auto border-3 border-yellow-400">
              <p className="text-xl text-white font-bold drop-shadow-lg shadow-black/50">
                Turn your photos into EPIC South Park masterpieces! No more waiting.
              </p>
            </div>
          </header>

          <main className="max-w-6xl mx-auto px-4 pb-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
              <Card className="bg-black/80 backdrop-blur-md rounded-xl border-3 border-yellow-400">
                <CardContent className="p-4 sm:p-6 lg:p-8">
                  <div className="bg-black/80 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 border-2 border-dashed border-yellow-400">
                    <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-wide text-center">
                      Respect My Upload Zone
                    </h2>
                  </div>
                  
                  {/* --- MODIFIED DROP ZONE --- */}
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`
                      border-4 border-dashed rounded-xl p-4 sm:p-6 lg:p-8 text-center transition-all duration-300
                      ${isDraggingOver ? 'border-yellow-400 bg-yellow-400/20' : 'border-white hover:border-yellow-400 hover:bg-yellow-400/10'}
                    `}
                  >
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
                          <div className="border-4 border-yellow-400 rounded-xl p-2 bg-black/80">
                            <img
                              src={previewUrl || "/placeholder.svg"}
                              alt="Preview"
                              className="max-w-full max-h-48 sm:max-h-64 mx-auto rounded-lg border-2 border-white"
                            />
                          </div>
                          <div className="bg-white rounded-lg p-2 sm:p-3 border-2 border-white">
                            <p className="text-xs sm:text-sm text-black font-bold">
                              Replace this image, upload another one
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3 sm:space-y-4">
                          <div className="animate-bounce">
                            <Upload className="mx-auto h-16 w-16 sm:h-20 sm:w-20 text-yellow-400" />
                          </div>
                          <div className="bg-white rounded-lg p-3 sm:p-4 border-2 border-white">
                            <p className="text-lg sm:text-xl font-black text-black">Drop your photo here</p>
                            <p className="text-xs sm:text-sm text-gray-500 mt-2">or click to select an image</p>
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
                        <Loader2 className="mr-2 h-5 w-5 sm:h-6 sm:w-6 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-5 w-5 sm:h-6 sm:w-6" />
                        Generate Image
                      </>
                    )}
                  </SimpleButton>

                  {error && (
                    <div className="mt-4 p-3 sm:p-4 bg-red-500/20 border-2 border-red-500 rounded-lg">
                      <p className="text-red-500 font-bold text-center text-sm sm:text-base">Error: {error}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-black/80 backdrop-blur-md rounded-xl border-3 border-yellow-400">
                <CardContent className="p-4 sm:p-6 lg:p-8">
                  <div className="bg-black/80 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 border-2 border-dashed border-yellow-400">
                    <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-wide text-center">
                      Your Masterpiece
                    </h2>
                  </div>

                  <div className="border-4 border-dashed border-white rounded-xl p-4 sm:p-6 lg:p-8 min-h-[300px] sm:min-h-[400px] flex items-center justify-center">
                    {isGenerating ? (
                      <div className="text-center space-y-3 sm:space-y-4">
                        <Loader2 className="mx-auto h-16 w-16 sm:h-20 sm:w-20 animate-spin text-yellow-400" />
                        <div className="bg-white rounded-lg p-3 sm:p-4 border-2 border-white">
                          <p className="text-lg sm:text-xl font-black text-black">Generating your masterpiece...</p>
                          <p className="text-xs sm:text-sm text-gray-500 mt-2">
                            Please wait while we work on your art.
                          </p>
                        </div>
                      </div>
                    ) : generatedImage ? (
                      <div className="space-y-3 sm:space-y-4 w-full animate-fade-in-up">
                        <div className="border-4 border-yellow-400 rounded-xl p-2 bg-black/80">
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
                            Download Image
                          </SimpleButton>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center space-y-3 sm:space-y-4 animate-bounce">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-black/80 rounded-xl flex items-center justify-center mx-auto border-3 border-yellow-400">
                          <Sparkles className="h-10 w-10 sm:h-12 sm:w-12 text-yellow-400" />
                        </div>
                        <div className="bg-white rounded-lg p-3 sm:p-4 border-2 border-white">
                          <p className="text-black font-bold text-base sm:text-lg">
                            Your generated image will appear here
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
              <p className="text-sm text-black font-bold">
                Powered by South Park Universe Team (and lots of Cheesy Poofs)
              </p>
            </div>
          </footer>
        </section>
      </div>
    </div>
  )
}
