"use client"

import { Button } from "@/components/ui/button"
import { ArrowDown, Play } from "lucide-react"

export function HeroSection() {
  const scrollToFeatures = () => {
    document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <section className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center text-white max-w-4xl mx-auto">
        <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fade-in-up text-balance">
          {"Experience the Future"}
        </h1>
        <p className="text-xl md:text-2xl mb-8 opacity-90 animate-fade-in-up [animation-delay:0.2s] text-pretty">
          {"Immerse yourself in a world of endless possibilities with our innovative platform"}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-up [animation-delay:0.4s]">
          <Button
            size="lg"
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 text-lg transition-all duration-300 hover:scale-105 hover:shadow-lg"
          >
            <Play className="mr-2 h-5 w-5" />
            {"Get Started"}
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="border-white/30 text-white hover:bg-white/10 px-8 py-3 text-lg transition-all duration-300 hover:scale-105 bg-transparent"
          >
            {"Learn More"}
          </Button>
        </div>
        <button
          onClick={scrollToFeatures}
          className="mt-16 animate-float text-white/70 hover:text-white transition-colors duration-300"
          aria-label="Scroll to features"
        >
          <ArrowDown className="h-8 w-8 mx-auto" />
        </button>
      </div>
    </section>
  )
}
