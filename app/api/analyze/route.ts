import { type NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
// 使用更稳定的模型
const gemini = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get("image") as File | null
    // 强制目标风格为通用的卡通风格和加密货币（coin）背景
    const style =
      (formData.get("style") as string) ||
      "modern cartoon style, digital art, flat design, vector logo, centered, clean lines"
    
    // 强制背景元素
    const background_theme = "a stylized digital crypto coin or logo token in the background, a subtle glow, high detail, in the style of a brand logo"


    if (!file) {
      return NextResponse.json({ error: "Image is required" }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString("base64")

    // 核心修改: 结构化 Prompt，用于生成币 Logo 的描述
    const structuredPrompt = `You are an expert prompt engineer for an image generation AI. Your goal is to rewrite a description of a user-provided image into a new artistic style, specifically for a **digital coin/token logo**.

**Target Art Style:**
${style}

**Forced Background/Theme Elements:**
${background_theme}

**Instructions:**
1. Silently analyze the provided image to identify the key elements: **subject (person/object), distinctive features, pose, and clothing/accessories**.
2. Synthesize these elements into a descriptive prompt focusing only on the **central subject**.
3. **CRITICAL REWRITE STEP:** Rewrite the combined subject description to perfectly match the **Target Art Style** and **Forced Background/Theme Elements**. The output should be a single, cohesive prompt that describes the subject as the central element of a coin/token logo.
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
      // 添加生成配置以降低随机性，确保更贴合指令
      temperature: 0.2, 
    })

    const prompt = result.response.text()

    return NextResponse.json({ prompt })
  } catch (err: any) {
    console.error("Gemini error:", err)
    return NextResponse.json({ error: err.message || "Failed to analyze" }, { status: 500 })
  }
}