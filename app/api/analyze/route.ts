import { type NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const gemini = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("image") as File | null;
    
    // The 'style' variable is not used in the prompt, which is fine as the prompt is hardcoded for South Park.
    // If you wanted to make it dynamic, you'd insert the `style` variable into the structuredPrompt.

    if (!file) {
      return NextResponse.json({ error: "Image is required" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");

    // --- REVISED PROMPT TEMPLATE ---
    // This new prompt instructs Gemini to create a concise, keyword-focused prompt
    // that is much more effective for image generation models.
    const structuredPrompt = `You are an expert prompt engineer for AI image generators like Stable Diffusion. Your task is to analyze a user's image and convert it into a concise, direct, and keyword-heavy prompt that captures the essence of the image in the South Park art style.

    TARGET STYLE CHARACTERISTICS:
    - Art Style: South Park cartoon style
    - Shapes: Simple, blocky, geometric characters.
    - Outlines: Thick, distinct black outlines on everything.
    - Colors: Flat, solid, often primary colors. No gradients or complex shading.
    - Expressions: Exaggerated or deadpan (annoyed, shocked, blank).
    - Backgrounds: Very simple, minimalist, flat colored planes.

    INSTRUCTIONS:
    1.  Analyze the provided image to identify the main subject(s), action, setting, and mood.
    2.  Convert your analysis into a comma-separated list of keywords and short phrases.
    3.  CRITICAL: Always start the prompt with "South Park style," to give it maximum weight.
    4.  Simplify all descriptions. Instead of "a man wearing a tan sheriff's uniform," use "South Park sheriff character." Instead of "men in dark suits," use "blocky government agents."
    5.  Explicitly include keywords from the style characteristics, like "thick outlines," "flat colors," "simple background."
    6.  AVOID long, descriptive sentences. Think in terms of tags or keywords.

    CRITICAL FINAL OUTPUT FORMAT:
    - Your entire output MUST only be the raw prompt text.
    - Do not include explanations, introductions like "Here is your prompt:", or markdown.
    - The output must be a single line of comma-separated text.

    GOOD EXAMPLE OUTPUTS (based on different images):
    - South Park style, 4 kids at a bus stop, snowy day, simple background, thick outlines, flat colors.
    - South Park style, Cartman character sitting on a couch, angry expression, messy living room, thick outlines.
    - South Park style, blocky character in a lab coat, holding a beaker, simple laboratory background, flat colors.
    `;

    const result = await gemini.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: { mimeType: file.type, data: base64 },
            },
            {
              text: structuredPrompt, // Using the new, improved prompt
            },
          ],
        },
      ],
    }, {
      temperature: 0.2, // Low temperature is good for consistency
    });

    const prompt = result.response.text();

    return NextResponse.json({ prompt });
  } catch (err: any) {
    console.error("Gemini error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to analyze" },
      { status: 500 }
    );
  }
}
