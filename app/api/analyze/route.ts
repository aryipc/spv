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
    // code
    // Code
    if (!file) {
      return NextResponse.json({ error: "Image is required" }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString("base64")

    // 建议 1: 使用结构化、单一的 Prompt
    const structuredPrompt = `You are an expert prompt engineer for an image generation AI, specializing in recreating the distinctive visual and character style of South Park. Your goal is to rewrite a detailed description of a user-provided image into a prompt that perfectly captures the South Park aesthetic.

Target Art Style: South Park cartoon style. This means:
- **Characters:** Blocky, simple shapes. Round heads, large eyes with small pupils, often exaggerated or deadpan expressions. Distinctive hats (like Cartman's red hat or Stan's blue hat) are common. Limited, simplified body movements.
- **Colors:** Flat, solid colors. No complex gradients or textures.
- **Lines:** Thick, black outlines for all elements.
- **Backgrounds:** Extremely simplistic, often abstract or symbolic representations of locations. Flat color backgrounds are common. Minimal details.
- **Overall Tone:** Can often be slightly crude, absurd, or satirically mundane, even if the image itself is not.

Instructions:
1. **Detailed Analysis:** Silently analyze the provided image with extreme detail. Identify every key element:
    - **Subject(s):** Who or what are the main figures?
    - **Pose/Action:** What are they doing? How are they positioned? (e.g., "standing with hands in pockets," "shouting furiously," "looking bored")
    - **Facial Expression:** Specifically note the emotional state. (e.g., "annoyed," "shocked," "blank stare," "grinning mischievously")
    - **Clothing/Accessories:** Describe specific items and colors. (e.g., "a red winter jacket," "a green knitted hat," "oversized yellow gloves," "a backpack")
    - **Background/Environment:** What is the setting? Be very specific but also ready to simplify for South Park. (e.g., "a snowy street," "a classroom," "a dark alley," "a mountain landscape")
    - **Objects/Props:** Are there any significant items they are holding or interacting with?
2. **South Park Transformation:** Now, transform this detailed analysis into a prompt that inherently understands and applies the South Park visual language.
    - **Simplify and Stylize:** Convert all shapes and details to their blocky, flat South Park equivalents.
    - **Exaggerate:** If applicable, slightly exaggerate expressions or postures in a South Park manner.
    - **Outline:** Ensure the prompt implies thick black outlines.
    - **Color Palette:** Focus on flat, primary-like colors where appropriate.
    - **Contextualization:** If the image implies a certain mood or scenario, briefly hint at that within the South Park context.
3. **CRITICAL: Final Output Format:** Your final output must ONLY be the rewritten prompt text itself. Do not include any extra words, explanations, introductory phrases like "Here is the prompt:", or markdown formatting. Just the raw text.

Example of what the output should look like (but dynamically generated based on the image):
"Cartman standing with hands in his red jacket pockets, an angry expression on his face, snow falling, in South Park style"
or
"A character resembling Stan Marsh, wearing a blue hat and red jacket, with a neutral expression, sitting at a school desk, in the iconic South Park animation style"
`
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