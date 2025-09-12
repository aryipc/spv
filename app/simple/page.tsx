"use client"

import { useState } from "react"
import { VideoBackground } from "@/components/video-background"

export default function DebugPage() {
  const [file, setFile] = useState<File | null>(null)
  const [prompt, setPrompt] = useState<string>("")
  const [loadingPrompt, setLoadingPrompt] = useState(false)
  const [loadingImage, setLoadingImage] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [logs, setLogs] = useState<string[]>([])

  async function handleAnalyze() {
    if (!file) {
      setError("请先上传图片")
      return
    }
    setLoadingPrompt(true)
    setError(null)
    setPrompt("")
    setLogs([])

    try {
      const form = new FormData()
      form.append("image", file)

      const res = await fetch("/api/analyze", { method: "POST", body: form })
      if (!res.ok) throw new Error(await res.text())

      const data = await res.json()
      setPrompt(data.prompt || "")
      setLogs((prev) => [...prev, "[Gemini] 分析完成", JSON.stringify(data, null, 2)])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoadingPrompt(false)
    }
  }

  async function handleGenerate() {
    if (!file) {
      setError("请先上传图片")
      return
    }
    if (!prompt) {
      setError("请先生成 prompt")
      return
    }

    console.log("[v0] Starting generation with prompt:", prompt)
    setLoadingImage(true)
    setError(null)
    setImageUrl(null)
    setLogs([])

    try {
      const form = new FormData()
      form.append("image", file)
      form.append("prompt", prompt)

      console.log("[v0] Sending request to /api/generate")
      const res = await fetch("/api/generate", { method: "POST", body: form })
      console.log("[v0] Response status:", res.status)

      if (!res.ok) {
        const errorText = await res.text()
        console.log("[v0] Error response:", errorText)
        throw new Error(errorText)
      }

      const data = await res.json()
      console.log("[v0] Response data:", data)

      if (data.logs) {
        setLogs((prev) => [...prev, ...data.logs.map((l: string) => `[fal-ai] ${l}`)])
      }
      setImageUrl(data.imageUrl || null)
    } catch (err: any) {
      console.log("[v0] Generation error:", err)
      setError(err.message)
    } finally {
      setLoadingImage(false)
    }
  }

  return (
    <main className="relative min-h-screen">
      <VideoBackground />
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-8">
        <div className="max-w-4xl mx-auto w-full">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 text-balance">
              Debug Page - Gemini + fal-ai
            </h1>
            <p className="text-xl text-white/80 text-pretty">Complete workflow with debugging features</p>
          </div>

          <div className="bg-black/40 backdrop-blur-md rounded-2xl p-8 border border-white/10">
            <div className="mb-6">
              <label className="block text-white font-medium mb-2">Upload Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-white/20 file:text-white"
              />
            </div>

            <div className="mb-6">
              <button
                onClick={handleAnalyze}
                disabled={loadingPrompt || !file}
                className="w-full px-6 py-3 bg-green-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-700 transition-colors"
              >
                {loadingPrompt ? "分析中..." : "生成 Prompt (Gemini)"}
              </button>
            </div>

            {prompt && (
              <div className="mb-6">
                <label className="block text-white font-medium mb-2">Generated Prompt</label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="w-full h-32 p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 resize-none"
                  placeholder="AI-generated prompt will appear here..."
                />
              </div>
            )}

            <div className="mb-6">
              <button
                onClick={handleGenerate}
                disabled={loadingImage || !prompt || !file}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
              >
                {loadingImage ? "生成中..." : "生成图片 (fal-ai)"}
              </button>
            </div>

            {imageUrl && (
              <div className="mb-6">
                <h2 className="text-white font-medium mb-2">Generated Result</h2>
                <img src={imageUrl || "/placeholder.svg"} alt="Generated result" className="w-full rounded-lg" />
              </div>
            )}

            {logs.length > 0 && (
              <div className="mb-6">
                <h2 className="text-white font-medium mb-2">Debug Logs</h2>
                <div className="bg-gray-900/50 rounded-lg p-4 text-sm text-gray-300 max-h-40 overflow-y-auto">
                  {logs.map((line, i) => (
                    <div key={i} className="mb-1">
                      {line}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {error && <div className="text-red-400 text-center font-medium">{error}</div>}
          </div>
        </div>
      </div>
    </main>
  )
}
