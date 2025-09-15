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

    // --- V8.1 PROMPT TEMPLATE (Texture Sanitization) ---
    // Change: Added a new rule to avoid descriptive words for materials/textures
    // that imply shading, gloss, or complex lighting.
    const structuredPrompt = `You are an AI prompt generation assistant. Your task is to combine a hyper-detailed, style-neutral description of a user's image with a flexible, core-principles style guide that adapts based on the subject's gender.

    INSTRUCTIONS:
    1.  First, silently analyze the user-provided image with extreme detail.
        - **Identify Gender:** Determine if the main subject appears to be male, female, or ambiguous.
        - **Generate Description:** Write a rich, descriptive paragraph about the image.
        - **CRITICAL (Style & Texture Neutrality):**
            - Do NOT use any words that refer to the original image's style (e.g., "cartoon-like", "realistic").
            - **Do NOT use words describing materials or textures that conflict with a flat, simple art style.** Avoid words like "silk", "satin", "velvet", "glossy", "metallic", "shiny", "luminous", "furry", "textured". Instead, just describe the object and its color (e.g., instead of "a shiny red car", use "a red car").
        - **Content Details:** Describe each key person's specific clothing, colors, hair, accessories, posture, and facial expression. Also describe the environment and key objects.
    2.  Next, assemble the final prompt string, starting with your detailed description, followed by " • ", and then the flexible style guide.
    3.  **CONDITIONAL STYLE GUIDE ASSEMBLY:**
        - Start with: "Transform the subject into South Park cartoon style."
        - For "Character design", use the gender-based logic:
            - **Female:** Append " • Character design: simple geometric head shapes, large circular eyes with black pupils and prominent eyelashes, tiny oval mouth."
            - **Male/Ambiguous:** Append " • Character design: simple geometric head shapes, large circular eyes with black pupils, tiny oval mouth."
        - Append the rest of the guide verbatim: " • Art style: construction-paper aesthetic, minimal shading, bold outlines, flat bright colors. • Body proportions: simplistic and blocky bodies, often with short limbs and mitten-shaped hands."

    CRITICAL FINAL OUTPUT FORMAT:
    - Your output must be a single line of text following the rules above.
    - Do not add any other text, explanations, or formatting.
    `;

    // The rest of the code remains the same...
    const result = await genAI.generateContent({
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
    return NextResponse.json(
      { error: err.message || "Failed to analyze" },
      { status: 500 }
    );
  }
}