"use client"

import type React from "react"
import { useState, useCallback } from "react"

interface ImageUploadProps {
  onImageGenerated: (imageUrl: string) => void
}

const UploadIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M7 16a4 4 0 01-.88-7.903A5 5 0 0115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
    />
  </svg>
)

const XIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
)

const ImageIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
    />
  </svg>
)

const WandIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM7 3V1M13 21V11a4 4 0 014-4h4"
    />
  </svg>
)

const LoaderIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
    />
  </svg>
)

const SimpleButton = ({
  children,
  onClick,
  disabled,
  className = "",
  asChild,
  size,
}: {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  className?: string
  asChild?: boolean
  size?: string
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`px-4 py-2 rounded-lg font-bold transition-all duration-200 hover:scale-105 active:scale-95 ${className}`}
  >
    {children}
  </button>
)

const SimpleInput = ({
  placeholder,
  value,
  onChange,
  className = "",
}: {
  placeholder?: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  className?: string
}) => (
  <input
    type="text"
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    className={`w-full px-4 py-3 rounded-lg border-2 ${className}`}
  />
)

const SimpleCard = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`rounded-lg border-2 ${className}`}>{children}</div>
)

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
    <SimpleCard className="bg-black/80 border-yellow-400 p-8 animate-fade-in-up">
      <div className="bg-yellow-400/20 rounded-lg p-4 mb-6 border-2 border-dashed border-yellow-400">
        <h2 className="text-3xl font-black text-white text-center uppercase tracking-wide">📸 Upload Your Image! 📸</h2>
      </div>

      {!uploadedImage ? (
        <div
          className={`border-4 border-dashed rounded-xl p-8 text-center transition-all duration-300 relative overflow-hidden ${
            isDragging
              ? "border-yellow-400 bg-yellow-400/40 animate-pulse scale-105 shadow-lg"
              : "border-gray-400 hover:border-yellow-400 hover:bg-yellow-400/10 hover:scale-102"
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
        >
          {isDragging && (
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/30 to-orange-500/20 rounded-xl flex items-center justify-center z-10">
              <div className="text-center animate-bounce">
                <UploadIcon className="h-16 w-16 text-yellow-400 mx-auto mb-2" />
                <p className="text-2xl font-black text-yellow-400 uppercase">🎯 Drop It Here! 🎯</p>
              </div>
            </div>
          )}

          <div className="animate-pulse">
            <ImageIcon
              className={`h-20 w-20 text-orange-500 mx-auto mb-4 transition-all duration-300 ${isDragging ? "scale-110" : ""}`}
            />
          </div>
          <div className="bg-black/60 rounded-lg p-4 mb-4 border-2 border-gray-400">
            <p className="text-white mb-2 text-xl font-bold">
              {isDragging ? "🎨 Release to upload! 🎨" : "🎨 Drag & Drop or Click to Upload! 🎨"}
            </p>
            <p className="text-gray-300 text-sm">
              {isDragging ? "Let go of that awesome image!" : "Supports JPG, PNG, GIF and more!"}
            </p>
          </div>
          <input type="file" accept="image/*" onChange={handleFileInput} className="hidden" id="file-upload" />
          <SimpleButton
            className={`bg-orange-500 hover:bg-orange-600 text-white border-2 border-black shadow-lg transition-all duration-300 ${isDragging ? "scale-110" : ""}`}
          >
            <label htmlFor="file-upload" className="cursor-pointer flex items-center">
              <UploadIcon className="mr-2 h-5 w-5" />
              Choose Image
            </label>
          </SimpleButton>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="relative">
            <div className="border-4 border-yellow-400 rounded-xl p-2 bg-yellow-400/20">
              <img
                src={uploadedImage || "/placeholder.svg"}
                alt="Uploaded"
                className="w-full h-64 object-cover rounded-lg border-2 border-gray-400"
              />
            </div>
            <SimpleButton
              onClick={clearImage}
              className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 p-0 border-2 border-black"
            >
              <XIcon className="h-4 w-4" />
            </SimpleButton>
          </div>

          <div className="space-y-4">
            <div className="bg-black/60 rounded-lg p-3 border-2 border-gray-400">
              <SimpleInput
                placeholder="✨ Add some magic words to enhance your image! ✨"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="bg-gray-800 border-2 border-gray-400 text-white placeholder:text-gray-400 font-medium"
              />
            </div>
            <SimpleButton
              onClick={generateImage}
              disabled={isGenerating}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white text-lg py-6 border-2 border-black shadow-lg"
            >
              {isGenerating ? (
                <div className="flex items-center justify-center">
                  <LoaderIcon className="mr-2 h-5 w-5 animate-spin" />🎭 Creating Magic...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <WandIcon className="mr-2 h-5 w-5" />🚀 Generate Awesome Image!
                </div>
              )}
            </SimpleButton>
          </div>
        </div>
      )}
    </SimpleCard>
  )
}
