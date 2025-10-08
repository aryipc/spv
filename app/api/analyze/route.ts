import { type NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

// 确保 GEMINI_API_KEY 环境变量已设置
if (!process.env.GEMINI_API_KEY) {
	throw new Error("GEMINI_API_KEY environment variable is not set.")
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

const gemini = genAI.getGenerativeModel({
	model: "gemini-2.5-pro",
	// 保持原有的安全设置
})


export async function POST(req: NextRequest) {
	try {
		const formData = await req.formData()
		const file = formData.get("image") as File | null
		
		if (!file) {
			return NextResponse.json({ error: "Image file is required." }, { status: 400 })
		}

		const bytes = await file.arrayBuffer()
		const base64 = Buffer.from(bytes).toString("base64")

		// ----------------------------------------------------
		// *** Prompt Refactoring: 保持原始风格，添加黄色光环和币安Logo ***
		// ----------------------------------------------------
		const fullStructuredPromptText = `You are an expert prompt engineer for an image generation AI. Your goal is to subtly modify a user-provided image by adding a powerful energy aura and a logo, while **strictly preserving the original artistic style (e.g., photorealistic, cartoon, anime, illustration) and subject's characteristics.**

**Target Output Structure and Style:**
The output must maintain the **exact original style (photorealistic, cartoon, anime, comic, illustration, 3D render, etc.)** of the subject and its presentation.
The central subject, captured in its **original pose and expression**, should be enveloped in a **dynamic, sparkling, electric yellow and white energy aura**, similar to a powerful energy release. If the subject's expression allows, it should appear **cool or slightly intense/serious** within the aura.
**Crucially, a semi-transparent Binance (BNB) logo must be subtly integrated and glowing within the swirling yellow and white energy effect of the aura**. The logo should be an embedded element within the energy, not a separate overlay.
The aura should emanate from the subject's entire visible form (full body or upper torso).
The overall composition should feel like an **enhanced version of the original image, with added power and branding, without altering the fundamental art style.**

**Instructions:**
1. Silently analyze the provided user image to accurately identify the **central subject**, its unique features, **and especially its exact artistic style**.
2. **STYLE PRESERVATION:** The generated prompt **must emphasize maintaining the detected original style** (e.g., "photorealistic image of...", "cartoon drawing of...", "anime illustration of...") for the subject.
3. Synthesize these identified elements into a descriptive prompt, **explicitly including the subject's original pose, any visible hands, arms, accessories, and most importantly, its original art style.**
4. **CRITICAL ADDITION:** Ensure the rewritten prompt explicitly calls for the **electric yellow and white energy aura surrounding the subject** and the **subtle, semi-transparent Binance logo integrated within that aura.**
5. **CRITICAL (Isolation):** Your final output must end with the exact isolating phrase: ", **isolated, centered, full body/pose included, intense yellow glow effect, subtle Binance logo embedded in aura, vibrant background, high detail**"
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