"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Download, Wand2 } from "lucide-react"

interface ImageOutputProps {
  outputImage: string | null
}

export function ImageOutput({ outputImage }: ImageOutputProps) {
  const downloadImage = () => {
    if (outputImage) {
      const link = document.createElement("a")
      link.href = outputImage
      link.download = "generated-image.png"
      link.click()
    }
  }

  return (
    <Card className="p-6 bg-black/40 backdrop-blur-md border-white/30">
      <h2 className="text-2xl font-bold text-white mb-4 text-center">Generated Output</h2>

      <div className="min-h-64 flex items-center justify-center rounded-lg border-2 border-dashed border-white/40 bg-black/20">
        {outputImage ? (
          <div className="relative w-full">
            <img
              src={outputImage || "/placeholder.svg"}
              alt="Generated output"
              className="w-full h-64 object-cover rounded-lg"
            />
            <Button onClick={downloadImage} className="absolute bottom-2 right-2 bg-green-600 hover:bg-green-700">
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          </div>
        ) : (
          <div className="text-center">
            <div className="w-24 h-24 bg-white/20 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Wand2 className="h-12 w-12 text-white/80" />
            </div>
            <p className="text-white">Upload an image and click generate to see the enhanced result</p>
          </div>
        )}
      </div>
    </Card>
  )
}
