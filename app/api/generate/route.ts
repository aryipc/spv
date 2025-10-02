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
    // 接收 Gemini 生成的完整 Prompt
    const geminiPrompt = formData.get("prompt") as string 

    console.log("[v0] File received:", !!file, "Prompt received:", !!geminiPrompt)

    if (!file || !geminiPrompt || geminiPrompt.trim() === "") {
      return NextResponse.json({ error: "Image file and Prompt are required" }, { status: 400 })
    }

    // --- 1. 图片上传到 Fal 存储 ---
    console.log("[v0] Uploading image to fal storage")
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
    // 目标 Prompt：使用 Gemini 的输出，并添加一些辅助修饰词来增强 Logo 效果
    const finalPrompt = geminiPrompt + ", centered, isolated, official token design, high contrast, clean background, 8K" 
    
    // 负面 Prompt：排除掉与 Coin Logo 不符的元素，并移除 photorealistic 以强化卡通风格
    const negativePrompt = "photorealistic, photo, messy, low resolution, ugly, blurry, text, watermark, bad coin structure, frame, multiple objects, low saturation"

    console.log("[v0] Starting fal-ai generation with SDXL ControlNet Canny")

    // --- 3. 调用 fal-ai/stable-diffusion-xl-controlnet-canny ---
    const result = await Promise.race([
      fal.subscribe("fal-ai/stable-diffusion-xl-controlnet-canny", { 
        input: {
          // 原始图片 URL 作为 ControlNet 的输入图
          image_url: imageUrl, 
          
          // 描述（Gemini优化后的 Coin Logo 描述）
          prompt: finalPrompt, 
          negative_prompt: negativePrompt,
          
          // 图像到图像的引导强度：0.65 允许大幅风格转换，但保留原图色彩和主题
          image_conditioning_scale: 0.65, 
          
          // Canny 结构引导的强度：1.0 强制遵循原始图片的边缘轮廓
          control_scale: 1.0, 
          
          // 强制方形输出，适合 Coin Logo
          height: 1024,
          width: 1024,
          
          num_inference_steps: 30, // 增加步数提升质量
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

    // --- 4. 解析结果 (保持原有健壮的解析逻辑) ---
    if (!result) {
      throw new Error("No result returned from fal-ai")
    }

    let resultData = result.data || result
    if (!resultData) {
      resultData = result
    }

    let generatedImageUrl: string | undefined

    if (resultData.images && Array.isArray(resultData.images) && resultData.images.length > 0) {
      generatedImageUrl = resultData.images[0].url || resultData.images[0]
    } else if (resultData.image) {
      generatedImageUrl = typeof resultData.image === "string" ? resultData.image : resultData.image.url
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