import { type NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const gemini = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" })

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get("image") as File | null
    // 默认的编辑指令，可以根据需要进行修改
    const editInstruction =
      (formData.get("editInstruction") as string) ||
      "change the background to a futuristic city, add a cyberpunk aesthetic to the subject"

    if (!file) {
      return NextResponse.json({ error: "Image is required" }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString("base64")

    // 修改后的 Prompt，专门针对 nano-banana/edit
    const structuredPrompt = `You are an expert prompt engineer for an image editing AI. Your goal is to generate a concise and effective editing instruction based on the user's request, specifically for a model that performs image-to-image editing.

**User's Editing Goal:**
${editInstruction}

**Instructions:**
1. Silently analyze the user's "Editing Goal" and the implicit elements of the provided image (which you don't directly "see" but infer from the user's intent to edit it).
2. Synthesize the user's goal into a clear and direct editing instruction.
3. The instruction should be phrased as an imperative command, focusing on what should be changed, added, or removed from the original image.
4. **CRITICAL:** Your final output must **ONLY** be the editing instruction text itself. Do not include any extra words, explanations, introductory phrases like "Here is the prompt:", or markdown formatting. Just the raw text.`

    const result = await gemini.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: { mimeType: file.type, data: base64 },
            },
            {
              text: structuredPrompt,
            },
          ],
        },
      ],
    }, {
      temperature: 0.2,
    })

    const prompt = result.response.text()

    return NextResponse.json({ prompt })
  } catch (err: any) {
    console.error("Gemini error:", err)
    return NextResponse.json({ error: err.message || "Failed to analyze" }, { status: 500 })
  }
}