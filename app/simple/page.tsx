"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Upload, Loader2, Sparkles } from "lucide-react"

export default function HomePage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

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
      setError("Please upload an image first")
      return
    }

    setIsGenerating(true)
    setGeneratedImage(null)
    setError(null)

    try {
      // First analyze the image to get prompt
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

      // Then generate the image
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

      <div className="relative z-20">
        {/* Header */}
        <header className="text-center py-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="h-8 w-8 text-primary" />
            <h1 className="text-4xl md:text-5xl font-bold text-white drop-shadow-lg">AI Image Generator</h1>
          </div>
          <p className="text-lg text-white/90 max-w-2xl mx-auto px-4 drop-shadow-md">
            Transform your images with the power of AI. Upload an image and watch it come to life in new styles.
          </p>
        </header>

        {/* Main Content */}
        <main className="max-w-6xl mx-auto px-4 pb-12">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Upload Area */}
            <Card className="bg-black/20 backdrop-blur-xl border-white/20 shadow-2xl hover:bg-black/25 transition-all duration-300">
              <CardContent className="p-8">
                <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4 mb-6">
                  <h2 className="text-2xl font-semibold text-white drop-shadow-lg">Upload Your Image</h2>
                </div>

                <div className="border-2 border-dashed border-white/30 rounded-xl p-8 text-center hover:border-primary/70 hover:bg-black/10 transition-all duration-300 bg-black/10 backdrop-blur-md shadow-inner">
                  <input type="file" accept="image/*" onChange={handleFileSelect} className="hidden" id="file-upload" />
                  <label htmlFor="file-upload" className="cursor-pointer block">
                    {previewUrl ? (
                      <div className="space-y-4">
                        <img
                          src={previewUrl || "/placeholder.svg"}
                          alt="Preview"
                          className="max-w-full max-h-64 mx-auto rounded-lg shadow-2xl ring-2 ring-white/20 hover:ring-primary/50 transition-all duration-300"
                        />
                        <div className="bg-black/40 backdrop-blur-sm rounded px-3 py-1 inline-block">
                          <p className="text-sm text-white drop-shadow-md">Click to change image</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <Upload className="mx-auto h-16 w-16 text-white/90 drop-shadow-lg" />
                        <div className="bg-black/40 backdrop-blur-sm rounded-lg p-4 inline-block">
                          <p className="text-lg font-medium text-white drop-shadow-md">Drop your image here</p>
                          <p className="text-sm text-white/90 drop-shadow-md">or click to browse</p>
                        </div>
                      </div>
                    )}
                  </label>
                </div>

                <Button
                  onClick={handleGenerate}
                  disabled={!selectedFile || isGenerating}
                  className="w-full mt-6 h-12 text-lg bg-primary/90 hover:bg-primary backdrop-blur-sm text-white shadow-2xl hover:shadow-primary/25 hover:scale-[1.02] transition-all duration-300 border border-primary/30"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      Generate AI Image
                    </>
                  )}
                </Button>

                {error && (
                  <div className="mt-4 p-3 bg-red-900/40 backdrop-blur-md border border-red-400/30 rounded-lg shadow-lg">
                    <p className="text-red-100 text-sm drop-shadow-md">{error}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Output Area */}
            <Card className="bg-black/20 backdrop-blur-xl border-white/20 shadow-2xl hover:bg-black/25 transition-all duration-300">
              <CardContent className="p-8">
                <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4 mb-6">
                  <h2 className="text-2xl font-semibold text-white drop-shadow-lg">Generated Result</h2>
                </div>

                <div className="border-2 border-dashed border-white/30 rounded-xl p-8 min-h-[400px] flex items-center justify-center bg-black/10 backdrop-blur-md shadow-inner">
                  {isGenerating ? (
                    <div className="text-center space-y-4">
                      <Loader2 className="mx-auto h-16 w-16 animate-spin text-primary drop-shadow-lg" />
                      <div className="bg-black/40 backdrop-blur-sm rounded-lg p-4">
                        <p className="text-lg font-medium text-white drop-shadow-md">Creating magic...</p>
                        <p className="text-sm text-white/90 drop-shadow-md">This may take a few moments</p>
                      </div>
                    </div>
                  ) : generatedImage ? (
                    <div className="space-y-4 w-full">
                      <img
                        src={generatedImage || "/placeholder.svg"}
                        alt="Generated"
                        className="max-w-full max-h-full mx-auto rounded-lg shadow-2xl ring-2 ring-white/20 hover:ring-primary/50 transition-all duration-300"
                      />
                      <div className="text-center">
                        <Button
                          onClick={() => {
                            const link = document.createElement("a")
                            link.href = generatedImage
                            link.download = "generated-image.jpg"
                            link.click()
                          }}
                          variant="outline"
                          className="border-white/30 text-white hover:bg-white/10 backdrop-blur-md shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                        >
                          Download Image
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center space-y-2">
                      <Sparkles className="mx-auto h-12 w-12 text-white/70 drop-shadow-lg" />
                      <div className="bg-black/40 backdrop-blur-sm rounded px-4 py-2 inline-block">
                        <p className="text-white drop-shadow-md">Your generated image will appear here</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>

        {/* Footer */}
        <footer className="text-center py-8 border-t border-white/20 bg-black/20 backdrop-blur-sm">
          <p className="text-sm text-white/80">
            Powered by AI •{" "}
            <a href="/simple" className="text-primary hover:underline">
              Debug Mode
            </a>
          </p>
        </footer>
      </div>
    </div>
  )
}
