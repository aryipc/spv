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
    // 原始Prompt (来自Gemini)
    const geminiPrompt = formData.get("prompt") as string 

    console.log("[v0] File received:", !!file, "Prompt received:", !!geminiPrompt)
    console.log("[v0] Prompt content (Gemini):", geminiPrompt)

    if (!file) {
      return NextResponse.json({ error: "Image file is required" }, { status: 400 })
    }

    if (!geminiPrompt || geminiPrompt.trim() === "") {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    // --- 针对 fal-ai/nano-banana/edit 模型的输入设置 ---
    // nano-banana/edit 通常要求一个编辑指令 (edit_prompt)
    // 使用 geminiPrompt 作为目标描述，并添加一个通用的编辑指令来引导模型
    const promptForEdit = geminiPrompt // 目标图像描述（卡通风格 + 币背景）
    const editInstruction = `Apply the artistic style and theme described in the prompt to the image, specifically replacing the background with a crypto coin logo and transforming the subject into a modern cartoon style logo.` // 编辑指令

    console.log("[v0] Uploading image to fal storage")

    let imageUrl: string
    try {
      // ... (文件上传逻辑保持不变)
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

    console.log("[v0] Starting fal-ai generation with nano-banana/edit")

    const result = await Promise.race([
      // *** 关键修改: 替换模型名称和输入参数 ***
      fal.subscribe("fal-ai/nano-banana/edit", { 
        input: {
          // 使用原始图片 URL
          image_url: imageUrl, 
          // 正向描述（Gemini 生成的完整目标图描述）
          prompt: promptForEdit, 
          // 编辑指令
          edit_prompt: editInstruction,
          // nano-banana/edit 模型的其它参数
          negative_prompt: "photorealistic, low quality, cropped, deformed, text, watermark",
          seed: 42, // 可选
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

    // ... (后续结果处理逻辑保持不变)
    
    console.log("[v0] Full generation result:", JSON.stringify(result, null, 2))

    if (!result) {
      console.log("[v0] Result is null or undefined")
      throw new Error("No result returned from fal-ai")
    }

    // 由于 fal-ai/nano-banana/edit 的输出结构可能与 flux-pro/kontext 不同，
    // 我保留并信赖您原有的结果解析逻辑，它看起来已经很健壮了。

    let resultData = result.data || result

    if (!resultData) {
      console.log("[v0] No data field found, using entire result")
      resultData = result
    }

    // ... (图像 URL 提取逻辑保持不变)
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