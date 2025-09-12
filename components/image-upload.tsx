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
      setIsDragging(false)
      const files = Array.from(e.dataTransfer.files)
      if (files.length > 0) {
        handleFileUpload(files[0])
      }
    },
    [handleFileUpload],
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
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
    <Card className="p-6 bg-black/40 backdrop-blur-md border-white/30">
      <h2 className="text-2xl font-bold text-white mb-4 text-center">Upload Image</h2>

      {!uploadedImage ? (
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 ${
            isDragging ? "border-blue-400 bg-blue-400/20" : "border-white/40 hover:border-white/60"
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <ImageIcon className="h-16 w-16 text-white/80 mx-auto mb-4" />
          <p className="text-white mb-4 text-lg">Drag and drop your image here, or click to select</p>
          <input type="file" accept="image/*" onChange={handleFileInput} className="hidden" id="file-upload" />
          <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
            <label htmlFor="file-upload" className="cursor-pointer">
              <Upload className="mr-2 h-4 w-4" />
              Select Image
            </label>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative">
            <img
              src={uploadedImage || "/placeholder.svg"}
              alt="Uploaded"
              className="w-full h-64 object-cover rounded-lg"
            />
            <Button onClick={clearImage} size="sm" variant="destructive" className="absolute top-2 right-2">
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-3">
            <Input
              placeholder="Enter a prompt to enhance your image (optional)"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="bg-white/10 border-white/30 text-white placeholder:text-white/60"
            />
            <Button
              onClick={generateImage}
              disabled={isGenerating}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-4 w-4" />
                  Generate Enhanced Image
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}
