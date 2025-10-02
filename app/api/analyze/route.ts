import { type NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

// 确保 GEMINI_API_KEY 环境变量已设置
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

// 建议 2: 使用最新的稳定模型 gemini-2.5-flash
const gemini = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get("image") as File | null
    
    // 强制目标风格为通用的卡通风格和加密货币（coin）背景
    const style =
      (formData.get("style") as string) ||
      "modern cartoon style, flat design, vector logo, centered, clean lines"
    
    // 强制背景元素
    const background_theme = "a stylized digital crypto coin or logo token in the background, a subtle glow, high detail, in the style of a brand logo"


    if (!file) {
      return NextResponse.json({ error: "Image is required" }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString("base64")

    // 建议 1: 使用结构化、强约束的 Prompt，以强制输出 Coin Logo 结构
    const structuredPrompt = `You are an expert prompt engineer for an image generation AI. Your goal is to rewrite a description of a user-provided image into a new artistic style, specifically for a **digital crypto coin logo (Token Logo)**.

**Target Output Structure and Style:**
A modern vector logo of the subject, centered inside a gold or metallic circular border.
The overall aesthetic must be a **modern cartoon style, flat design, vector logo, clean lines, highly stylized**.
The circular border should resemble a stylized digital crypto coin, token, or round medal.
The final image should feature the subject perfectly contained within this coin structure.

**Instructions:**
1. Silently analyze the provided image to identify the key elements: **subject (person/object), distinctive features, pose, and color scheme**.
2. Synthesize these elements into a descriptive prompt focusing only on the **central subject**.
3. **CRITICAL REWRITE STEP:** Rewrite the combined subject description to perfectly match the **Target Output Structure and Style**. The output must start with the subject and end with the required style/structure keywords.
4. **CRITICAL:** Your final output must **ONLY** be the rewritten prompt text itself. Do not include any extra words, explanations, introductory phrases, or markdown formatting. Just the raw text.`

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
      // 建议 3: 添加生成配置以降低随机性，确保更贴合指令
      temperature: 0.2, 
    })

    const prompt = result.response.text()

    return NextResponse.json({ prompt })
  } catch (err: any) {
    console.error("Gemini error:", err)
    // 确保 404 错误已通过切换模型解决
    return NextResponse.json({ error: err.message || "Failed to analyze" }, { status: 500 })
  }
}