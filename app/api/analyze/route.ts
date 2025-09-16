import { type NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const gemini = genAI.getGenerativeModel({ model: "gemini-2.5-pro" }); 

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("image") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Image is required" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");

    // --- V11 PROMPT TEMPLATE (Pose-Forcing) ---
    // This is the final, most powerful version of the prompt template.
    const structuredPrompt = `You are an expert South Park Animation Director. Your task is to analyze a real-world image and reinterpret its content and pose into a scene that could authentically appear in a South Park episode, translating it into a perfect prompt for an image generation AI.

    INSTRUCTIONS:
    1.  First, perform a detailed, style-neutral analysis of the image's content (who, what, where).
    2.  **CRITICAL (Creative Pose Adaptation):** Analyze the subject's pose and adapt it. **This is your most important creative task.** The final prompt's success depends on correctly translating the original pose into a simplified but contextually similar South Park equivalent. Follow these rules:
        - **If the pose is lying down, reclined, or lounging (like on a floor or bed):** YOU MUST translate it to a simplified 'lying flat' pose. The body should be stiff, like a fallen paper doll. The head can be turned to face the viewer to maintain engagement. This often looks comedic.
        - **If the pose is dynamic (jumping, dancing, mid-air):** Translate it to a static standing pose but add context to convey the action (e.g., an excited expression).
        - **If the pose involves complex interaction (hugging, fighting):** Translate it to two characters standing stiffly near each other with simple arm positions.
        - **Default Pose:** For all other scenarios, simplify to a basic standing pose.
    3.  **Generate Final Description:** Based on your adaptation, write a rich, descriptive paragraph of the *new, simplified scene*.
        - **CRITICAL (Style & Texture Neutrality):** Do NOT use words referencing the original style ("photo") or complex textures ("satin", "glossy").
        - **Content Details:** Describe the adapted scene, including clothing, colors, hair, accessories, and facial expression.
    4.  **Assemble the Final Prompt:** Combine your new description with the appropriate gender-based style guide using " • " as a separator.

    STYLE GUIDE RULES:
    - Base Style: "Transform the subject into South Park cartoon style."
    - Female Design: " • Character design: simple geometric head shapes, large circular eyes with black pupils and prominent eyelashes, tiny oval mouth."
    - Male/Ambiguous Design: " • Character design: simple geometric head shapes, large circular eyes with black pupils, tiny oval mouth."
    - Universal Style: " • Art style: construction-paper aesthetic, minimal shading, bold outlines, flat bright colors. • Body proportions: simplistic and blocky bodies, often with short limbs and mitten-shaped hands."
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
