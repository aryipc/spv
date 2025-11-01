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
    const structuredPrompt = `You are an expert prompt engineer for an image generation AI. Your goal is to rewrite a description of a user-provided image into a new artistic style.

**Target Art Style:**
${style}

**Instructions:**
1. Silently analyze the provided image to identify the key elements: subject, pose, clothing, accessories, and background.
2. Synthesize these elements into a descriptive prompt.
3. Rewrite the prompt to perfectly match the **Target Art Style**.
4. **CRITICAL:** Your final output must **ONLY** be the rewritten prompt text itself. Do not include any extra words, explanations, introductory phrases like "Here is the prompt:", or markdown formatting. Just the raw text.`

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
