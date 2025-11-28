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

// Function to search for multiple phrases in document paragraphs (from answer.ts)
function searchParagraphs(documentText: string, searchTerms: string | string[]): string[] {
  // Split document into paragraphs
  let paragraphs = documentText.split(/\n\n+/);
  
  // Further split by section headers if they're on the same "paragraph"
  const finalParagraphs: string[] = [];
  paragraphs.forEach(para => {
    const parts = para.split(/(?=\s*==\s*.+?\s*==)/);
    parts.forEach(part => {
      const trimmed = part.trim();
      if (trimmed.length > 0) {
        finalParagraphs.push(trimmed);
      }
    });
  });
  
  // Handle single search term or array of search terms
  const terms = Array.isArray(searchTerms) ? searchTerms : [searchTerms];
  
  // Convert all search terms to lowercase for case-insensitive search
  const termsLower = terms.map(t => t.toLowerCase());
  
  // Use a Set to track unique matching paragraphs (prevents duplicates)
  const matchingParagraphs = new Set<string>();
  
  // Check each paragraph against all search terms
  finalParagraphs.forEach(paragraph => {
    const paragraphLower = paragraph.toLowerCase();
    
    // If any search term is found in this paragraph, add it to results
    if (termsLower.some(term => paragraphLower.includes(term))) {
      matchingParagraphs.add(paragraph);
    }
  });
  
  // Convert Set back to Array
  return Array.from(matchingParagraphs);
}

// Function to replace words in paragraphs using GPT-5.1 (from answer.ts)
async function replaceWithGPT(paragraph: string, oldWord: string, newWord: string): Promise<string> {
  const prompt = `You are given a paragraph and need to replace the word/phrase "${oldWord}" with "${newWord}".

CRITICAL INSTRUCTIONS:
1. Replace ALL occurrences of "${oldWord}" with "${newWord}" in the paragraph
2. Maintain ALL other text EXACTLY as it appears - do not change, rephrase, or modify anything else
3. Keep the exact same formatting, line breaks, punctuation, and structure
4. Output ONLY the modified paragraph, nothing else (no explanations, no preamble)

Original paragraph:
${paragraph}`;

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-5.1",
        input: prompt,
        reasoning: {
          effort: "low"
        },
        text: {
          verbosity: "high"
        }
      })
    });

    const data: any = await response.json();
    
    if (!response.ok) {
      console.error('API Response Error:', JSON.stringify(data, null, 2));
      throw new Error(`API Error: ${data.error?.message || JSON.stringify(data)}`);
    }
    
    // Extract text from GPT-5.1 response structure
    let replacedText = '';
    
    if (data.output && Array.isArray(data.output)) {
      // Find the message output (type: "message")
      const messageOutput = data.output.find((item: any) => item.type === "message");
      if (messageOutput && messageOutput.content && Array.isArray(messageOutput.content)) {
        // Extract text from content array
        replacedText = messageOutput.content
          .filter((item: any) => item.type === "output_text")
          .map((item: any) => item.text)
          .join("\n");
      }
    }
    
    if (!replacedText) {
      console.error('Could not extract text from response.');
      return paragraph;
    }
    
    return replacedText.trim();
    
  } catch (error) {
    console.error(`Error calling GPT-5.1: ${(error as Error).message}`);
    return paragraph; // Return original paragraph if API fails
  }
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

    // Limit contradictions to 10
    const limitedContradictions = contradictions.slice(0, 10);
    console.log(`Processing ${limitedContradictions.length} contradictions (limited from ${contradictions.length})`);

    // Build replacements map (oldWord -> newWord)
    const replacements: Record<string, string> = {};
    const searchTerms: string[] = [];
    
    limitedContradictions.forEach((c: Contradiction) => {
      replacements[c.source_a_object] = c.source_b_object;
      searchTerms.push(c.source_a_object);
    });

    // Search for paragraphs containing the contradictions (same logic as answer.ts)
    const matchingParagraphs = searchParagraphs(grokipediaContent, searchTerms);
    
    console.log(`Found ${matchingParagraphs.length} paragraph(s) containing contradictions`);

    // Process replacements paragraph by paragraph (same logic as answer.ts)
    let correctedContent = grokipediaContent;
    
    if (matchingParagraphs.length > 0 && Object.keys(replacements).length > 0) {
      console.log('Replacing words using GPT-5.1...');
      console.log('Replacements:', replacements);
      
      // Process each matching paragraph
      for (let idx = 0; idx < matchingParagraphs.length; idx++) {
        const paragraph = matchingParagraphs[idx];
        let modifiedParagraph = paragraph;
        
        // Apply all replacements to this paragraph
        for (const [oldWord, newWord] of Object.entries(replacements)) {
          // Check if this paragraph contains the word to replace
          if (paragraph.toLowerCase().includes(oldWord.toLowerCase())) {
            console.log(`Replacing "${oldWord}" with "${newWord}" in paragraph ${idx + 1}...`);
            modifiedParagraph = await replaceWithGPT(modifiedParagraph, oldWord, newWord);
          }
        }
        
        // Replace the original paragraph with the modified one in the full content
        correctedContent = correctedContent.replace(paragraph, modifiedParagraph);
      }
    } else {
      console.log('No matching paragraphs found or no replacements to apply');
    }

    return NextResponse.json({
      success: true,
      originalContent: grokipediaContent,
      correctedContent,
      correctionsApplied: limitedContradictions.length,
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

