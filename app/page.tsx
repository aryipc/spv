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
        <header className="text-center py-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="animate-float">
              <Sparkles className="h-10 w-10 text-secondary" />
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-white drop-shadow-lg uppercase tracking-wide">
              🎨 AI Art Factory! 🎨
            </h1>
            <div className="animate-float" style={{ animationDelay: "0.5s" }}>
              <Sparkles className="h-10 w-10 text-secondary" />
            </div>
          </div>
          <div className="bg-secondary/20 backdrop-blur-md rounded-xl p-4 max-w-3xl mx-auto border-3 border-secondary">
            <p className="text-xl text-white font-bold drop-shadow-md">
              🚀 Transform your boring images into AWESOME masterpieces! 🚀
            </p>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-4 pb-12">
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="south-park-card paper-texture">
              <CardContent className="p-8">
                <div className="bg-primary/20 rounded-lg p-4 mb-6 border-2 border-dashed border-primary">
                  <h2 className="text-3xl font-black text-card-foreground uppercase tracking-wide text-center">
                    📤 Upload Zone! 📤
                  </h2>
                </div>

                <div className="border-4 border-dashed border-border rounded-xl p-8 text-center hover:border-primary hover:bg-primary/10 transition-all duration-300 paper-texture">
                  <input type="file" accept="image/*" onChange={handleFileSelect} className="hidden" id="file-upload" />
                  <label htmlFor="file-upload" className="cursor-pointer block">
                    {previewUrl ? (
                      <div className="space-y-4">
                        <div className="border-4 border-secondary rounded-xl p-2 bg-secondary/20">
                          <img
                            src={previewUrl || "/placeholder.svg"}
                            alt="Preview"
                            className="max-w-full max-h-64 mx-auto rounded-lg border-2 border-border"
                          />
                        </div>
                        <div className="bg-card rounded-lg p-3 border-2 border-border">
                          <p className="text-sm text-card-foreground font-bold">🔄 Click to change image</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="animate-float">
                          <Upload className="mx-auto h-20 w-20 text-primary" />
                        </div>
                        <div className="bg-card rounded-lg p-4 border-2 border-border">
                          <p className="text-xl font-black text-card-foreground">🎪 Drop your image here! 🎪</p>
                          <p className="text-sm text-muted-foreground mt-2">or click to browse your files</p>
                        </div>
                      </div>
                    )}
                  </label>
                </div>

                <Button
                  onClick={handleGenerate}
                  disabled={!selectedFile || isGenerating}
                  className="w-full mt-6 south-park-button text-primary-foreground text-xl py-6"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-6 w-6 animate-spin" />🎭 Making Magic...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-6 w-6" />🚀 Create Awesome Art!
                    </>
                  )}
                </Button>

                {error && (
                  <div className="mt-4 p-4 bg-destructive/20 border-2 border-destructive rounded-lg">
                    <p className="text-destructive font-bold text-center">⚠️ {error}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="south-park-card paper-texture">
              <CardContent className="p-8">
                <div className="bg-accent/20 rounded-lg p-4 mb-6 border-2 border-dashed border-accent">
                  <h2 className="text-3xl font-black text-card-foreground uppercase tracking-wide text-center">
                    🎨 Your Masterpiece! 🎨
                  </h2>
                </div>

                <div className="border-4 border-dashed border-border rounded-xl p-8 min-h-[400px] flex items-center justify-center paper-texture">
                  {isGenerating ? (
                    <div className="text-center space-y-4">
                      <Loader2 className="mx-auto h-20 w-20 animate-spin text-primary" />
                      <div className="bg-card rounded-lg p-4 border-2 border-border">
                        <p className="text-xl font-black text-card-foreground">🎪 Creating your masterpiece...</p>
                        <p className="text-sm text-muted-foreground mt-2">This might take a few moments!</p>
                      </div>
                    </div>
                  ) : generatedImage ? (
                    <div className="space-y-4 w-full animate-fade-in-up">
                      <div className="border-4 border-accent rounded-xl p-2 bg-accent/20">
                        <img
                          src={generatedImage || "/placeholder.svg"}
                          alt="Generated"
                          className="max-w-full max-h-full mx-auto rounded-lg border-2 border-border"
                        />
                      </div>
                      <div className="text-center">
                        <Button
                          onClick={() => {
                            const link = document.createElement("a")
                            link.href = generatedImage
                            link.download = "south-park-masterpiece.jpg"
                            link.click()
                          }}
                          className="south-park-button text-primary-foreground"
                        >
                          💾 Download Your Art!
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center space-y-4 animate-float">
                      <div className="w-24 h-24 bg-accent/30 rounded-xl flex items-center justify-center mx-auto border-3 border-accent">
                        <Sparkles className="h-12 w-12 text-accent" />
                      </div>
                      <div className="bg-card rounded-lg p-4 border-2 border-border">
                        <p className="text-card-foreground font-bold text-lg">
                          🎪 Your awesome creation will appear here!
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>

        <footer className="text-center py-8 border-t-4 border-secondary bg-secondary/20 backdrop-blur-sm">
          <div className="bg-card rounded-lg p-3 border-2 border-border max-w-md mx-auto">
            <p className="text-sm text-card-foreground font-bold">
              🎨 Powered by AI Magic •{" "}
              <a href="/simple" className="text-primary hover:text-accent hover:underline font-black">
                🔧 Debug Mode
              </a>
            </p>
          </div>
        </footer>
      </div>
    </div>
  )
}
