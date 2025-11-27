"""
Editorial Judging System using GPT-5.1
Compares Grokipedia and Wikipedia content to identify bias, framing differences, and provide editorial suggestions
"""

import os
import json
import sys
from pathlib import Path
from typing import Dict, Optional
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Check if OpenAI API key is available
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise ValueError("OPENAI_API_KEY not found in .env file or environment variables")

try:
    from openai import OpenAI
    client = OpenAI(api_key=OPENAI_API_KEY)
    print(f"[OK] OpenAI API key loaded (length: {len(OPENAI_API_KEY)} characters)")
except ImportError:
    raise ImportError("OpenAI package not installed. Install with: pip install openai")
except Exception as e:
    raise ValueError(f"Error initializing OpenAI client: {e}")


class EditorialJudge:
    """Editorial judging system using GPT-5.1"""
    
    def __init__(self):
        self.client = client
        self.model = "gpt-5.1"
    
    def _read_file(self, filepath: str) -> str:
        """Read content from a file"""
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            return content
        except FileNotFoundError:
            print(f"[ERROR] File not found: {filepath}")
            return ""
        except Exception as e:
            print(f"[ERROR] Error reading file {filepath}: {e}")
            return ""
    
    def _read_grokipedia(self, filepath: str = "dual_scraper_output/grokipedia.txt") -> str:
        """Read Grokipedia content"""
        content = self._read_file(filepath)
        if not content:
            return ""
        
        # Extract the main content if there's metadata
        import re
        match = re.search(r'📄 Full Content:\s*(.+)', content, re.DOTALL)
        if match:
            return match.group(1).strip()
        
        match = re.search(r'📄 ARTICLE CONTENT:\s*(.+)', content, re.DOTALL)
        if match:
            return match.group(1).strip()
        
        return content
    
    def _read_wikipedia(self, filepath: str = "dual_scraper_output/wikipedia.txt") -> str:
        """Read Wikipedia content"""
        content = self._read_file(filepath)
        if not content:
            return ""
        
        # Extract the main content if there's metadata
        import re
        match = re.search(r'📄 Full Content:\s*(.+)', content, re.DOTALL)
        if match:
            return match.group(1).strip()
        
        match = re.search(r'📄 ARTICLE CONTENT:\s*(.+)', content, re.DOTALL)
        if match:
            return match.group(1).strip()
        
        return content
    
    def generate_comparison_report(self, grokipedia_content: str, wikipedia_content: str) -> Dict:
        """Generate detailed comparison report using GPT-5.1"""
        print("\n" + "=" * 80)
        print("Generating Editorial Comparison Report with GPT-5.1")
        print("=" * 80)
        print()
        
        # Construct the comprehensive prompt
        prompt = f"""You are an expert editorial judge and fact-checker. Your task is to perform a comprehensive comparison between two versions of the same article: one from Grokipedia (an AI-generated encyclopedia) and one from Wikipedia (the reference standard).

## GROKIPEDIA CONTENT:
{grokipedia_content[:50000]}  # Limit to avoid token limits

## WIKIPEDIA CONTENT:
{wikipedia_content[:50000]}  # Limit to avoid token limits

## YOUR TASK:

Please provide a detailed editorial comparison report with the following sections:

### 1. EXECUTIVE SUMMARY
- Overall assessment of content quality and accuracy
- Key differences in coverage and depth
- Overall tone and neutrality comparison

### 2. FACTUAL ACCURACY ANALYSIS
- Factual claims that differ between the two versions
- Any factual errors or inaccuracies in Grokipedia
- Missing critical facts in Grokipedia compared to Wikipedia
- Additional facts in Grokipedia not present in Wikipedia (verify if these are accurate)

### 3. BIAS AND FRAMING ANALYSIS
This is CRITICAL - identify subtle bias or framing differences that humans might miss:
- **Word choice bias**: Compare loaded language, hedging words, and tone
- **Source selection bias**: Analyze which sources are cited/omitted in each version
- **Representation bias**: Count mentions of different perspectives, viewpoints, or stakeholders
- **Emphasis bias**: Compare section lengths, what gets emphasized vs. de-emphasized
- **Political/ideological leaning**: Identify any subtle political or ideological framing
- **Temporal framing**: How events are presented chronologically or causally
- **Attribution bias**: How credit, blame, or responsibility is attributed

### 4. STRUCTURAL AND ORGANIZATIONAL DIFFERENCES
- Section organization and hierarchy
- Information architecture differences
- Missing or extra sections
- Flow and readability comparison

### 5. EDITORIAL SUGGESTIONS FOR GROKIPEDIA
Provide specific, actionable "editor's suggestions" for improving Grokipedia:
- **Content additions**: What important information should be added?
- **Content corrections**: What factual errors need to be fixed?
- **Bias corrections**: How to make the framing more neutral and balanced?
- **Source improvements**: What citations or references should be added?
- **Structural improvements**: How to better organize the content?
- **Tone adjustments**: How to improve neutrality and objectivity?
- **Clarity improvements**: How to make the content clearer and more accessible?

### 6. DETAILED EXAMPLES
Provide 5-10 specific examples of:
- Subtle bias or framing differences (with quotes from both versions)
- Factual discrepancies
- Missing critical information
- Editorial improvements needed

### 7. OVERALL RECOMMENDATIONS
- Priority fixes (high/medium/low)
- Estimated impact of suggested changes
- Risk assessment for current Grokipedia version

Please be thorough, specific, and provide actionable feedback. Focus on subtle differences that might not be immediately obvious to human readers."""

        print("[INFO] Sending request to GPT-5.1...")
        print(f"[INFO] Model: {self.model}")
        print(f"[INFO] Reasoning effort: low")
        print(f"[INFO] Verbosity: medium")
        print()
        
        try:
            # Try Responses API first (for GPT-5.1)
            if hasattr(self.client, 'responses'):
                print("[INFO] Using Responses API...")
                response = self.client.responses.create(
                    model=self.model,
                    input=prompt,
                    reasoning={
                        "effort": "low"  # User requested "low" effort
                    },
                    text={
                        "verbosity": "medium"  # User requested "medium" verbosity
                    }
                )
                
                # Extract the output text
                if hasattr(response, 'output_text'):
                    output_text = response.output_text
                elif hasattr(response, 'output'):
                    output_text = response.output
                elif hasattr(response, 'text'):
                    output_text = response.text
                else:
                    output_text = str(response)
            
            else:
                # Fallback to Chat Completions API if Responses API not available
                print("[WARNING] Responses API not available, using Chat Completions API...")
                print("[NOTE] GPT-5.1 works best with Responses API. Consider updating OpenAI SDK.")
                
                response = self.client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {
                            "role": "system",
                            "content": "You are an expert editorial judge and fact-checker. Provide detailed, thorough analysis with specific examples and actionable recommendations."
                        },
                        {
                            "role": "user",
                            "content": prompt
                        }
                    ],
                    temperature=0.7,
                    max_tokens=8000
                )
                
                output_text = response.choices[0].message.content
            
            print("[OK] Comparison report generated successfully!")
            print(f"[INFO] Response length: {len(output_text)} characters")
            print()
            
            return {
                "status": "success",
                "report": output_text,
                "model": self.model,
                "reasoning_effort": "low",
                "verbosity": "medium"
            }
            
        except AttributeError as e:
            # If responses API doesn't exist, try direct HTTP request
            print("[INFO] Responses API attribute not found, trying direct HTTP request...")
            try:
                import requests
                headers = {
                    "Authorization": f"Bearer {OPENAI_API_KEY}",
                    "Content-Type": "application/json"
                }
                data = {
                    "model": self.model,
                    "input": prompt,
                    "reasoning": {
                        "effort": "low"
                    },
                    "text": {
                        "verbosity": "medium"
                    }
                }
                response = requests.post(
                    "https://api.openai.com/v1/responses",
                    headers=headers,
                    json=data,
                    timeout=300
                )
                response.raise_for_status()
                result = response.json()
                output_text = result.get("output_text", result.get("output", str(result)))
                
                print("[OK] Comparison report generated successfully!")
                print(f"[INFO] Response length: {len(output_text)} characters")
                print()
                
                return {
                    "status": "success",
                    "report": output_text,
                    "model": self.model,
                    "reasoning_effort": "low",
                    "verbosity": "medium"
                }
            except Exception as http_error:
                print(f"[ERROR] HTTP request also failed: {http_error}")
                raise http_error
        
        except Exception as e:
            print(f"[ERROR] Failed to generate comparison report: {e}")
            print(f"[INFO] Error type: {type(e).__name__}")
            import traceback
            traceback.print_exc()
            return {
                "status": "error",
                "error": str(e),
                "error_type": type(e).__name__,
                "model": self.model
            }
    
    def analyze_articles(self, grokipedia_file: str = "dual_scraper_output/grokipedia.txt",
                        wikipedia_file: str = "dual_scraper_output/wikipedia.txt") -> Dict:
        """Main analysis function"""
        print("=" * 80)
        print("Editorial Judging System - GPT-5.1")
        print("=" * 80)
        print()
        
        # Read both articles
        print("Step 1/3: Reading articles...")
        print(f"  Reading Grokipedia: {grokipedia_file}")
        grokipedia_content = self._read_grokipedia(grokipedia_file)
        print(f"  [OK] Grokipedia content loaded ({len(grokipedia_content)} characters)")
        
        print(f"  Reading Wikipedia: {wikipedia_file}")
        wikipedia_content = self._read_wikipedia(wikipedia_file)
        print(f"  [OK] Wikipedia content loaded ({len(wikipedia_content)} characters)")
        print()
        
        if not grokipedia_content:
            return {
                "status": "error",
                "error": "Could not read Grokipedia content"
            }
        
        if not wikipedia_content:
            return {
                "status": "error",
                "error": "Could not read Wikipedia content"
            }
        
        # Generate comparison report
        print("Step 2/3: Generating comparison report with GPT-5.1...")
        result = self.generate_comparison_report(grokipedia_content, wikipedia_content)
        print()
        
        # Save results
        print("Step 3/3: Saving results...")
        self._save_results(result)
        print()
        
        return result
    
    def _save_results(self, result: Dict):
        """Save results to file"""
        # Save full report to text file
        output_file = "editorial_judgment_report.txt"
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write("=" * 80 + "\n")
            f.write("EDITORIAL JUDGMENT REPORT - GPT-5.1\n")
            f.write("=" * 80 + "\n\n")
            
            if result.get("status") == "success":
                f.write(f"Model: {result.get('model', 'N/A')}\n")
                f.write(f"Reasoning Effort: {result.get('reasoning_effort', 'N/A')}\n")
                f.write(f"Verbosity: {result.get('verbosity', 'N/A')}\n")
                f.write("\n" + "=" * 80 + "\n\n")
                f.write(result.get("report", ""))
            else:
                f.write(f"ERROR: {result.get('error', 'Unknown error')}\n")
        
        print(f"[SAVED] Full report saved to: {output_file}")
        
        # Save metadata to JSON
        json_file = "editorial_judgment_results.json"
        with open(json_file, 'w', encoding='utf-8') as f:
            json.dump(result, f, indent=2, ensure_ascii=False)
        
        print(f"[SAVED] Metadata saved to: {json_file}")


