"use client";

import { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
// @ts-ignore
import rehypeRaw from "rehype-raw";

interface DiffViewerProps {
  original: string;
  corrected: string;
  className?: string;
}

/**
 * Component that renders original text with highlighted differences
 */
export default function DiffViewer({ original, corrected, className = "" }: DiffViewerProps) {
  const highlightedContent = useMemo(() => {
    return createDiffView(original, corrected);
  }, [original, corrected]);

  return (
    <div className={`prose prose-invert prose-sm max-w-none ${className}`} style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          // Headings
          h1: ({ node, ...props }) => (
            <h1 className="text-3xl font-bold text-foreground mt-6 mb-4 font-sentient" {...props} />
          ),
          h2: ({ node, ...props }) => (
            <h2 className="text-2xl font-bold text-foreground mt-5 mb-3 font-sentient" {...props} />
          ),
          h3: ({ node, ...props }) => (
            <h3 className="text-xl font-bold text-primary mt-4 mb-2 font-mono uppercase" {...props} />
          ),
          h4: ({ node, ...props }) => (
            <h4 className="text-lg font-bold text-foreground mt-3 mb-2 font-mono" {...props} />
          ),
          h5: ({ node, ...props }) => (
            <h5 className="text-base font-bold text-foreground mt-2 mb-1 font-mono" {...props} />
          ),
          h6: ({ node, ...props }) => (
            <h6 className="text-sm font-bold text-muted-foreground mt-2 mb-1 font-mono" {...props} />
          ),
          // Paragraphs
          p: ({ node, ...props }) => (
            <p className="text-base text-foreground mb-3 leading-relaxed" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }} {...props} />
          ),
          // Lists
          ul: ({ node, ...props }) => (
            <ul className="list-disc list-inside mb-4 space-y-2 text-base text-foreground ml-4" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }} {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="list-decimal list-inside mb-4 space-y-2 text-base text-foreground ml-4" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }} {...props} />
          ),
          li: ({ node, ...props }) => (
            <li className="text-base text-foreground leading-relaxed" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }} {...props} />
          ),
          // Strong/Bold
          strong: ({ node, ...props }) => (
            <strong className="font-bold text-yellow-500" {...props} />
          ),
          // Emphasis/Italic
          em: ({ node, ...props }) => (
            <em className="italic text-foreground" {...props} />
          ),
          // Code
          code: ({ node, inline, ...props }: any) => {
            if (inline) {
              return (
                <code className="bg-black/50 text-yellow-500 px-1.5 py-0.5 rounded text-sm font-mono border border-input" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }} {...props} />
              );
            }
            return (
              <code className="block bg-black/50 text-foreground p-4 rounded-lg text-sm font-mono border border-input overflow-x-auto mb-4" style={{ wordBreak: 'break-word', overflowWrap: 'break-word', whiteSpace: 'pre-wrap' }} {...props} />
            );
          },
          pre: ({ node, ...props }) => (
            <pre className="bg-black/50 p-4 rounded-lg border border-input overflow-x-auto mb-4" style={{ wordBreak: 'break-word', overflowWrap: 'break-word', whiteSpace: 'pre-wrap' }} {...props} />
          ),
          // Blockquote
          blockquote: ({ node, ...props }) => (
            <blockquote className="border-l-4 border-yellow-500 pl-4 py-2 my-4 italic text-base text-muted-foreground" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }} {...props} />
          ),
          // Links
          a: ({ node, ...props }) => (
            <a className="text-base text-yellow-500 hover:text-yellow-400 underline" {...props} />
          ),
          // Horizontal Rule
          hr: ({ node, ...props }) => (
            <hr className="border-t border-input my-6" {...props} />
          ),
          // Tables
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto my-4">
              <table className="min-w-full border-collapse border border-input" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }} {...props} />
            </div>
          ),
          thead: ({ node, ...props }) => (
            <thead className="bg-black/50" {...props} />
          ),
          tbody: ({ node, ...props }) => (
            <tbody {...props} />
          ),
          tr: ({ node, ...props }) => (
            <tr className="border-b border-input" {...props} />
          ),
          th: ({ node, ...props }) => (
            <th className="border border-input px-4 py-2 text-left text-base font-bold text-foreground font-mono" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }} {...props} />
          ),
          td: ({ node, ...props }) => (
            <td className="border border-input px-4 py-2 text-base text-foreground" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }} {...props} />
          ),
        }}
      >
        {highlightedContent}
      </ReactMarkdown>
    </div>
  );
}

/**
 * Split text into sentences
 */
function splitIntoSentences(text: string): string[] {
  // Split by sentence endings, keeping the punctuation
  const parts = text.split(/([.!?]\s+)/);
  const sentences: string[] = [];
  for (let i = 0; i < parts.length; i += 2) {
    if (parts[i]) {
      sentences.push(parts[i] + (parts[i + 1] || ''));
    }
  }
  return sentences.filter(s => s.trim().length > 0);
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
 * Create diff view with highlighted changes
 */
function createDiffView(original: string, corrected: string): string {
  // Split into sentences for better readability
  const origSentences = splitIntoSentences(original);
  const corrSentences = splitIntoSentences(corrected);
  
  let html = '';
  let origIdx = 0;
  let corrIdx = 0;
  
  while (origIdx < origSentences.length || corrIdx < corrSentences.length) {
    if (origIdx >= origSentences.length) {
      // Only corrected sentences remain - don't show in original view
      break;
    }
    
    if (corrIdx >= corrSentences.length) {
      // Only original sentences remain - highlight as removed
      html += `<span class="diff-removed" style="background-color: rgba(239, 68, 68, 0.3); color: white; text-decoration: line-through; padding: 2px 4px; border-radius: 3px; word-break: break-word; overflow-wrap: break-word;">${escapeHtml(origSentences[origIdx])}</span>`;
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
      // Sentences differ - highlight the original with word-level diff
      html += highlightWordDifferences(origSent, corrSent);
      origIdx++;
      corrIdx++;
    }
  }
  
  return html;
}

/**
 * Highlight word differences within a sentence
 */
function highlightWordDifferences(original: string, corrected: string): string {
  const origWords = original.split(/(\s+)/);
  const corrWords = corrected.split(/(\s+)/);
  
  // Simple word matching
  const highlighted: string[] = [];
  const corrUsed = new Set<number>();
  
  for (let i = 0; i < origWords.length; i++) {
    const origWord = origWords[i].trim();
    if (!origWord) {
      highlighted.push(origWords[i]); // Preserve whitespace
      continue;
    }
    
    // Find matching word in corrected (case-insensitive)
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
      highlighted.push(`<mark class="diff-highlight" style="background-color: rgba(239, 68, 68, 0.4); color: white; padding: 2px 4px; border-radius: 3px; border: 1px solid rgba(239, 68, 68, 0.6); word-break: break-word; overflow-wrap: break-word;">${escapeHtml(origWords[i])}</mark>`);
    }
  }
  
  return highlighted.join('');
}

