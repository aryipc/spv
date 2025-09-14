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

    // --- V6 PROMPT TEMPLATE (Flexible Version) ---
    // Change: Made the static style guide more flexible based on user feedback.
    // 1. Removed the hardcoded "Clothing" section.
    // 2. Generalized "head shape" to allow for more variety.
    // 3. Generalized "body proportions" to fit different character types.
    const structuredPrompt = `You are an AI prompt generation assistant. Your task is to combine a hyper-detailed description of a user's image with a flexible, core-principles style guide.

    INSTRUCTIONS:
    1.  First, silently analyze the user-provided image with extreme detail to generate a rich, descriptive paragraph.
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

    EXAMPLE OUTPUT (for the provided image):
    A central figure with dark hair, wearing a dark navy suit and a black and white patterned tie, speaks with a serious expression from behind a wooden podium that has a golden circular seal. To his right stands a man with short brown hair in a dark suit and gold tie, with a neutral expression, hands clasped. To the speaker's left is a bald man in a dark suit and red tie, looking forward sternly. Furthest to the right, a sheriff in a tan uniform and a dark cowboy hat stands with his arms crossed. The background is composed of large, simple royal blue and yellow flags. • Transform the subject into South Park cartoon style. • Character design: simple geometric head shapes, large circular eyes with black pupils, tiny oval mouth. • Art style: construction-paper aesthetic, minimal shading, bold outlines, flat bright colors. • Body proportions: simplistic and blocky bodies, often with short limbs and mitten-shaped hands.
    `;

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
    }, {
      temperature: 0.1, 
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