def main():
    """Main execution function"""
    import sys
    from io import StringIO
    
    class TeeOutput:
        """Class to capture stdout and write to both console and file"""
        def __init__(self, file_path: str):
            self.file = open(file_path, 'w', encoding='utf-8')
            self.stdout = sys.stdout
            
        def write(self, text: str):
            self.stdout.write(text)
            self.file.write(text)
            self.file.flush()
            
        def flush(self):
            self.stdout.flush()
            self.file.flush()
            
        def close(self):
            self.file.close()
    
    # Set up output capture
    output_file = "editorial_judgment_output.txt"
    tee = TeeOutput(output_file)
    original_stdout = sys.stdout
    sys.stdout = tee
    
    try:
        # Print API key status
        print("\n" + "=" * 80)
        print("API KEY STATUS CHECK")
        print("=" * 80)
        if OPENAI_API_KEY:
            print(f"[OK] OpenAI API key is loaded")
            print(f"  Key length: {len(OPENAI_API_KEY)} characters")
            print(f"  First 10 chars: {OPENAI_API_KEY[:10]}...")
            print(f"  Using model: gpt-5.1 (Responses API)")
            print(f"  Reasoning effort: low")
            print(f"  Verbosity: medium")
        else:
            print("[WARNING] OpenAI API key NOT loaded")
            print("  Make sure OPENAI_API_KEY is set in .env file")
        print("=" * 80 + "\n")
        
        # Initialize judge
        judge = EditorialJudge()
        
        # Run analysis
        results = judge.analyze_articles()
        
        # Print summary
        print("\n" + "=" * 80)
        print("ANALYSIS COMPLETE")
        print("=" * 80)
        
        if results.get("status") == "success":
            print("\n[SUCCESS] Editorial comparison report generated!")
            print(f"  Model used: {results.get('model', 'N/A')}")
            print(f"  Report length: {len(results.get('report', ''))} characters")
            print("\n  Output files:")
            print("    - editorial_judgment_report.txt (full report)")
            print("    - editorial_judgment_results.json (metadata)")
            print("    - editorial_judgment_output.txt (all output)")
        else:
            print(f"\n[ERROR] Analysis failed: {results.get('error', 'Unknown error')}")
        
        print("\n" + "=" * 80)
        
    finally:
        sys.stdout = original_stdout
        tee.close()
        print(f"[SAVED] All output saved to {output_file}")


if __name__ == "__main__":
    main()

