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

    // --- V4 PROMPT TEMPLATE ---
    // Change: Removed the abstract "Vibe" and "Tone" sections from the static style guide
    // to focus purely on concrete visual instructions.
    const structuredPrompt = `You are an AI prompt generation assistant. Your task is to combine a detailed description of a user's image with a fixed, specific style guide.

    INSTRUCTIONS:
    1.  First, silently analyze the user-provided image and write a descriptive but concise summary. Capture the key subjects, their appearance (like specific clothing, colors, or notable features), their main action, and the immediate environment. Aim for a detailed sentence or 2-3 key phrases.
    2.  Next, append the following detailed style guide, exactly as written, after your description. The separator between your description and the guide must be " • ".
    
    THE FIXED STYLE GUIDE (Append this part verbatim):
    Transform the subject into South Park cartoon style. • Character design: flat 2D cutout look, simple round head, large circular eyes with black pupils, tiny oval mouth. • Art style: construction-paper aesthetic, minimal shading, bold outlines, flat bright colors. • Body proportions: short, chubby body, stubby arms and legs, mitten-shaped hands. • Clothing: plain blocky outfits--sweaters, jackets, pants, boots, iconic hats or hoods.

    CRITICAL FINAL OUTPUT FORMAT:
    - Your output must be a single line of text.
    - It must start with your generated description, followed by " • ", followed by the entire fixed style guide.
    - Do not add any other text, explanations, or formatting.

    EXAMPLE OUTPUT (for the provided image):
    Four men at a press conference: a politician in a dark suit and patterned tie speaks at a wooden podium, flanked by two men in dark suits and a sheriff in a tan uniform with a cowboy hat. The background shows simple blue and yellow flags. • Transform the subject into South Park cartoon style. • Character design: flat 2D cutout look, simple round head, large circular eyes with black pupils, tiny oval mouth. • Art style: construction-paper aesthetic, minimal shading, bold outlines, flat bright colors. • Body proportions: short, chubby body, stubby arms and legs, mitten-shaped hands. • Clothing: plain blocky outfits--sweaters, jackets, pants, boots, iconic hats or hoods.
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