"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight, Mail } from "lucide-react"

export function CallToAction() {
  return (
    <section className="py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <Card className="bg-card/90 backdrop-blur-sm border-border/50 overflow-hidden">
          <CardContent className="p-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-card-foreground text-balance">
              {"Ready to Get Started?"}
            </h2>
            <p className="text-lg text-muted-foreground mb-8 text-pretty">
              {"Join thousands of users who are already experiencing the future. Start your journey today."}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 text-lg transition-all duration-300 hover:scale-105 hover:shadow-lg group"
              >
                {"Start Free Trial"}
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="px-8 py-3 text-lg transition-all duration-300 hover:scale-105 bg-transparent"
              >
                <Mail className="mr-2 h-5 w-5" />
                {"Contact Sales"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
