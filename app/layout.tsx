import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Suspense } from "react"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "$SPVERSE - South Park Universe",
  description:
    "Join the South Park Universe - Explore a multiverse of mayhem! AI Art Factory and community hub for South Park fans.",
  generator: "v0.app",
  keywords: ["South Park", "SPVERSE", "AI Art", "Community", "Memes", "Animation"],
  authors: [{ name: "SPVERSE Team" }],
  creator: "SPVERSE",
  publisher: "SPVERSE",
  icons: {
    icon: "/favicon.jpg",
    shortcut: "/favicon.jpg",
    apple: "/favicon.jpg",
  },
  openGraph: {
    title: "$SPVERSE - South Park Universe",
    description: "Join the South Park Universe - Explore a multiverse of mayhem!",
    url: "https://spverse.com",
    siteName: "SPVERSE",
    images: [
      {
        url: "/favicon.jpg",
        width: 1200,
        height: 1200,
        alt: "SPVERSE Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "$SPVERSE - South Park Universe",
    description: "Join the South Park Universe - Explore a multiverse of mayhem!",
    images: ["/favicon.jpg"],
    creator: "@SouthPark_verse",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Suspense
          fallback={
            <div className="min-h-screen bg-black flex items-center justify-center">
              <div className="text-white">Loading...</div>
            </div>
          }
        >
          {children}
        </Suspense>
      </body>
    </html>
  )
}
