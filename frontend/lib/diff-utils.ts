/**
 * Utility functions for comparing and highlighting differences between texts
 */

interface DiffSegment {
  type: 'unchanged' | 'removed' | 'added';
  text: string;
}

/**
 * Simple word-level diff algorithm
 * Compares two texts and returns segments with their change types
 */
export function computeDiff(original: string, corrected: string): DiffSegment[] {
  const originalWords = original.split(/(\s+)/);
  const correctedWords = corrected.split(/(\s+)/);
  
  const segments: DiffSegment[] = [];
  let origIdx = 0;
  let corrIdx = 0;
  
  while (origIdx < originalWords.length || corrIdx < correctedWords.length) {
    if (origIdx >= originalWords.length) {
      // Only corrected text remains
      segments.push({
        type: 'added',
        text: correctedWords.slice(corrIdx).join('')
      });
      break;
    }
    
    if (corrIdx >= correctedWords.length) {
      // Only original text remains
      segments.push({
        type: 'removed',
        text: originalWords.slice(origIdx).join('')
      });
      break;
    }
    
    // Try to find matching words
    if (originalWords[origIdx] === correctedWords[corrIdx]) {
      // Words match, add as unchanged
      segments.push({
        type: 'unchanged',
        text: originalWords[origIdx]
      });
      origIdx++;
      corrIdx++;
    } else {
      // Words don't match, look ahead to find next match
      let matchFound = false;
      let lookAhead = 1;
      const maxLookAhead = Math.min(50, Math.max(originalWords.length - origIdx, correctedWords.length - corrIdx));
      
      // Try to find a match within reasonable distance
      while (lookAhead <= maxLookAhead && !matchFound) {
        // Check if we can find a match by skipping words in original
        if (origIdx + lookAhead < originalWords.length) {
          const nextMatch = correctedWords.slice(corrIdx).indexOf(originalWords[origIdx + lookAhead]);
          if (nextMatch !== -1 && nextMatch < 20) {
            // Found a match, mark skipped words as removed
            segments.push({
              type: 'removed',
              text: originalWords.slice(origIdx, origIdx + lookAhead).join('')
            });
            origIdx += lookAhead;
            matchFound = true;
            break;
          }
        }
        
        // Check if we can find a match by skipping words in corrected
        if (corrIdx + lookAhead < correctedWords.length) {
          const nextMatch = originalWords.slice(origIdx).indexOf(correctedWords[corrIdx + lookAhead]);
          if (nextMatch !== -1 && nextMatch < 20) {
            // Found a match, mark skipped words as added
            segments.push({
              type: 'added',
              text: correctedWords.slice(corrIdx, corrIdx + lookAhead).join('')
            });
            corrIdx += lookAhead;
            matchFound = true;
            break;
          }
        }
        
        lookAhead++;
      }
      
      if (!matchFound) {
        // No match found, mark both as different
        segments.push({
          type: 'removed',
          text: originalWords[origIdx]
        });
        segments.push({
          type: 'added',
          text: correctedWords[corrIdx]
        });
        origIdx++;
        corrIdx++;
      }
    }
  }
  
  return segments;
}

/**
 * Renders diff segments as HTML with highlighting
 * Highlights removed text (red) and added text (green) in the original view
 */
