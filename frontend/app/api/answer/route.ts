import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface Contradiction {
  subject: string;
  predicate: string;
  source_a_object: string;
  source_b_object: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { grokipediaContent, contradictions } = body;

    if (!grokipediaContent || typeof grokipediaContent !== "string") {
      return NextResponse.json(
        { error: "Grokipedia content is required and must be a string" },
        { status: 400 }
      );
    }

    if (!contradictions || !Array.isArray(contradictions)) {
      return NextResponse.json(
        { error: "Contradictions array is required" },
        { status: 400 }
      );
    }

    console.log(`Processing ${contradictions.length} contradictions`);

    // Build the correction prompt
    const contradictionsList = contradictions
      .map((c: Contradiction, i: number) => 
        `${i + 1}. Replace "${c.source_a_object}" with "${c.source_b_object}" in the context of "${c.subject} ${c.predicate}"`
      )
      .join("\n");

    const systemPrompt = `You are a precise text correction assistant. You will be given a Grokipedia article and a list of contradictions that need to be corrected based on Wikipedia data.

Your task:
1. Apply ALL the corrections listed below to the article
2. Maintain ALL other text EXACTLY as it appears - do not change, rephrase, or modify anything else
3. Keep the exact same formatting, structure, and style
4. Output ONLY the corrected article text, nothing else (no explanations, no preamble)

Corrections to apply:
${contradictionsList}

Apply these corrections throughout the entire article wherever these terms appear in the relevant context.`;

    const userPrompt = `Original Grokipedia article:

${grokipediaContent}`;

    // Call GPT-4o for correction
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
      temperature: 0.3,
    });

    const correctedContent = completion.choices[0].message.content?.trim() || grokipediaContent;

    return NextResponse.json({
      success: true,
      originalContent: grokipediaContent,
      correctedContent,
      correctionsApplied: contradictions.length,
    });
  } catch (error) {
    console.error("Answer generation error:", error);
    return NextResponse.json(
      { 
        error: "Failed to generate corrected content",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

