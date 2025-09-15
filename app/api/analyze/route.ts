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

    const structuredPrompt = `You are an AI prompt generation assistant. Your task is to combine a hyper-detailed, style-neutral description of a user's image with a flexible, core-principles style guide that adapts based on the subject's gender.

    INSTRUCTIONS:
    1.  First, silently analyze the user-provided image with extreme detail.
        - **Identify Gender:** Determine if the main subject of the image appears to be male, female, or if the gender is ambiguous/not applicable. This is crucial for the next step.
        - **Generate Description:** Write a rich, descriptive paragraph about the image.
        - **CRITICAL (Style Neutrality):** When describing the image, DO NOT use any words that refer to the original image's style or art form (e.g., avoid "chibi-style", "cartoon-like", "realistic", etc.). Focus purely on objective content.
        - **Content Details:** Describe each key person's specific clothing, colors, hair, accessories, posture, and facial expression. Also describe the environment and key objects.
    2.  Next, assemble the final prompt string. It must start with your detailed description, followed by " • ", and then the flexible style guide.
    3.  **CONDITIONAL STYLE GUIDE ASSEMBLY:**
        - Start with: "Transform the subject into South Park cartoon style."
        - For "Character design", use the following logic:
            - **If the subject is identified as female:** Append " • Character design: simple geometric head shapes, large circular eyes with black pupils and prominent eyelashes, tiny oval mouth."
            - **If the subject is male or gender is ambiguous/not applicable:** Append " • Character design: simple geometric head shapes, large circular eyes with black pupils, tiny oval mouth."
        - Append the rest of the guide verbatim: " • Art style: construction-paper aesthetic, minimal shading, bold outlines, flat bright colors. • Body proportions: simplistic and blocky bodies, often with short limbs and mitten-shaped hands."

    CRITICAL FINAL OUTPUT FORMAT:
    - Your output must be a single line of text following the rules above.
    - Do not add any other text, explanations, or formatting.

    EXAMPLE OUTPUT (for an image of a woman):
    A woman with long blonde hair, wearing a pink beret and a purple jacket, stands with her hands on her hips, smiling. She is in a snowy town street. • Transform the subject into South Park cartoon style. • Character design: simple geometric head shapes, large circular eyes with black pupils and prominent eyelashes, tiny oval mouth. • Art style: construction-paper aesthetic, minimal shading, bold outlines, flat bright colors. • Body proportions: simplistic and blocky bodies, often with short limbs and mitten-shaped hands.
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
    return NextResponse.json(
      { error: err.message || "Failed to analyze" },
      { status: 500 }
    );
  }
}