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

    // --- V5 PROMPT TEMPLATE ---
    // Change: The instructions for the dynamic part are now significantly more detailed,
    // pushing Gemini to extract more specific visual information from the image.
    const structuredPrompt = `You are an AI prompt generation assistant. Your task is to combine a hyper-detailed description of a user's image with a fixed, specific style guide.

    INSTRUCTIONS:
    1.  First, silently analyze the user-provided image with extreme detail to generate a rich, descriptive paragraph.
        - **Subjects:** Identify and describe each key person individually.
        - **Appearance & Clothing:** For each subject, detail their specific clothing (e.g., 'a dark navy suit with a patterned blue and white tie'), hair style/color, and accessories (e.g., 'a tan cowboy hat').
        - **Positions & Poses:** Describe their exact positions relative to one another (e.g., 'The main speaker is centered, a man in a suit stands to his right, slightly behind him...'). Note their posture (e.g., 'hands clasped in front', 'arms crossed').
        - **Expressions:** Clearly state the facial expression of each subject (e.g., 'a serious, focused expression', 'a stern, slightly annoyed look').
        - **Environment:** Describe the setting, including key objects and their details (e.g., 'a wooden podium with a circular golden seal', 'a background of alternating royal blue and yellow flags').
        Combine these points into a single, cohesive descriptive paragraph.
    2.  Next, append the following detailed style guide, exactly as written, after your description. The separator must be " • ".
    
    THE FIXED STYLE GUIDE (Append this part verbatim):
    Transform the subject into South Park cartoon style. • Character design: flat 2D cutout look, simple round head, large circular eyes with black pupils, tiny oval mouth. • Art style: construction-paper aesthetic, minimal shading, bold outlines, flat bright colors. • Body proportions: short, chubby body, stubby arms and legs, mitten-shaped hands. • Clothing: plain blocky outfits--sweaters, jackets, pants, boots, iconic hats or hoods.

    CRITICAL FINAL OUTPUT FORMAT:
    - Your output must be a single line of text, starting with your detailed description, followed by " • ", and then the entire fixed style guide.
    - Do not add any other text, explanations, or formatting.

    EXAMPLE OUTPUT (for the provided image):
    A central figure with dark hair, wearing a dark navy suit and a black and white patterned tie, speaks with a serious expression from behind a wooden podium that has a golden circular seal. To his right stands a man with short brown hair in a dark suit and gold tie, with a neutral expression, hands clasped. To the speaker's left is a bald man in a dark suit and red tie, looking forward sternly. Furthest to the right, a sheriff in a tan uniform and a dark cowboy hat stands with his arms crossed. The background is composed of large, simple royal blue and yellow flags. • Transform the subject into South Park cartoon style. • Character design: flat 2D cutout look, simple round head, large circular eyes with black pupils, tiny oval mouth. • Art style: construction-paper aesthetic, minimal shading, bold outlines, flat bright colors. • Body proportions: short, chubby body, stubby arms and legs, mitten-shaped hands. • Clothing: plain blocky outfits--sweaters, jackets, pants, boots, iconic hats or hoods.
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