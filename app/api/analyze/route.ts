import { type NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const gemini = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("image") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Image is required" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");

    // --- V9 PROMPT TEMPLATE (Optimized for Powerful Models like Imagen 4) ---
    // Change: The style guide is now a concise, high-level instruction.
    // Removed explicit conditional logic for eyelashes, trusting the model's contextual knowledge.
    const structuredPrompt = `You are an expert AI prompt engineer. Your task is to translate the content of a user's image into a clear and effective text prompt for a powerful text-to-image model like Imagen 4.

    INSTRUCTIONS:
    1.  **Analyze Content (Style-Neutral):** First, perform a detailed, style-neutral analysis of the user-provided image.
        - **CRITICAL:** Do NOT mention the original art style (e.g., avoid "chibi," "realistic," "cartoon"). Focus only on objective content.
        - Describe the main subject(s), their specific clothing, appearance, pose, and facial expression.
        - Describe the environment, key objects, and overall composition.
        - Condense this analysis into a rich, descriptive paragraph.
    2.  **Append Style Instruction:** After the content description, append a clear, high-level style instruction. The final prompt should be a single, flowing sentence or paragraph.

    CRITICAL FINAL OUTPUT FORMAT:
    - Your output must be only the final prompt text.
    - Do not add explanations or formatting.
    - The format should be: "[Detailed content description] in the distinct 2D cutout animation style of South Park."

    EXAMPLE OUTPUT (for an image of a woman):
    A woman with long blonde hair, wearing a pink beret and a purple jacket, stands with her hands on her hips, smiling, on a snowy town street, in the distinct 2D cutout animation style of South Park.
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
              text: structuredPrompt,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.1, 
      },
    });

    const prompt = result.response.text();

    return NextResponse.json({ prompt });
  } catch (err: any) {
    console.error("Gemini error:", err);
    // Simplified error handling for brevity
    return NextResponse.json(
      { error: err.message || "Failed to analyze" },
      { status: 500 }
    );
  }
}