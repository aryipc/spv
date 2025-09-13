import { type NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
// 建议 2: 使用更稳定的模型
const gemini = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" })

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get("image") as File | null
    const style =
      (formData.get("style") as string) ||
      "South Park cartoon style, flat colors, simple shapes, exaggerated expressions"

    if (!file) {
      return NextResponse.json({ error: "Image is required" }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString("base64")

    // 建议 1: 使用结构化、单一的 Prompt
    const structuredPrompt = `You are an expert style transfer prompt engineer for an image generation AI. Your primary goal is to re-imagine a user-provided image in a completely new artistic style.

**Target Art Style:**
${style}

**CRITICAL INSTRUCTIONS:**
1.  Analyze the provided image to understand its core essence: the subject's main colors, key clothing items, general pose, and overall mood.
2.  **This is the most important step:** Do not literally describe the visual details of the original image. Instead, you must **TRANSLATE** the essence into the specific visual language of the **Target Art Style**. You must sacrifice the original image's fidelity to perfectly achieve the target style.
3.  For example, if the target style is "South Park" and the input is an anime character with spiky hair, a bad prompt would be "A South Park style anime character with spiky hair". A good prompt would be "A South Park character with a simple, round head, wearing a green construction-paper cutout wig to mimic spiky hair, classic dot eyes, standing against a plain background."
4.  Your final output must **ONLY** be the rewritten, style-translated prompt text itself. Do not include any extra words, explanations, or markdown. Just the raw text.`

    const result = await gemini.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: { mimeType: file.type, data: base64 },
            },
            {
              text: structuredPrompt, // 使用新的 Prompt
            },
          ],
        },
      ],
    }, {
      // 建议 3: 添加生成配置以降低随机性
      temperature: 0.2, 
    })

    const prompt = result.response.text()

    return NextResponse.json({ prompt })
  } catch (err: any) {
    console.error("Gemini error:", err)
    return NextResponse.json({ error: err.message || "Failed to analyze" }, { status: 500 })
  }
}
