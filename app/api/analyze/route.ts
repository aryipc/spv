import { type NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai"

// 确保 GEMINI_API_KEY 环境变量已设置
if (!process.env.GEMINI_API_KEY) {
	throw new Error("GEMINI_API_KEY environment variable is not set.")
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

// 核心升级: 使用 gemini-2.5-pro 并调整安全设置
const gemini = genAI.getGenerativeModel({
	model: "gemini-2.5-pro",
	safetySettings: [
		{
			// 针对性地调整露骨内容的阈值，以避免真人照片被阻断
			category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
			threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
		},
	],
})

// *** 新增：可选的硬币边框样式列表 ***
const coinStyles = [
    "thick, clean, highly polished gold circular border",
    "thick, clean, highly polished silver circular border",
    "thick, clean, matte black metallic circular border",
    "thick, clean, iridescent, metallic rainbow circular border",
];


export async function POST(req: NextRequest) {
	try {
		const formData = await req.formData()
		const file = formData.get("image") as File | null
		
		if (!file) {
			return NextResponse.json({ error: "Image file is required." }, { status: 400 })
		}

		// *** 新增：随机选择一个硬币样式 ***
		const randomIndex = Math.floor(Math.random() * coinStyles.length);
		const randomCoinStyle = coinStyles[randomIndex];

		const bytes = await file.arrayBuffer()
		const base64 = Buffer.from(bytes).toString("base64")

		// ----------------------------------------------------
		// *** Prompt Refactoring: 注入随机样式 ***
		// ----------------------------------------------------
		// 将 Prompt 文本改为模板字面量，以便注入随机样式
		const fullStructuredPromptText = `You are an expert prompt engineer for an image generation AI. Your goal is to rewrite a description of a user-provided image into a new artistic style, specifically for a **digital crypto coin logo (Token Logo)**.

**Target Output Structure and Style:**
A **highly stylized, minimalist vector illustration of the subject's entire body or upper torso**, captured in a **dynamic or characteristic pose**. The subject must be centered inside a **${randomCoinStyle}**.
**Crucially, the logo must feature multiple integrated text elements and/or decorative icons** surrounding the circular border and/or within a banner below it, to create a **complex, multi-element token design**. The content for these elements must be synthesized directly from the **subject's visible text or key features** in the user-provided image.
The circular border should resemble a **polished digital crypto coin or token**.
The overall aesthetic must be **ultra-minimalist flat vector art, pure flat design (no gradients/shading), bold outlines, clean lines, highly stylized for a brand logo**.
The entire composition should resemble a **polished, multi-element digital crypto coin or token with integrated text and icons.**

**Instructions:**
1. Silently analyze the provided user image to accurately identify the **central subject**, its unique features, ALL text content, **and most importantly, the specific pose and visible limbs/clothing**.
2. **STYLE ADJUSTMENT:** If the subject is a **human or avatar**, ensure the style emphasizes **oversized proportions, simplicity, and a bold, cartoon/chibi aesthetic**. If the subject is an **object, animal, or machine**, focus on rendering it as a **clean, iconic vector symbol** that retains its key characteristics.
3. Synthesize these identified elements and text into a descriptive prompt, **explicitly including the subject's pose, any visible hands, arms, or accessories**. Prioritize the extreme simplicity and flat aesthetic.
4. **CRITICAL REWRITE STEP:** Your output prompt must use the legible text content and place it creatively as integrated design elements in the final logo structure.
5. **CRITICAL (Isolation):** Your final output must end with the exact isolating phrase: ", **isolated, centered logo on a pure white canvas, full body/pose included, no complex background, no extra person**"
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
