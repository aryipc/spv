"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Download, Sparkles } from "lucide-react"

interface ImageOutputProps {
  outputImage: string | null
}

export function ImageOutput({ outputImage }: ImageOutputProps) {
  const downloadImage = () => {
    if (outputImage) {
      const link = document.createElement("a")
      link.href = outputImage
      link.download = "south-park-generated-image.png"
      link.click()
    }
  }

  return (
    <Card className="south-park-card paper-texture p-8 animate-fade-in-up">
      <div className="bg-accent/20 rounded-lg p-4 mb-6 border-2 border-dashed border-accent">
        <h2 className="text-3xl font-black text-card-foreground text-center uppercase tracking-wide">
          🎨 Your Masterpiece! 🎨
        </h2>
      </div>

      <div className="min-h-80 flex items-center justify-center rounded-xl border-4 border-dashed border-border bg-muted/50 paper-texture">
        {outputImage ? (
          <div className="relative w-full animate-fade-in-up">
            <div className="border-4 border-accent rounded-xl p-2 bg-accent/20">
              <img
                src={outputImage || "/placeholder.svg"}
                alt="Generated masterpiece"
                className="w-full h-64 object-cover rounded-lg border-2 border-border"
              />
            </div>
            <div className="mt-4 text-center">
              <Button onClick={downloadImage} className="south-park-button text-primary-foreground">
                <Download className="mr-2 h-5 w-5" />💾 Download Your Art!
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center space-y-4 animate-float">
            <div className="w-24 h-24 bg-accent/30 rounded-xl flex items-center justify-center mx-auto border-3 border-accent">
              <Sparkles className="h-12 w-12 text-accent" />
            </div>
            <div className="bg-card rounded-lg p-4 border-2 border-border max-w-sm">
              <p className="text-card-foreground font-bold text-lg">🎪 Upload an image and hit generate!</p>
              <p className="text-muted-foreground text-sm mt-2">Your amazing creation will appear here! ✨</p>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