export function renderDiffHighlight(original: string, corrected: string): string {
  const segments = computeDiff(original, corrected);
  
  let html = '';
  for (const segment of segments) {
    if (segment.type === 'unchanged') {
      html += segment.text;
    } else if (segment.type === 'removed') {
      // Highlight removed text in red with strikethrough
      html += `<span class="diff-removed" style="background-color: rgba(239, 68, 68, 0.3); text-decoration: line-through; padding: 2px 4px; border-radius: 3px;">${escapeHtml(segment.text)}</span>`;
    } else if (segment.type === 'added') {
      // Don't show added text in original view, but we can show a marker
      // Actually, for the original view, we only want to highlight what was removed/changed
      // So we'll skip added segments in the original view
    }
  }
  
  return html;
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Alternative: Sentence-level diff for better readability
 * Compares sentences and highlights changed sentences
 */
export function computeSentenceDiff(original: string, corrected: string): Array<{
  original: string;
  corrected: string;
  changed: boolean;
}> {
  const originalSentences = original.split(/([.!?]\s+)/);
  const correctedSentences = corrected.split(/([.!?]\s+)/);
  
  const results: Array<{
    original: string;
    corrected: string;
    changed: boolean;
  }> = [];
  
  // Simple sentence matching
  let origIdx = 0;
  let corrIdx = 0;
  
  while (origIdx < originalSentences.length || corrIdx < correctedSentences.length) {
    const origSent = originalSentences[origIdx] || '';
    const corrSent = correctedSentences[corrIdx] || '';
    
    // Normalize for comparison (remove extra whitespace)
    const origNormalized = origSent.trim().toLowerCase();
    const corrNormalized = corrSent.trim().toLowerCase();
    
    if (origNormalized === corrNormalized && origNormalized.length > 0) {
      // Sentences match
      results.push({
        original: origSent,
        corrected: corrSent,
        changed: false
      });
      origIdx++;
      corrIdx++;
    } else {
      // Sentences don't match
      results.push({
        original: origSent || '',
        corrected: corrSent || '',
        changed: true
      });
      if (origIdx < originalSentences.length) origIdx++;
      if (corrIdx < correctedSentences.length) corrIdx++;
    }
  }
  
  return results;
}

/**
 * Render original text with highlighted changed sections
 * Uses word-level diff for precise highlighting
 */
export function highlightChangesInOriginal(original: string, corrected: string): string {
  // Use a more sophisticated approach: find changed words/phrases
  const originalWords = original.split(/\b/);
  const correctedWords = corrected.split(/\b/);
  
  // Create a map of corrected words to find replacements
  const replacementMap = new Map<string, string>();
  
  // Simple word-by-word comparison to find replacements
  let result = '';
  let origIdx = 0;
  let corrIdx = 0;
  
  while (origIdx < originalWords.length) {
    const origWord = originalWords[origIdx];
    
    // Try to find this word in corrected text
    const foundIdx = correctedWords.slice(corrIdx).findIndex(w => 
      w.toLowerCase() === origWord.toLowerCase() && w.trim().length > 0
    );
    
    if (foundIdx === -1 || foundIdx > 10) {
      // Word not found or too far ahead, mark as changed
      result += `<mark class="diff-highlight" style="background-color: rgba(239, 68, 68, 0.4); padding: 2px 4px; border-radius: 3px; transition: background-color 0.2s;">${escapeHtml(origWord)}</mark>`;
      origIdx++;
    } else {
      // Word found, check if surrounding context matches
      const contextMatch = checkContextMatch(
        originalWords.slice(Math.max(0, origIdx - 2), Math.min(originalWords.length, origIdx + 3)),
        correctedWords.slice(Math.max(0, corrIdx + foundIdx - 2), Math.min(correctedWords.length, corrIdx + foundIdx + 3))
      );
      
      if (contextMatch) {
        // Context matches, word is unchanged
        result += escapeHtml(origWord);
        corrIdx += foundIdx + 1;
      } else {
        // Context doesn't match, word might be changed
        result += `<mark class="diff-highlight" style="background-color: rgba(239, 68, 68, 0.4); padding: 2px 4px; border-radius: 3px;">${escapeHtml(origWord)}</mark>`;
      }
      origIdx++;
    }
  }
  
  return result;
}

/**
 * Check if context around a word matches
 */
function checkContextMatch(origContext: string[], corrContext: string[]): boolean {
  if (origContext.length === 0 || corrContext.length === 0) return false;
  
  const origStr = origContext.join('').toLowerCase().trim();
  const corrStr = corrContext.join('').toLowerCase().trim();
  
  // Check if at least 60% of the context matches
  const minLength = Math.min(origStr.length, corrStr.length);
  if (minLength === 0) return false;
  
  let matches = 0;
  for (let i = 0; i < minLength; i++) {
    if (origStr[i] === corrStr[i]) matches++;
  }
  
  return matches / minLength > 0.6;
}

/**
 * Better approach: Use a library-like diff algorithm
 * Finds the longest common subsequence and highlights differences
 */
export function createDiffView(original: string, corrected: string): string {
  // Split into sentences for better readability
  const origSentences = splitIntoSentences(original);
  const corrSentences = splitIntoSentences(corrected);
  
  let html = '';
  let origIdx = 0;
  let corrIdx = 0;
  
  while (origIdx < origSentences.length || corrIdx < corrSentences.length) {
    if (origIdx >= origSentences.length) {
      // Only corrected sentences remain
      break;
    }
    
    if (corrIdx >= corrSentences.length) {
      // Only original sentences remain - highlight as removed
      html += `<span class="diff-removed" style="background-color: rgba(239, 68, 68, 0.3); text-decoration: line-through; padding: 2px 4px; border-radius: 3px;">${escapeHtml(origSentences[origIdx])}</span>`;
      origIdx++;
      continue;
    }
    
    const origSent = origSentences[origIdx].trim();
    const corrSent = corrSentences[corrIdx].trim();
    
    // Normalize for comparison
    const origNormalized = origSent.toLowerCase().replace(/\s+/g, ' ');
    const corrNormalized = corrSent.toLowerCase().replace(/\s+/g, ' ');
    
    if (origNormalized === corrNormalized) {
      // Sentences match
      html += escapeHtml(origSent);
      origIdx++;
      corrIdx++;
    } else {
      // Sentences differ - highlight the original
      // Use word-level diff within the sentence
      html += highlightWordDifferences(origSent, corrSent);
      origIdx++;
      corrIdx++;
    }
  }
  
  return html;
}

/**
 * Split text into sentences
 */
function splitIntoSentences(text: string): string[] {
  // Split by sentence endings, keeping the punctuation
  return text.split(/([.!?]\s+)/).filter(s => s.trim().length > 0);
}

/**
 * Highlight word differences within a sentence
 */
function highlightWordDifferences(original: string, corrected: string): string {
  const origWords = original.split(/(\s+)/);
  const corrWords = corrected.split(/(\s+)/);
  
  // Simple word matching
  const highlighted: string[] = [];
  let corrUsed = new Set<number>();
  
  for (let i = 0; i < origWords.length; i++) {
    const origWord = origWords[i].trim();
    if (!origWord) {
      highlighted.push(origWords[i]); // Preserve whitespace
      continue;
    }
    
    // Find matching word in corrected
    let found = false;
    for (let j = 0; j < corrWords.length; j++) {
      if (corrUsed.has(j)) continue;
      
      const corrWord = corrWords[j].trim();
      if (origWord.toLowerCase() === corrWord.toLowerCase()) {
        highlighted.push(origWords[i]);
        corrUsed.add(j);
        found = true;
        break;
      }
    }
    
    if (!found) {
      // Word not found in corrected, highlight it
      highlighted.push(`<mark class="diff-highlight" style="background-color: rgba(239, 68, 68, 0.4); padding: 2px 4px; border-radius: 3px;">${escapeHtml(origWords[i])}</mark>`);
    }
  }
  
  return highlighted.join('');
}

