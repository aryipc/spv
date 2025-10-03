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

		// --- 1. 关键：从 formData 获取文件和提示词 ---
		const formData = await request.formData()
		const file = formData.get("image") as File | null // 假设前端字段名为 'image'
		const geminiPrompt = formData.get("prompt") as string // 假设前端字段名为 'prompt'

		if (!file || !geminiPrompt || geminiPrompt.trim() === "") {
			return NextResponse.json({ error: "Image file and Prompt are required" }, { status: 400 })
		}

		// --- 2. 关键：上传图片到 Fal 存储以获取 URL (因为 Nano-Banana/edit 需要一个 URL) ---
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
		// 确保 Prompt 中包含最强的背景隔离和身体姿势要求
		const isolationSuffix = ", **centered, isolated logo on a pure white canvas, full body/pose included, no complex background, no extra person**"
		const finalPrompt = geminiPrompt + isolationSuffix
		
		// 负面提示：强化排除写实背景和人物，以匹配矢量 Logo 风格
		const negativePrompt = "photorealistic, photo, messy, low resolution, ugly, blurry, 3d, realistic shading, gradients, human, man, woman, body, clothes, t-shirt, tank top, street, cityscape, complex background, car, shadow, texture, bokeh"

		console.log(`[generate-image] Using Final Prompt: ${finalPrompt.substring(0, 100)}...`)

		const logs: string[] = []

		// --- 4. 调用 fal.subscribe (使用上传后的 URL) ---
		const result = await Promise.race([
			fal.subscribe(MODEL_ID_NANO, {
				input: {
					image_urls: [finalImageUrl], // 使用上传后的 URL
					prompt: finalPrompt,
					negative_prompt: negativePrompt,
					
					// 激进的风格转换强度
					strength: 0.85,
					
					// 尝试获取透明背景的 PNG
					output_format: "png",
					remove_background: true,
					background: "white",

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

		// --- 5. 结果解析和返回 (与旧代码相似的结构) ---
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
