"use client"

import type React from "react"
import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Upload, X, ImageIcon, Wand2, Loader2 } from "lucide-react"

interface ImageUploadProps {
  onImageGenerated: (imageUrl: string) => void
}

export function ImageUpload({ onImageGenerated }: ImageUploadProps) {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [prompt, setPrompt] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)

  const handleFileUpload = useCallback((file: File) => {
    if (file && file.type.startsWith("image/")) {
      setUploadedFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      const files = Array.from(e.dataTransfer.files)
      if (files.length > 0) {
        const file = files[0]
        if (file.type.startsWith("image/")) {
          handleFileUpload(file)
        } else {
          alert("🚫 Please drop an image file! 🖼️")
        }
      }
    },
    [handleFileUpload],
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // Only set dragging to false if we're leaving the drop zone entirely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false)
    }
  }, [])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileUpload(file)
    }
  }

  const generateImage = async () => {
    if (!uploadedFile) return

    setIsGenerating(true)
    try {
      const formData = new FormData()
      formData.append("image", uploadedFile)
      formData.append("prompt", prompt)

      const response = await fetch("/api/generate", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Failed to generate image")
      }

      const data = await response.json()
      onImageGenerated(data.imageUrl)
    } catch (error) {
      console.error("Error generating image:", error)
      alert("Failed to generate image. Please try again.")
    } finally {
      setIsGenerating(false)
    }
  }

  const clearImage = () => {
    setUploadedImage(null)
    setUploadedFile(null)
    setPrompt("")
  }

  return (
    <Card className="south-park-card paper-texture p-8 animate-fade-in-up">
      <div className="bg-secondary/20 rounded-lg p-4 mb-6 border-2 border-dashed border-secondary">
        <h2 className="text-3xl font-black text-card-foreground text-center uppercase tracking-wide">
          📸 Upload Your Image! 📸
        </h2>
      </div>

      {!uploadedImage ? (
        <div
          className={`border-4 border-dashed rounded-xl p-8 text-center transition-all duration-300 paper-texture relative overflow-hidden ${
            isDragging
              ? "border-secondary bg-secondary/40 animate-wiggle scale-105 shadow-lg"
              : "border-border hover:border-secondary hover:bg-secondary/10 hover:scale-102"
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
        >
          {isDragging && (
            <div className="absolute inset-0 bg-gradient-to-br from-secondary/30 to-primary/20 rounded-xl flex items-center justify-center z-10">
              <div className="text-center animate-bounce">
                <Upload className="h-16 w-16 text-secondary mx-auto mb-2" />
                <p className="text-2xl font-black text-secondary uppercase">🎯 Drop It Here! 🎯</p>
              </div>
            </div>
          )}

          <div className="animate-float">
            <ImageIcon
              className={`h-20 w-20 text-primary mx-auto mb-4 transition-all duration-300 ${isDragging ? "scale-110" : ""}`}
            />
          </div>
          <div className="bg-card rounded-lg p-4 mb-4 border-2 border-border">
            <p className="text-card-foreground mb-2 text-xl font-bold">
              {isDragging ? "🎨 Release to upload! 🎨" : "🎨 Drag & Drop or Click to Upload! 🎨"}
            </p>
            <p className="text-muted-foreground text-sm">
              {isDragging ? "Let go of that awesome image!" : "Supports JPG, PNG, GIF and more!"}
            </p>
          </div>
          <input type="file" accept="image/*" onChange={handleFileInput} className="hidden" id="file-upload" />
          <Button
            asChild
            className={`south-park-button text-primary-foreground transition-all duration-300 ${isDragging ? "scale-110" : ""}`}
          >
            <label htmlFor="file-upload" className="cursor-pointer">
              <Upload className="mr-2 h-5 w-5" />
              Choose Image
            </label>
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="relative">
            <div className="border-4 border-secondary rounded-xl p-2 bg-secondary/20">
              <img
                src={uploadedImage || "/placeholder.svg"}
                alt="Uploaded"
                className="w-full h-64 object-cover rounded-lg border-2 border-border"
              />
            </div>
            <Button
              onClick={clearImage}
              size="sm"
              className="absolute -top-2 -right-2 bg-destructive hover:bg-destructive/80 text-destructive-foreground rounded-full w-8 h-8 p-0 border-2 border-border"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-4">
            <div className="bg-card rounded-lg p-3 border-2 border-border">
              <Input
                placeholder="✨ Add some magic words to enhance your image! ✨"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="bg-input border-2 border-border text-card-foreground placeholder:text-muted-foreground font-medium"
              />
            </div>
            <Button
              onClick={generateImage}
              disabled={isGenerating}
              className="w-full south-park-button text-primary-foreground text-lg py-6"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />🎭 Creating Magic...
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-5 w-5" />🚀 Generate Awesome Image!
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}
