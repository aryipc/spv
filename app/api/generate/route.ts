import { type NextRequest, NextResponse } from "next/server";
import * as fal from "@fal-ai/serverless-client";

// Configure the fal-ai client with your credentials
fal.config({
  credentials: process.env.FAL_KEY,
});

export async function POST(request: NextRequest) {
  try {
    console.log("[v1] Starting imagen4 generation");
    const formData = await request.formData();
    
    // REMOVED: No longer need to get an image file
    // const file = formData.get("image") as File | null

    // Get the prompt and the desired model tier from the form data
    const prompt = formData.get("prompt") as string;
    const model = (formData.get("model") as string) || "Imagen 4"; // Default to standard model

    console.log("[v1] Prompt received:", !!prompt, "Model selected:", model);
    console.log("[v1] Prompt content:", prompt);

    // REMOVED: The check for a file is no longer necessary
    // if (!file) { ... }

    if (!prompt || prompt.trim() === "") {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    // REMOVED: The entire image upload block is gone as it's not needed for Text-to-Image
    
    const logs: string[] = [];

    console.log(`[v1] Starting fal-ai generation with imagen4/preview using model: ${model}`);

    const result = await Promise.race([
      fal.subscribe("fal-ai/imagen4/preview", {
        input: {
          // UPDATED: Input now uses model_name and does not need image_urls
          prompt,
          model_name: model,
          num_images: 1,
          output_format: "jpeg",
        },
        logs: true,
        onQueueUpdate(update) {
          console.log("[v1] Queue update:", update);
          if (update.logs) {
            update.logs.forEach((l) => {
              console.log("[v1] Log:", l.message);
              logs.push(l.message);
            });
          }
        },
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Generation timeout after 120 seconds")), 120000)
      ),
    ]);

    console.log("[v1] Full generation result:", JSON.stringify(result, null, 2));

    if (!result || !result.images || result.images.length === 0) {
      console.log("[v1] No result or empty images array returned from fal-ai");
      throw new Error("No image generated. The result was empty.");
    }

    // SIMPLIFIED: Newer models like Imagen 4 have a consistent response structure.
    const generatedImageUrl = result.images[0]?.url;

    console.log("[v1] Extracted image URL:", generatedImageUrl);

    if (!generatedImageUrl) {
      console.log("[v1] No image URL found in the expected 'images' array field");
      throw new Error(`No image URL found. Full response: ${JSON.stringify(result, null, 2)}`);
    }

    console.log("[v1] Success! Generated image URL:", generatedImageUrl);
    return NextResponse.json({ imageUrl: generatedImageUrl, logs });
  } catch (error: any) {
    console.error("[v1] Error generating image:", error);
    return NextResponse.json({ error: error.message || "Failed to generate image" }, { status: 500 });
  }
}
