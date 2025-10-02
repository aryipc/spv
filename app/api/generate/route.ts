import { type NextRequest, NextResponse } from "next/server"
import * as fal from "@fal-ai/serverless-client"

// 确保 FAL_KEY 环境变量已设置
fal.config({
  credentials: process.env.FAL_KEY,
})

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Starting image generation with ControlNet")
    const formData = await request.formData()
    const file = formData.get("image") as File | null
    const geminiPrompt = formData.get("prompt") as string 

    if (!file || !geminiPrompt || geminiPrompt.trim() === "") {
      return NextResponse.json({ error: "Image file and Prompt are required" }, { status: 400 })
    }

    // --- 1. 图片上传到 Fal 存储 ---
    let imageUrl: string
    try {
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

    // --- 2. 准备 ControlNet 参数 ---
    const finalPrompt = geminiPrompt + ", centered, isolated, official token design, high contrast, clean background, 8K" 
    const negativePrompt = "photorealistic, photo, messy, low resolution, ugly, blurry, text, watermark, bad coin structure, frame, multiple objects, low saturation"

    console.log("[v0] Starting fal-ai generation with sdxl-controlnet/canny")

    // --- 3. 调用 fal-ai/sdxl-controlnet/canny ---
    const result = await Promise.race([
      // *** 关键修改：更换为分层模型路径，解决 404 问题 ***
      fal.subscribe("fal-ai/sdxl-controlnet/canny", { 
        input: {
          image_url: imageUrl, 
          prompt: finalPrompt, 
          negative_prompt: negativePrompt,
          
          // 移除 image_conditioning_scale，简化输入，专注于 ControlNet 效果
          // image_conditioning_scale: 0.65, 
          
          // Canny 结构引导的强度：1.0 强制遵循原始图片的边缘轮廓
          control_scale: 1.0, 
          
          // 强制方形输出
          height: 1024,
          width: 1024,
          
          num_inference_steps: 30, 
          seed: 42, 
        },
        logs: true,
        onQueueUpdate(update) {
          if (update.logs) {
            update.logs.forEach((l) => {
              logs.push(l.message)
            })
          }
        },
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Generation timeout after 120 seconds")), 120000),
      ),
    ])

    // --- 4. 解析结果 (保持不变) ---
    if (!result) {
      throw new Error("No result returned from fal-ai")
    }

    let resultData = result.data || result

    let generatedImageUrl: string | undefined
    if (resultData.images && Array.isArray(resultData.images) && resultData.images.length > 0) {
      generatedImageUrl = resultData.images[0].url || resultData.images[0]
    } else if (resultData.url) {
      generatedImageUrl = resultData.url
    } else if (resultData.output && resultData.output.images) {
      generatedImageUrl = resultData.output.images[0]?.url || resultData.output.images[0]
    }

    if (!generatedImageUrl) {
      throw new Error(`No image URL found in expected fields. Full response: ${JSON.stringify(resultData, null, 2)}`)
    }

    console.log("[v0] Success! Generated image URL:", generatedImageUrl)
    return NextResponse.json({ imageUrl: generatedImageUrl, logs })
  } catch (error: any) {
    console.error("[v0] Error generating image:", error)
    return NextResponse.json({ error: error.message || "Failed to generate image" }, { status: 500 })
  }
}