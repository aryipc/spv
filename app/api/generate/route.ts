import { type NextRequest, NextResponse } from "next/server"
import * as fal from "@fal-ai/serverless-client"

// 确保 FAL_KEY 环境变量已设置
fal.config({
	credentials: process.env.FAL_KEY,
})

// 锁定的模型：Nano Banana Edit
const MODEL_ID_NANO = "fal-ai/nano-banana/edit"

export async function POST(request: NextRequest) {
	try {
		console.log(`[generate-image] Starting Nano-Banana generation with model: ${MODEL_ID_NANO}`)

		// --- 1. 获取 JSON 数据 (只使用请求中传入的 URL 和 prompt) ---
		// 注意: 此处要求请求体是 JSON 格式，包含 imageUrl 和 prompt
		const { imageUrl, prompt: geminiPrompt } = await request.json()

		// 确保 Prompt 中包含最强的背景隔离和身体姿势要求
		const isolationSuffix = ", **centered, isolated logo on a pure white canvas, full body/pose included, no complex background, no extra person**"
		const finalPrompt = geminiPrompt + isolationSuffix
		
		// 负面提示：强化排除写实背景和人物，以匹配矢量 Logo 风格
		const negativePrompt = "photorealistic, photo, messy, low resolution, ugly, blurry, 3d, realistic shading, gradients, human, man, woman, body, clothes, t-shirt, tank top, street, cityscape, complex background, car, shadow, texture, bokeh"

		// finalImageUrl 直接使用请求传入的 URL
		const finalImageUrl = imageUrl

		console.log(`[generate-image] Using Final Image URL: ${finalImageUrl}`)
		console.log(`[generate-image] Using Final Prompt: ${finalPrompt.substring(0, 100)}...`)

		if (!finalImageUrl || !finalPrompt || finalPrompt.trim() === "") {
			return NextResponse.json({ error: "Missing image URL or prompt" }, { status: 400 })
		}

		const apiKey = process.env.FAL_KEY
		if (!apiKey) {
			return NextResponse.json({ error: "Fal AI API key is not configured" }, { status: 500 })
		}

		const logs: string[] = []

		// --- 2. 调用 fal.subscribe (Nano-Banana 模式) ---
		const result = await Promise.race([
			fal.subscribe(MODEL_ID_NANO, {
				input: {
					image_urls: [finalImageUrl],
					prompt: finalPrompt,
					negative_prompt: negativePrompt,
					
					// 激进的风格转换强度 (0.85 尝试彻底重绘风格)
					strength: 0.85,
					
					// 尝试获取透明背景的 PNG
					output_format: "png",
					remove_background: true, // 尝试使用背景移除参数
					background: "white", // 额外的安全措施：如果不能透明，就用白色背景

					width: 1024,
					height: 1024,
					num_images: 1,
				},
				logs: true,
				onQueueUpdate(update) {
					console.log("[generate-image] Queue update:", update)
					if (update.logs) {
						update.logs.forEach((l) => {
							console.log("[generate-image] Log:", l.message)
							logs.push(l.message)
						})
					}
				},
			}),
			new Promise<never>((_, reject) =>
				setTimeout(() => reject(new Error("Generation timeout after 120 seconds")), 120000),
			),
		])

		// --- 3. 结果解析和错误处理 ---
		if (!result || !result.images || result.images.length === 0) {
			console.log("[generate-image] No result or empty images array returned from fal-ai")
			throw new Error("No image generated. The result was empty.")
		}

		const generatedImageUrl = result.images[0]?.url

		console.log("[generate-image] Extracted image URL:", generatedImageUrl)

		if (!generatedImageUrl) {
			console.log("[generate-image] No image URL found in the expected 'images' array field")
			throw new Error(`No image URL found. Full response: ${JSON.stringify(result, null, 2)}`)
		}

		console.log("[generate-image] Success! Generated image URL:", generatedImageUrl)
		return NextResponse.json({
			imageUrl: generatedImageUrl,
			logs: logs.length > 0 ? logs : undefined,
		})
	} catch (error: any) {
		console.error("[generate-image] Error generating image:", error)
		return NextResponse.json({ error: error.message || "Image generation failed" }, { status: 500 })
	}
}
