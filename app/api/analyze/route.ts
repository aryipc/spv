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

    // --- V7 PROMPT TEMPLATE (Style Filtering) ---
    // Change: Emphasized in the instructions for the dynamic part that NO style words should be used.
    // The goal is to extract only objective, non-stylized content.
    const structuredPrompt = `You are an AI prompt generation assistant. Your task is to combine a hyper-detailed, **style-neutral** description of a user's image with a flexible, core-principles style guide.

    INSTRUCTIONS:
    1.  First, silently analyze the user-provided image with extreme detail to generate a rich, descriptive paragraph.
        - **CRITICAL:** When describing the image, **DO NOT use any words that refer to the original image's style or art form** (e.g., avoid "chibi-style", "cartoon-like", "realistic", "drawing", "painting", "photo-realistic", "3D render", "vector art", "anime", "manga", "pixel art", "illustration", "sketch", "digital art", "traditional art", "sculpture", "abstract", "impressionistic", "minimalist", "stylized", "blurry" for effect). Focus purely on objective content.
        - **Subjects & Appearance:** Describe each key person individually, including specific clothing, colors, hair, and accessories.
        - **Positions, Poses & Expressions:** Detail their exact positions, posture (e.g., 'arms crossed'), and facial expressions.
        - **Environment:** Describe the setting and key objects (e.g., 'a wooden podium with a seal', 'a background of flags').
        Combine these points into a single, cohesive descriptive paragraph.
    2.  Next, append the following flexible style guide, exactly as written, after your description. The separator must be " • ".
    
    THE FLEXIBLE STYLE GUIDE (Append this part verbatim):
    Transform the subject into South Park cartoon style. • Character design: simple geometric head shapes, large circular eyes with black pupils, tiny oval mouth. • Art style: construction-paper aesthetic, minimal shading, bold outlines, flat bright colors. • Body proportions: simplistic and blocky bodies, often with short limbs and mitten-shaped hands.

    CRITICAL FINAL OUTPUT FORMAT:
    - Your output must be a single line of text, starting with your detailed description, followed by " • ", and then the entire flexible style guide.
    - Do not add any other text, explanations, or formatting.

    EXAMPLE OUTPUT (for the provided image you provided):
    A person with short, gray hair wears a yellow and black bandana that has a coiled rattlesnake and the words "DON'T TREAD ON ME". White oval sunglasses cover their eyes. They are wearing a white tank top with the words "STOP BEING POOR" printed on it. The person is positioned slightly off-center, facing forward. The background depicts a resort pool area with palm trees and a building, suggesting a sunny setting. Two small, gray rabbits are visible in the bottom right corner, nestled together near a small, white cloud. • Transform the subject into South Park cartoon style. • Character design: simple geometric head shapes, large circular eyes with black pupils, tiny oval mouth. • Art style: construction-paper aesthetic, minimal shading, bold outlines, flat bright colors. • Body proportions: simplistic and blocky bodies, often with short limbs and mitten-shaped hands.
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
    if (err.message && err.message.includes('is not a function')) {
        return NextResponse.json(
            { error: "Internal server error: A library function was called incorrectly." },
            { status: 500 }
        );
    }
    return NextResponse.json(
      { error: err.message || "Failed to analyze" },
      { status: 500 }
    );
  }
}