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
		// *** 最终 Prompt：保留风格，移除所有生物特征/身份，指定 Binance Logo ***
		// ----------------------------------------------------
		const fullStructuredPromptText = `You are an expert prompt engineer for an image generation AI. Your goal is to subtly modify a user-provided image by adding a powerful energy aura and a specific branded logo, while **strictly preserving the original artistic style (e.g., photorealistic, cartoon, anime, illustration) and subject's characteristics.**

**Target Output Structure and Style:**
The output must maintain the **exact original style (photorealistic, cartoon, anime, comic, illustration, 3D render, etc.)** of the subject and its presentation. The entire scene must use **dark, high-contrast, moody lighting** to make the aura stand out.
The central subject, captured in its **original pose**, should be enveloped in a **soft, highly diffused, ethereal yellow and white energy haze/glow**, **gently emanating and spreading outwards** from the body. If the subject's expression allows, it should be adjusted to appear **intense, serious, and cool** within the atmosphere.
The subject must be heavily influenced by the light, receiving a strong, warm **yellow color cast** and intense rim lighting from the aura.
**Crucially, multiple smaller, semi-transparent Binance (BNB) logos/token symbols must be subtly integrated and glowing as an ethereal background element, scattered within the diffused yellow aura surrounding the subject.** The logos must be the official Binance "three lines" style and appear to be part of the ambient light and energy, not a solid object or a central decal.
The aura should emanate from the subject's entire visible form (full body or upper torso).
The overall composition should feel like an **enhanced, dramatic version of the original image, with added power and branding, without fundamentally altering the art style.**

**Instructions:**
1. Silently analyze the provided user image to accurately identify the **central subject**, its unique features, **and especially its exact artistic style**.
2. **CRITICAL NAME/IDENTITY REMOVAL:** **Do NOT include any proper nouns, specific names, brand names, company names, or any terms that imply a specific title, profession, or identity (e.g., CEO, founder, president).** **Furthermore, remove all specific biological or ethnic descriptors (e.g., 'East Asian', 'blonde hair', 'mole near her mouth', 'short buzz cut')**. You must use only **purely generic descriptors** focusing on clothes, pose, and hair style (e.g., "A person with long dark hair, wearing a white blazer and a necklace").
3. **STYLE PRESERVATION:** The generated prompt **must emphasize maintaining the detected original style** (e.g., "photorealistic image of...", "cartoon drawing of...") for the subject.
4. Synthesize these identified elements into a descriptive prompt, **explicitly including the subject's original pose, any visible hands, arms, accessories, and most importantly, its original art style.**
5. **CRITICAL ADDITION:** Ensure the rewritten prompt explicitly calls for the **soft, highly diffused yellow energy haze/glow spreading outwards**, the **strong yellow color cast on the subject**, the **dark, high-contrast lighting**, and the **multiple, scattered, subtle Binance (BNB) logos embedded in the aura.**
6. **CRITICAL (Isolation):** Your final output must end with the exact isolating phrase: ", **isolated, centered, full body/pose included, highly diffused soft yellow glow effect, multiple scattered subtle Binance (BNB) logos embedded in aura, dark background, intense yellow rim lighting, high detail**"
7. **FINAL OUTPUT:** Your final output must **ONLY** be the rewritten prompt text itself. Do not include any extra words, explanations, introductory phrases, or markdown formatting. Just the raw text.`;
		
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