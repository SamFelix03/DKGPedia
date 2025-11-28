#!/usr/bin/env node

import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

// Types
interface ParsedEdit {
  oldText: string;
  newText: string;
}

interface GPT4oResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  error?: {
    message: string;
  };
}

interface GPT51Response {
  output?: Array<{
    type: string;
    content?: Array<{
      type: string;
      text: string;
    }>;
  }>;
  error?: {
    message: string;
  };
}

// Function to search for multiple phrases in document paragraphs
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

// Function to parse natural language edit using GPT-4o
async function parseNaturalLanguageEdit(suggestedEdit: string): Promise<ParsedEdit | null> {
  const systemPrompt = `You are a precise text extraction assistant. Your job is to analyze a user's natural language edit request and extract exactly two things:
1. The OLD text/phrase they want to change
2. The NEW text/phrase they want to replace it with

You MUST respond with ONLY a JSON object in this exact format:
{
  "old": "the text to be replaced",
  "new": "the replacement text"
}

CRITICAL: Do not wrap your response in markdown code blocks (no \`\`\`json). Do not include any explanations or additional text. Output ONLY the raw JSON object.`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: suggestedEdit
          }
        ],
        temperature: 0.3
      })
    });

    const data: GPT4oResponse = await response.json();
    
    if (!response.ok) {
      throw new Error(`GPT-4o Error: ${data.error?.message || JSON.stringify(data)}`);
    }
    
    let content = data.choices[0].message.content.trim();
    
    // Remove markdown code blocks if present
    content = content.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    
    // Parse the JSON response
    const parsed = JSON.parse(content);
    
    if (!parsed.old || !parsed.new) {
      throw new Error('Invalid response format from GPT-4o');
    }
    
    return { oldText: parsed.old, newText: parsed.new };
    
  } catch (error) {
    console.error(`Error parsing natural language edit: ${(error as Error).message}`);
    return null;
  }
}

// Function to replace words in paragraphs using GPT-5.1
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

    const data: GPT51Response = await response.json();
    
    if (!response.ok) {
      console.error('API Response Error:', JSON.stringify(data, null, 2));
      throw new Error(`API Error: ${data.error?.message || JSON.stringify(data)}`);
    }
    
    // Extract text from GPT-5.1 response structure
    let replacedText = '';
    
    if (data.output && Array.isArray(data.output)) {
      // Find the message output (type: "message")
      const messageOutput = data.output.find(item => item.type === "message");
      if (messageOutput && messageOutput.content && Array.isArray(messageOutput.content)) {
        // Extract text from content array
        replacedText = messageOutput.content
          .filter(item => item.type === "output_text")
          .map(item => item.text)
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

// CLI functionality
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  
  // Show usage if no arguments provided
  if (args.length < 2) {
    console.log('Usage:');
    console.log('  Search only:');
    console.log('    node search.js <file_path> <search_term1> [search_term2] ...');
    console.log('\n  Search and Replace:');
    console.log('    node search.js <file_path> --replace <old_word1:new_word1> [old_word2:new_word2] ...');
    console.log('\n  Natural Language Edit:');
    console.log('    node search.js <file_path> --suggested-edit "change anaplasmosis to blood disease"');
    console.log('\nExamples:');
    console.log('  node search.js document.txt "ungulates" "medieval"');
    console.log('  node search.js document.txt --replace "ungulates:animals" "medieval:ancient"');
    console.log('  node search.js document.txt --suggested-edit "replace agonistic interactions with social conflicts"');
    process.exit(1);
  }
  
  const filePath = args[0];
  const replacements: Record<string, string> = {};
  const searchTerms: string[] = [];
  let replaceMode = false;
  let suggestedEditMode = false;
  
  // Parse arguments
  let i = 1;
  while (i < args.length) {
    if (args[i] === '--replace') {
      replaceMode = true;
      i++;
      // Collect replacement pairs
      while (i < args.length && args[i].includes(':')) {
        const [oldWord, newWord] = args[i].split(':');
        replacements[oldWord.trim()] = newWord.trim();
        searchTerms.push(oldWord.trim()); // Automatically add old words as search terms
        i++;
      }
    } else if (args[i] === '--suggested-edit') {
      suggestedEditMode = true;
      i++;
      if (i < args.length) {
        const suggestedEdit = args[i];
        console.log(`\nParsing natural language edit: "${suggestedEdit}"`);
        console.log('Using GPT-4o to extract old and new text...\n');
        
        const parsed = await parseNaturalLanguageEdit(suggestedEdit);
        if (parsed) {
          replacements[parsed.oldText] = parsed.newText;
          searchTerms.push(parsed.oldText);
          console.log(`✓ Extracted: "${parsed.oldText}" → "${parsed.newText}"\n`);
        } else {
          console.error('Failed to parse natural language edit.');
          process.exit(1);
        }
        i++;
      }
    } else {
      searchTerms.push(args[i]);
      i++;
    }
  }
  
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    console.error(`Error: File "${filePath}" not found.`);
    process.exit(1);
  }
  
  // Check for API key if replace mode is enabled
  if ((replaceMode || suggestedEditMode) && !process.env.OPENAI_API_KEY) {
    console.error('Error: OPENAI_API_KEY environment variable not set.');
    console.error('Set it with: export OPENAI_API_KEY=your_api_key');
    process.exit(1);
  }
  
  // Read the file
  let documentText: string;
  try {
    documentText = fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.error(`Error reading file: ${(error as Error).message}`);
    process.exit(1);
  }
  
  // Search for terms
  const results = searchParagraphs(documentText, searchTerms);
  
  // Display results
  console.log(`Searching for: ${searchTerms.map(t => `"${t}"`).join(', ')}`);
  console.log(`Found ${results.length} unique paragraph(s)\n`);
  console.log('='.repeat(80));
  
  if (results.length === 0) {
    console.log('No matches found.');
    return;
  }
  
  // If replace mode or suggested edit mode, process replacements
  if ((replaceMode || suggestedEditMode) && Object.keys(replacements).length > 0) {
    console.log('\nReplacing words using GPT-5.1...');
    console.log('Replacements:', replacements);
    console.log('='.repeat(80));
    
    for (let idx = 0; idx < results.length; idx++) {
      const paragraph = results[idx];
      let modifiedParagraph = paragraph;
      
      console.log(`\n[Original Paragraph ${idx + 1}]`);
      console.log(paragraph);
      console.log('\n' + '-'.repeat(80));
      
      // Apply all replacements to this paragraph
      for (const [oldWord, newWord] of Object.entries(replacements)) {
        // Check if this paragraph contains the word to replace
        if (paragraph.toLowerCase().includes(oldWord.toLowerCase())) {
          console.log(`\nReplacing "${oldWord}" with "${newWord}"...`);
          modifiedParagraph = await replaceWithGPT(modifiedParagraph, oldWord, newWord);
        }
      }
      
      console.log(`\n[Modified Paragraph ${idx + 1}]`);
      console.log(modifiedParagraph);
      console.log('\n' + '='.repeat(80));
    }
  } else {
    // Just display search results
    results.forEach((paragraph, index) => {
      console.log(`\n[Paragraph ${index + 1}]`);
      console.log(paragraph);
      console.log('\n' + '-'.repeat(80));
    });
  }
}

// Run the CLI tool
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});