import { type NextRequest, NextResponse } from "next/server"

import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

// 建议 2: 使用更稳定的模型，这里保持 gemini-1.5-flash-latest，因为它速度快
const gemini = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" })

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get("image") as File | null
    // style 变量在这个方案中变得次要，因为我们将手动构建风格提示
    // 但我们可以保留它，以便未来扩展到其他硬编码风格
    const style =
      (formData.get("style") as string) ||
      "South Park cartoon style" // 默认值设为South Park

    if (!file) {
      return NextResponse.json({ error: "Image is required" }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString("base64")

    // 方案一：优化 structuredPrompt，让它输出 JSON
    const structuredPromptForFeatureExtraction = `You are an AI assistant that analyzes an image and extracts key visual features into a structured JSON format. Do not describe the image with full sentences or artistic interpretations. Only extract the data points requested.

**Instructions:**
1.  Analyze the provided image to identify the main subject.
2.  Extract the following key characteristics into a JSON object:
    - "hair_color": A simple, one-word or very brief phrase for the primary hair color (e.g., "lime green", "blonde", "brown").
    - "clothing_description": A very brief, 2-5 word description of the main piece of clothing the subject is wearing (e.g., "black turtleneck", "blue jacket", "white t-shirt", "red dress"). Focus on the most dominant item.
    - "accessory": A single, most prominent accessory, if any. If multiple, pick the most noticeable one (e.g., "necklace", "hat", "glasses", "backpack"). If no prominent accessory, use an empty string "".
    - "expression": A single, simple adjective describing the main facial expression (e.g., "serious", "smiling", "angry", "neutral"). If unclear or subtle, default to "neutral".
3.  Your output MUST be ONLY the raw JSON object. Do not include markdown code block ticks (\`\`\`), any introductory phrases like "Here is the JSON:", or any other explanatory text.

**Example Output:**
{
  "hair_color": "green",
  "clothing_description": "white sleeveless top",
  "accessory": "green necklace",
  "expression": "serious"
}`

    // 调用 Gemini API 进行特征提取
    const result = await gemini.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: { mimeType: file.type, data: base64 },
            },
            {
              text: structuredPromptForFeatureExtraction, // 使用新的 Prompt
            },
          ],
        },
      ],
      // 对于 JSON 提取这种明确的任务，temperature 可以保持较低以减少随机性
    }, {
      temperature: 0.1, 
    })

    const responseText = result.response.text()

    // 解析 Gemini 返回的 JSON 字符串
    let features: { 
        hair_color: string; 
        clothing_description: string; 
        accessory: string;
        expression: string;
    };
    try {
      features = JSON.parse(responseText)
    } catch (e) {
      console.error("Failed to parse JSON from Gemini:", responseText)
      return NextResponse.json({ error: "Failed to extract image features. Gemini returned malformed JSON." }, { status: 500 })
    }

    // 手动构建一个非常强势、简单、不容置疑的 South Park 风格 Prompt
    // 这里的逻辑可以根据你需要支持的风格进行扩展
    let finalPrompt = `A South Park cartoon style character. Thick black outlines, flat colors, simple geometric shapes, construction paper cutout style, dot eyes.`;

    if (features.hair_color) {
      finalPrompt += ` The character has ${features.hair_color} hair.`
    }
    if (features.clothing_description) {
      finalPrompt += ` Wearing a ${features.clothing_description}.`
    }
    if (features.accessory) {
      finalPrompt += ` With a ${features.accessory}.`
    }
    if (features.expression && features.expression !== "neutral") {
        // 对于South Park风格，表情也需要简化
        finalPrompt += ` Showing a simple, ${features.expression} expression.`
    } else {
        finalPrompt += ` With a neutral expression.`
    }
    
    // 你可以添加更多通用修饰词，但保持整体简洁
    finalPrompt += ` Simple background, white space.`


    return NextResponse.json({ prompt: finalPrompt })
  } catch (err: any) {
    console.error("Server error:", err)
    return NextResponse.json({ error: err.message || "Failed to process image and generate prompt." }, { status: 500 })
  }
}