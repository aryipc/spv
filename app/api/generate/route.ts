import { type NextRequest, NextResponse } from "next/server"
import * as fal from "@fal-ai/serverless-client"

// 确保 FAL_KEY 环境变量已设置
fal.config({
	credentials: process.env.FAL_KEY,
})

// 锁定的模型：Nano Banana Edit
const MODEL_ID_NANO = "fal-ai/nano-banana/edit"

// *** 关键：硬编码 Binance Logo 的直接 URL ***
const BINANCE_LOGO_URL = "https://pbs.twimg.com/media/G2vGq0AXYAAcBO7?format=png&name=900x900"; 
// 替换为更清晰的 Logo 描述，与 Gemini Prompt 保持一致
const BINANCE_LOGO_PROMPT_KEYWORD = "Binance (BNB) logo";


export async function POST(request: NextRequest) {
	try {
		console.log(`[generate-image] Starting Nano-Banana generation with model: ${MODEL_ID_NANO}`)

		// --- 1. 关键：从 formData 获取文件和提示词 ---
		const formData = await request.formData()
		const file = formData.get("image") as File | null 
		const geminiPrompt = formData.get("prompt") as string 

		if (!file || !geminiPrompt || geminiPrompt.trim() === "") {
			return NextResponse.json({ error: "Image file and Prompt are required" }, { status: 400 })
		}

		// --- 2. 关键：上传用户图片到 Fal 存储以获取 URL ---
		let finalImageUrl: string
		try {
			finalImageUrl = await Promise.race([
				fal.storage.upload(file),
				new Promise<never>((_, reject) =>
					setTimeout(() => reject(new Error("Upload timeout after 30 seconds")), 30000),
				),
			])
			console.log("[generate-image] Image uploaded successfully:", finalImageUrl)
		} catch (uploadError: any) {
			console.error("[generate-image] Upload error:", uploadError)
			throw new Error(`Failed to upload image: ${uploadError.message}`)
		}


		// --- 3. 准备 Nano-Banana 参数 ---
		// 依赖 Gemini Prompt 中已经包含的隔离短语
		const finalPrompt = geminiPrompt
		
		// 负面提示词保持优化后的版本
		const negativePrompt = "photorealistic, photo, messy, low resolution, ugly, blurry, 3d, realistic shading, gradients, shadow, texture, bokeh, complex background, complex shadows, depth of field, volume, human, man, woman, body, clothes, t-shirt, tank top, street, cityscape, car"

		console.log(`[generate-image] Using Final Prompt: ${finalPrompt.substring(0, 100)}...`)

		const logs: string[] = []

		// --- 4. 调用 fal.subscribe (使用上传后的用户图片 URL 和硬编码的 Logo URL) ---
		const result = await Promise.race([
			fal.subscribe(MODEL_ID_NANO, {
				input: {
					// *** 关键修改：将用户图片和 Logo 图片都作为输入 ***
					image_urls: [finalImageUrl, BINANCE_LOGO_URL], 
					prompt: finalPrompt,
					negative_prompt: negativePrompt,
					
					// 激进的风格转换强度
					strength: 0.85,
					
					// 尝试获取透明背景的 PNG
					output_format: "png",
					remove_background: true,
					background: "dark", // 使用 dark 背景更适合暗黑光环效果

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

		// --- 5. 结果解析和返回 ---
		if (!result || !result.images || result.images.length === 0) {
			console.log("[generate-image] No result or empty images array returned from fal-ai")
			throw new Error("No image generated. The result was empty.")
		}

		const generatedImageUrl = result.images[0]?.url

		if (!generatedImageUrl) {
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