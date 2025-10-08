import { type NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

// 确保 GEMINI_API_KEY 环境变量已设置
if (!process.env.GEMINI_API_KEY) {
	throw new Error("GEMINI_API_KEY environment variable is not set.")
}

// ----------------------------------------------------
// *** 注意：这里保持了原有模型和安全设置 ***
// ----------------------------------------------------
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

const gemini = genAI.getGenerativeModel({
	model: "gemini-2.5-pro",
	// 保持原有的安全设置
})

// *** 移除：硬币边框样式列表不再需要 ***

export async function POST(req: NextRequest) {
	try {
		const formData = await req.formData()
		const file = formData.get("image") as File | null
		
		if (!file) {
			return NextResponse.json({ error: "Image file is required." }, { status: 400 })
		}

		// *** 移除：随机选择硬币样式的逻辑 ***

		const bytes = await file.arrayBuffer()
		const base64 = Buffer.from(bytes).toString("base64")

		// ----------------------------------------------------
		// *** Prompt Refactoring: 新的 Saiyan Aura 风格 ***
		// ----------------------------------------------------
		const fullStructuredPromptText = `You are an expert prompt engineer for an image generation AI. Your goal is to rewrite a description of a user-provided image into a new artistic style, specifically a **Dragon Ball Z (DBZ) Super Saiyan Transformation** scene.

**Target Output Structure and Style:**
A **hyper-detailed, dynamic Japanese anime illustration of the subject's entire body or upper torso**, captured in a **powerful, dynamic, or characteristic action pose**. The subject must be centered, with an **epic, serious, and cool expression**.
**Crucially, the subject must be surrounded by a massive, sparkling, electric yellow and white energy aura**, just like a Super Saiyan.
The **semi-transparent Binance (BNB) logo must be subtly integrated and glowing within the swirling Super Saiyan aura energy effect**. The logo should be an embedded effect, not a border.
The overall aesthetic must be **professional, highly-detailed cel-shading anime illustration, intense lighting, and a strong sense of action and power**.
The final image should resemble a **high-quality, modern DBZ-style collectible card art, focusing on the character's intense transformation moment.**

**Instructions:**
1. Silently analyze the provided user image to accurately identify the **central subject**, its unique features, and the **specific pose and visible limbs/clothing**.
2. **STYLE ADJUSTMENT:** Regardless of the original subject (human, object, or animal), render it in a **Dragon Ball Z-inspired anime style** with an emphasis on **power, sharp angles, and dynamic motion blur/effects**.
3. Synthesize these identified elements into a descriptive prompt, **explicitly including the subject's pose, any visible hands, arms, or accessories**. Prioritize the epic, intense anime aesthetic.
4. **CRITICAL REWRITE STEP:** Ensure the rewritten prompt explicitly calls for the **serious/cool expression**, the **electric Saiyan-style aura**, and the **Binance logo integration** in the aura.
5. **CRITICAL (Isolation):** Your final output must end with the exact isolating phrase: ", **isolated, centered illustration on a dark, energy-filled, abstract background, full body/pose included, highly-detailed cel-shading, intense glow effect, no text, no frame**"
6. **FINAL OUTPUT:** Your final output must **ONLY** be the rewritten prompt text itself. Do not include any extra words, explanations, introductory phrases, or markdown formatting. Just the raw text.`;
		
		// ----------------------------------------------------
		// *** 调用 Gemini API (Prompt不变) ***
		// ----------------------------------------------------

		const result = await gemini.generateContent({
			contents: [
				{
					role: "user",
					parts: [
						{ inlineData: { mimeType: file.type, data: base64 } },
						{ text: fullStructuredPromptText },
					],
				},
			],
			generationConfig: {
				temperature: 0.2, // 保持低随机性
			},
		})

		const prompt = result.response.text()

		if (!prompt) {
			return NextResponse.json({ error: "Failed to generate prompt text. (Safety Block Likely)" }, { status: 500 })
		}

		return NextResponse.json({ prompt })
	} catch (err: any) {
		console.error("Gemini error:", err)
		return NextResponse.json({ error: err.message || "Failed to analyze" }, { status: 500 })
	}
}