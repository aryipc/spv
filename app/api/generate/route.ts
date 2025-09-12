import { type NextRequest, NextResponse } from "next/server"
import * as fal from "@fal-ai/serverless-client"

fal.config({
  credentials: process.env.FAL_KEY,
})

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Starting image generation")
    const formData = await request.formData()
    const file = formData.get("image") as File | null
    const prompt = formData.get("prompt") as string

    console.log("[v0] File received:", !!file, "Prompt received:", !!prompt)
    console.log("[v0] Prompt content:", prompt)

    if (!file) {
      return NextResponse.json({ error: "Image file is required" }, { status: 400 })
    }

    if (!prompt || prompt.trim() === "") {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    console.log("[v0] Uploading image to fal storage")

    let imageUrl: string
    try {
      console.log("[v0] File size:", file.size, "bytes")
      console.log("[v0] File type:", file.type)

      imageUrl = await Promise.race([
        fal.storage.upload(file),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Upload timeout after 30 seconds")), 30000),
        ),
      ])

      console.log("[v0] Image uploaded successfully:", imageUrl)
    } catch (uploadError: any) {
      console.error("[v0] Upload error:", uploadError)
      throw new Error(`Failed to upload image: ${uploadError.message}`)
    }

    const logs: string[] = []

    console.log("[v0] Starting fal-ai generation")

    const result = await Promise.race([
      fal.subscribe("fal-ai/flux-pro/kontext", {
        input: {
          prompt,
          image_url: imageUrl,
          aspect_ratio: "1:1",
          guidance_scale: 3.5,
          num_images: 1,
          output_format: "jpeg",
          safety_tolerance: "2",
        },
        logs: true,
        onQueueUpdate(update) {
          console.log("[v0] Queue update:", update)
          if (update.logs) {
            update.logs.forEach((l) => {
              console.log("[v0] Log:", l.message)
              logs.push(l.message)
            })
          }
        },
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Generation timeout after 120 seconds")), 120000),
      ),
    ])

    console.log("[v0] Full generation result:", JSON.stringify(result, null, 2))

    if (!result) {
      console.log("[v0] Result is null or undefined")
      throw new Error("No result returned from fal-ai")
    }

    console.log("[v0] Result keys:", Object.keys(result))
    console.log("[v0] Result type:", typeof result)

    let resultData = result.data || result

    if (!resultData) {
      console.log("[v0] No data field found, using entire result")
      resultData = result
    }

    console.log("[v0] Result data:", JSON.stringify(resultData, null, 2))
    console.log("[v0] Result data keys:", Object.keys(resultData))

    // Check different possible response structures
    let generatedImageUrl: string | undefined

    if (resultData.images && Array.isArray(resultData.images) && resultData.images.length > 0) {
      console.log("[v0] Found images array with", resultData.images.length, "items")
      generatedImageUrl = resultData.images[0].url || resultData.images[0]
    } else if (resultData.image) {
      console.log("[v0] Found image field:", typeof resultData.image)
      generatedImageUrl = typeof resultData.image === "string" ? resultData.image : resultData.image.url
    } else if (resultData.url) {
      console.log("[v0] Found url field:", resultData.url)
      generatedImageUrl = resultData.url
    } else if (resultData.output && resultData.output.images) {
      console.log("[v0] Found output.images field")
      generatedImageUrl = resultData.output.images[0]?.url || resultData.output.images[0]
    }

    console.log("[v0] Extracted image URL:", generatedImageUrl)

    if (!generatedImageUrl) {
      console.log("[v0] No image URL found in any expected field")
      console.log("[v0] Available fields:", Object.keys(resultData))
      throw new Error(`No image generated. Full response: ${JSON.stringify(resultData, null, 2)}`)
    }

    console.log("[v0] Success! Generated image URL:", generatedImageUrl)
    return NextResponse.json({ imageUrl: generatedImageUrl, logs })
  } catch (error: any) {
    console.error("[v0] Error generating image:", error)
    return NextResponse.json({ error: error.message || "Failed to generate image" }, { status: 500 })
  }
}
