"""
Fact-Checking & Hallucination Detection System
Uses OpenAI web search to verify contradictions and calculate hallucination metrics
"""

import re
import json
import sys
from pathlib import Path
from typing import List, Dict, Optional
from collections import defaultdict
import time

# Import from triple.py
try:
    from triple import TripleExtractor
except ImportError:
    try:
        from .triple import TripleExtractor
    except ImportError:
        import sys
        from pathlib import Path
        sys.path.insert(0, str(Path(__file__).parent))
        from triple import TripleExtractor

# Try to import optional dependencies
try:
    import spacy
    SPACY_AVAILABLE = True
except ImportError:
    SPACY_AVAILABLE = False
    print("⚠️ spaCy not available. Some features will be limited.")

# Load environment variables from .env file at module level
import os
try:
    from dotenv import load_dotenv
    env_path = Path(__file__).parent / ".env"
    if env_path.exists():
        load_dotenv(env_path)
        print(f"✓ Loaded .env file from {env_path}")
    else:
        load_dotenv()
        print("✓ Attempted to load .env file (using default location)")
except ImportError:
    print("⚠️ python-dotenv not installed. Using environment variables only.")
except Exception as e:
    print(f"⚠️ Error loading .env file: {e}")

# Check if OpenAI API key is available
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
OPENAI_AVAILABLE = False
OPENAI_CLIENT = None
if OPENAI_API_KEY:
    try:
        from openai import OpenAI
        OPENAI_CLIENT = OpenAI(api_key=OPENAI_API_KEY)
        OPENAI_AVAILABLE = True
        print(f"✓ OpenAI API key loaded (length: {len(OPENAI_API_KEY)} characters)")
    except ImportError:
        print("⚠️ OpenAI package not installed. Install with: pip install openai")
    except Exception as e:
        print(f"⚠️ Error initializing OpenAI client: {e}")
else:
    print("⚠️ OpenAI API key not found. Set OPENAI_API_KEY in .env file or environment variables.")


class FactChecker:
    """Fact-checking and hallucination detection system using OpenAI web search"""
    
    def __init__(self):
        # Initialize triple extractor for sentence processing
        self.triple_extractor = TripleExtractor()
        
        # OpenAI client (if available)
        self.openai_client = OPENAI_CLIENT if OPENAI_AVAILABLE else None
    
    def _read_file(self, filepath: str) -> str:
        """Read and extract content from file"""
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Extract the full content section
        match = re.search(r'📄 Full Content:\s*(.+)', content, re.DOTALL)
        if match:
            return match.group(1).strip()
        
        # Try alternative pattern
        match = re.search(r'📄 ARTICLE CONTENT:\s*(.+)', content, re.DOTALL)
        if match:
            return match.group(1).strip()
        
        return content
    
    def _has_citation(self, text: str) -> bool:
        """Check if text contains citation markers"""
        citation_patterns = [
            r'\[\d+\]',                    # [1], [2], etc.
            r'\[\d+,\s*\d+\]',            # [1, 2]
            r'\[\d+-\d+\]',                # [1-5]
            r'\(\d{4}\)',                  # (2024)
            r'\(\d{4}[a-z]\)',            # (2024a)
            r'et al\.',                    # et al.
            r'\[citation needed\]',        # [citation needed]
            r'\[who\]',                    # [who]
            r'\[when\]',                   # [when]
            r'\[where\]',                  # [where]
            r'\[clarification needed\]',   # [clarification needed]
            r'ref\.', r'reference', r'cf\.', r'see also', # common reference phrases
            r'according to', r'as stated in', r'research shows' # phrases indicating external info
        ]
        return any(re.search(pattern, text, re.IGNORECASE) for pattern in citation_patterns)
    
    def _count_citations(self, text: str) -> int:
        """Count number of citations in text"""
        citation_matches = re.findall(r'\[(\d+)\]', text)
        return len(set(citation_matches))  # Unique citation numbers
    
    def _extract_dates(self, text: str) -> List[Dict]:
        """Extract dates from text"""
        dates = []
        year_patterns = [
            r'\b(1[0-9]{3}|20[0-9]{2})\b',  # Years 1000-2099
            r'\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b',
            r'\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b',  # MM/DD/YYYY or DD/MM/YYYY
        ]
        
        for pattern in year_patterns:
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                dates.append({
                    "text": match.group(),
                    "position": match.start(),
                    "type": "year" if len(match.group()) == 4 else "date"
                })
        
        return dates
    
    def _extract_numbers(self, text: str) -> List[Dict]:
        """Extract numerical values from text"""
        numbers = []
        number_patterns = [
            r'\b\d+\.?\d*\s*(million|billion|thousand|trillion)\b',  # Large numbers
            r'\b\d+\.?\d*%',  # Percentages
            r'\b\d+\.?\d*\s*(kg|g|mg|µg|km|m|cm|mm|years?|months?|days?|hours?)\b',  # Measurements
            r'\b\d+\.?\d*\b',  # General numbers
        ]
        
        for pattern in number_patterns:
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                numbers.append({
                    "text": match.group(),
                    "position": match.start(),
                    "type": "measurement" if any(unit in match.group().lower() for unit in ['kg', 'g', 'km', 'm', '%']) else "number"
                })
        
        return numbers
    
    def _parse_contradictions_from_results(self, results_file: str = "kg_analysis_results.txt") -> List[Dict]:
        """Parse contradictions from kg_analysis_results.txt"""
        contradictions = []
        
        try:
            with open(results_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Find the "All Contradictions:" section
            contradictions_section = re.search(r'All Contradictions:(.*?)(?=\n\n|\n===|\Z)', content, re.DOTALL)
            
            if not contradictions_section:
                print(f"   ⚠️ Could not find contradictions section in {results_file}")
                return contradictions
            
            # Parse each contradiction
            lines = contradictions_section.group(1).strip().split('\n')
            i = 0
            while i < len(lines):
                line = lines[i].strip()
                
                # Look for numbered contradictions (e.g., "1. Cattle be:")
                match = re.match(r'(\d+)\.\s*(.+?)\s*:', line)
                if match:
                    contradiction_num = int(match.group(1))
                    subject_predicate = match.group(2).strip()
                    
                    # Get Grokipedia object
                    grok_object = None
                    wiki_object = None
                    
                    if i + 1 < len(lines) and 'Grokipedia:' in lines[i + 1]:
                        grok_object = lines[i + 1].split('Grokipedia:')[1].strip()
                    if i + 2 < len(lines) and 'Wikipedia:' in lines[i + 2]:
                        wiki_object = lines[i + 2].split('Wikipedia:')[1].strip()
                    
                    if grok_object and wiki_object:
                        contradictions.append({
                            "number": contradiction_num,
                            "subject_predicate": subject_predicate,
                            "grok_object": grok_object,
                            "wiki_object": wiki_object
                        })
                    
                    i += 3  # Skip the contradiction lines
                else:
                    i += 1
            
            print(f"   ✓ Parsed {len(contradictions)} contradictions from {results_file}")
            
        except FileNotFoundError:
            print(f"   ⚠️ Results file {results_file} not found. Run triple.py first!")
        except Exception as e:
            print(f"   ⚠️ Error parsing contradictions: {e}")
        
        return contradictions
    
    def _find_sentences_for_contradiction(self, contradiction: Dict, grok_content: str, wiki_content: str, verbose: bool = False) -> Dict:
        """Find the actual sentences containing the contradiction"""
        subject_predicate = contradiction["subject_predicate"]
        grok_object = contradiction["grok_object"]
        wiki_object = contradiction["wiki_object"]
        
        # Search for sentences containing the subject/predicate and object
        grok_sentence = None
        wiki_sentence = None
        
        subject_pred_lower = subject_predicate.lower()
        grok_obj_lower = grok_object.lower()
        wiki_obj_lower = wiki_object.lower()
        
        # Search in content (split by sentences)
        try:
            nlp = self.triple_extractor.nlp
            grok_doc = nlp(grok_content[:500000])  # Limit size
            wiki_doc = nlp(wiki_content[:500000])
            
            # Search in Grokipedia
            for sent in grok_doc.sents:
                sent_text = sent.text.lower()
                if (subject_pred_lower in sent_text or any(word in sent_text for word in subject_pred_lower.split() if len(word) > 3)) and \
                   (grok_obj_lower in sent_text or any(word in sent_text for word in grok_obj_lower.split() if len(word) > 3)):
                    grok_sentence = sent.text
                    break
            
            # Search in Wikipedia
            for sent in wiki_doc.sents:
                sent_text = sent.text.lower()
                if (subject_pred_lower in sent_text or any(word in sent_text for word in subject_pred_lower.split() if len(word) > 3)) and \
                   (wiki_obj_lower in sent_text or any(word in sent_text for word in wiki_obj_lower.split() if len(word) > 3)):
                    wiki_sentence = sent.text
                    break
            
        except Exception as e:
            if verbose:
                print(f"      ⚠️ Error finding sentences with spaCy: {e}")
        
        # Fallback: simple text search if spaCy fails
        if not grok_sentence:
            sentences = re.split(r'[.!?]\s+', grok_content)
            for sent in sentences:
                sent_lower = sent.lower()
                if (subject_pred_lower in sent_lower or any(w in sent_lower for w in subject_pred_lower.split() if len(w) > 3)) and \
                   (grok_obj_lower in sent_lower or any(w in sent_lower for w in grok_obj_lower.split() if len(w) > 3)):
                    grok_sentence = sent.strip()
                    break
        
        if not wiki_sentence:
            sentences = re.split(r'[.!?]\s+', wiki_content)
            for sent in sentences:
                sent_lower = sent.lower()
                if (subject_pred_lower in sent_lower or any(w in sent_lower for w in subject_pred_lower.split() if len(w) > 3)) and \
                   (wiki_obj_lower in sent_lower or any(w in sent_lower for w in wiki_obj_lower.split() if len(w) > 3)):
                    wiki_sentence = sent.strip()
                    break
        
        return {
            "grok_sentence": grok_sentence,
            "wiki_sentence": wiki_sentence,
            "grok_claim": f"{subject_predicate} {grok_object}" if grok_sentence else None,
            "wiki_claim": f"{subject_predicate} {wiki_object}" if wiki_sentence else None
        }
    
    def _search_web_for_excerpt(self, excerpt: str, verbose: bool = False) -> str:
        """Search the web for an excerpt using OpenAI web search model"""
        if not OPENAI_AVAILABLE or not self.openai_client:
            if verbose:
                print(f"      [Web Search] ⚠️ OpenAI not available")
            return ""
        
        try:
            if verbose:
                print(f"      [Web Search] Searching web for excerpt...")
                print(f"      [Web Search] Excerpt: {excerpt[:100]}...")
            
            completion = self.openai_client.chat.completions.create(
                model="gpt-4o-search-preview",
                web_search_options={},
                messages=[
                    {
                        "role": "user",
                        "content": f"Please search the web and provide comprehensive information about the following claim:\n\n{excerpt}\n\nProvide detailed information from authoritative sources with citations."
                    }
                ],
                max_tokens=2000
            )
            
            response_content = completion.choices[0].message.content
            
            if verbose:
                print(f"      [Web Search] ✓ Received response ({len(response_content)} characters)")
            
            return response_content
        
        except Exception as e:
            if verbose:
                print(f"      [Web Search] ✗ Exception: {e}")
            return ""
    
    def _get_structured_verification(self, raw_web_response: str, excerpt: str, claim_text: str, verbose: bool = False) -> Dict:
        """Send raw web search response to gpt-4o to get structured JSON verification"""
        if not OPENAI_AVAILABLE or not self.openai_client:
            if verbose:
                print(f"      [Structured Analysis] ⚠️ OpenAI not available")
            return {}
        
        system_prompt = """You are a fact-checking expert. Analyze the web search results and provide a structured JSON response with the following fields:

{
  "verification_status": "verified" | "partially_verified" | "unverified" | "contradicted",
  "confidence_score": 0.0-1.0 (float),
  "verification_score": 0-100 (integer, percentage of how well the claim is verified),
  "external_verification_score": 0-100 (integer, percentage based on number of external sources that support the claim),
  "sources_count": integer (number of authoritative sources found),
  "sources": ["url1", "url2", ...] (list of source URLs),
  "key_facts": ["fact1", "fact2", ...] (list of key facts that support or contradict the claim),
  "analysis": "detailed explanation of why the claim is verified/unverified",
  "temporal_consistency": true/false (whether dates/numbers are consistent),
  "fabrication_risk_score": 0-100 (integer, higher = more likely to be hallucination),
  "citation_present": true/false (whether the original excerpt had citations),
  "hallucination_indicators": ["indicator1", "indicator2", ...] (list of reasons why this might be a hallucination)
}

Scoring Guidelines:
- verification_score: 0-100 based on how well external sources support the claim
- external_verification_score: Based on number of authoritative sources (0 sources = 0, 1-2 sources = 30, 3-5 sources = 60, 6+ sources = 90)
- fabrication_risk_score: Higher if claim lacks citations, has no external verification, contains vague language, or contradicts authoritative sources
- confidence_score: Overall confidence in the verification (0.0-1.0)

Return ONLY valid JSON, no additional text."""
        
        user_prompt = f"""Original Claim: {claim_text}

Original Excerpt: {excerpt}

Web Search Results:
{raw_web_response}

Analyze the web search results and provide a structured JSON response evaluating the claim."""
        
        try:
            if verbose:
                print(f"      [Structured Analysis] Sending to gpt-4o for structured analysis...")
            
            completion = self.openai_client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                response_format={"type": "json_object"},
                max_tokens=1500
            )
            
            response_content = completion.choices[0].message.content
            
            if verbose:
                print(f"      [Structured Analysis] ✓ Received structured response")
            
            # Parse JSON response
            try:
                structured_data = json.loads(response_content)
                return structured_data
            except json.JSONDecodeError as e:
                if verbose:
                    print(f"      [Structured Analysis] ⚠️ Failed to parse JSON: {e}")
                    print(f"      [Structured Analysis] Raw response: {response_content[:200]}...")
                # Try to extract JSON from response
                json_match = re.search(r'\{.*\}', response_content, re.DOTALL)
                if json_match:
                    try:
                        return json.loads(json_match.group())
                    except:
                        pass
                return {}
        
        except Exception as e:
            if verbose:
                print(f"      [Structured Analysis] ✗ Exception: {e}")
            return {}
    
    def verify_contradiction_excerpt(self, excerpt: str, claim_text: str, verbose: bool = False) -> Dict:
        """Verify a contradiction excerpt using web search + structured analysis"""
        if verbose:
            print(f"   🔍 Verifying excerpt: '{excerpt[:80]}...'")
            print(f"   ──────────────────────────────────────────────────────────────")
        
        # Step 1: Search web for excerpt
        raw_web_response = self._search_web_for_excerpt(excerpt, verbose=verbose)
        
        if not raw_web_response:
            if verbose:
                print(f"   ⚠️ No web search response received")
            return {
                "verification_status": "unverified",
                "confidence_score": 0.0,
                "verification_score": 0,
                "external_verification_score": 0,
                "sources_count": 0,
                "sources": [],
                "fabrication_risk_score": 100,
                "error": "No web search response"
            }
        
        # Step 2: Get structured verification from gpt-4o
        structured_verification = self._get_structured_verification(raw_web_response, excerpt, claim_text, verbose=verbose)
        
        if not structured_verification:
            if verbose:
                print(f"   ⚠️ No structured verification received")
            return {
                "verification_status": "unverified",
                "confidence_score": 0.0,
                "verification_score": 0,
                "external_verification_score": 0,
                "sources_count": 0,
                "sources": [],
                "fabrication_risk_score": 100,
                "error": "No structured verification response"
            }
        
        if verbose:
            print(f"   ──────────────────────────────────────────────────────────────")
            print(f"   ✓ Verification complete:")
            print(f"     Status: {structured_verification.get('verification_status', 'unknown')}")
            print(f"     Confidence: {structured_verification.get('confidence_score', 0.0):.2f}")
            print(f"     Verification Score: {structured_verification.get('verification_score', 0)}%")
            print(f"     Sources: {structured_verification.get('sources_count', 0)}")
            print()
        
        return structured_verification
    
    def calculate_unsourced_claim_ratio(self, claims: List[Dict]) -> Dict:
        """Calculate percentage of claims without citations"""
        total_claims = len(claims)
        if total_claims == 0:
            return {"unsourced_ratio": 0.0, "unsourced_count": 0, "sourced_count": 0, "total_count": 0}
        
        unsourced = sum(1 for claim in claims if not claim.get("has_citation", False))
        ratio = (unsourced / total_claims) * 100
        
        return {
            "unsourced_ratio": ratio,
            "unsourced_count": unsourced,
            "sourced_count": total_claims - unsourced,
            "total_count": total_claims
        }
    
    def calculate_external_verification_score(self, verifications: List[Dict]) -> Dict:
        """Calculate percentage of claims verified by 3rd party sources"""
        total_claims = len(verifications)
        if total_claims == 0:
            return {
                "verification_score": 0.0,
                "external_verification_score": 0.0,
                "verified_count": 0,
                "partially_verified_count": 0,
                "unverified_count": 0,
                "total_count": 0
            }
        
        verified = sum(1 for v in verifications if v.get("verification_status") == "verified")
        partially_verified = sum(1 for v in verifications if v.get("verification_status") == "partially_verified")
        
        # Get average external verification scores
        external_scores = [v.get("external_verification_score", 0) for v in verifications if isinstance(v.get("external_verification_score"), (int, float))]
        avg_external_score = sum(external_scores) / len(external_scores) if external_scores else 0.0
        
        # Score: fully verified = 1.0, partially = 0.5, unverified = 0.0
        verification_score = ((verified * 1.0 + partially_verified * 0.5) / total_claims) * 100
        
        return {
            "verification_score": verification_score,
            "external_verification_score": avg_external_score,
            "verified_count": verified,
            "partially_verified_count": partially_verified,
            "unverified_count": total_claims - verified - partially_verified,
            "total_count": total_claims
        }
    
    def check_temporal_consistency(self, claims: List[Dict], verifications: List[Dict]) -> Dict:
        """Check for date/number mismatches across claims"""
        inconsistencies = []
        
        # Group claims by entity
        entity_dates = defaultdict(list)
        entity_numbers = defaultdict(list)
        
        for i, claim in enumerate(claims):
            dates = claim.get("extracted_dates", [])
            numbers = claim.get("extracted_numbers", [])
            verification = verifications[i] if i < len(verifications) else {}
            
            # Check temporal consistency from verification
            if not verification.get("temporal_consistency", True):
                inconsistencies.append({
                    "type": "temporal",
                    "claim_id": claim.get("claim_id"),
                    "claim_text": claim.get("claim_text"),
                    "issue": "Temporal inconsistency detected in verification",
                    "verification_status": verification.get("verification_status")
                })
            
            # Extract entities from claim
            entities = claim.get("entities", [])
            if not entities:
                # Try to extract from subject/object
                subject = claim.get("subject", "")
                obj = claim.get("object", "")
                entities = [e for e in [subject, obj] if e and len(e) > 2]
            
            for entity in entities:
                if dates:
                    entity_dates[entity].extend(dates)
                if numbers:
                    entity_numbers[entity].extend(numbers)
        
        # Check for date inconsistencies
        for entity, dates in entity_dates.items():
            if len(dates) > 1:
                years = [int(d["text"]) for d in dates if d["type"] == "year" and d["text"].isdigit()]
                if years:
                    year_range = max(years) - min(years)
                    if year_range > 100:  # Large gap might indicate inconsistency
                        inconsistencies.append({
                            "type": "temporal",
                            "entity": entity,
                            "issue": f"Large date range: {min(years)}-{max(years)}",
                            "dates": [d["text"] for d in dates]
                        })
        
        # Check for number inconsistencies
        for entity, numbers in entity_numbers.items():
            if len(numbers) > 1:
                numeric_values = []
                for num in numbers:
                    try:
                        num_text = re.sub(r'[^\d.]', '', num["text"].split()[0])
                        if num_text:
                            numeric_values.append(float(num_text))
                    except:
                        pass
                
                if len(numeric_values) > 1:
                    max_val = max(numeric_values)
                    min_val = min(numeric_values)
                    if max_val > 0 and (max_val - min_val) / max_val > 0.5:
                        inconsistencies.append({
                            "type": "numeric",
                            "entity": entity,
                            "issue": f"Large numeric discrepancy: {min_val} vs {max_val}",
                            "values": [num["text"] for num in numbers]
                        })
        
        return {
            "inconsistencies": inconsistencies,
            "inconsistency_count": len(inconsistencies),
            "total_entities_checked": len(set(list(entity_dates.keys()) + list(entity_numbers.keys())))
        }
    
    def calculate_fabrication_risk_score(self, claims: List[Dict], verifications: List[Dict]) -> Dict:
        """Calculate fabrication risk score to detect LLM hallucinations"""
        risk_factors = []
        total_risk = 0.0
        
        for i, claim in enumerate(claims):
            verification = verifications[i] if i < len(verifications) else {}
            
            # Use fabrication_risk_score from verification if available
            fabrication_score = verification.get("fabrication_risk_score", 0)
            
            # If not available, calculate from other factors
            if fabrication_score == 0:
                claim_risk = 0.0
                factors = []
                
                # Factor 1: No citations
                if not claim.get("has_citation", False):
                    claim_risk += 0.3
                    factors.append("no_citation")
                
                # Factor 2: Not verified by external sources
                if verification.get("verification_status") == "unverified":
                    claim_risk += 0.4
                    factors.append("unverified")
                elif verification.get("verification_status") == "partially_verified":
                    claim_risk += 0.2
                    factors.append("partially_verified")
                
                # Factor 3: Low confidence score
                confidence = verification.get("confidence_score", 0.0)
                if confidence < 0.3:
                    claim_risk += 0.2
                    factors.append("low_confidence")
                
                # Factor 4: No source count
                if verification.get("sources_count", 0) == 0:
                    claim_risk += 0.1
                    factors.append("no_sources")
                
                # Factor 5: Contains vague language
                vague_patterns = [
                    r'\b(some|many|several|various|numerous|certain)\b',
                    r'\b(approximately|about|around|roughly|nearly)\b',
                    r'\b(possibly|probably|likely|might|may)\b'
                ]
                sentence = claim.get("sentence", "").lower()
                vague_count = sum(1 for pattern in vague_patterns if re.search(pattern, sentence))
                if vague_count >= 2:
                    claim_risk += 0.1
                    factors.append("vague_language")
                
                fabrication_score = claim_risk * 100
            else:
                factors = verification.get("hallucination_indicators", [])
            
            total_risk += fabrication_score
            
            if fabrication_score > 50:  # High risk threshold
                risk_factors.append({
                    "claim_id": claim.get("claim_id"),
                    "claim_text": claim.get("claim_text"),
                    "risk_score": fabrication_score,
                    "factors": factors
                })
        
        # Average risk score
        avg_risk = (total_risk / len(claims)) if claims else 0.0
        
        # Risk interpretation
        if avg_risk >= 70:
            risk_level = "Very High - Likely hallucinations"
        elif avg_risk >= 50:
            risk_level = "High - Potential hallucinations"
        elif avg_risk >= 30:
            risk_level = "Moderate - Some unverified claims"
        elif avg_risk >= 15:
            risk_level = "Low - Mostly verified"
        else:
            risk_level = "Very Low - Well-sourced"
        
        return {
            "fabrication_risk_score": avg_risk,
            "risk_level": risk_level,
            "high_risk_claims": risk_factors,
            "high_risk_count": len(risk_factors),
            "total_claims": len(claims)
        }
    
    def fact_check_article(self, grokipedia_file: str, wikipedia_file: str, 
                          results_file: str = "kg_analysis_results.txt") -> Dict:
        """Perform comprehensive fact-checking using contradictions from triple.py results"""
        
        print("=" * 80)
        print("🔍 Fact-Checking & Hallucination Detection System")
        print("=" * 80)
        print()
        print("📋 PURPOSE: Fact-check contradictions using OpenAI web search")
        print("   • Read contradictions from kg_analysis_results.txt")
        print("   • Find the actual sentences in source files")
        print("   • Search web for each excerpt using gpt-4o-search-preview")
        print("   • Get structured verification from gpt-4o")
        print("   • Calculate hallucination metrics")
        print()
        
        # Read files
        print("📚 Step 1/4: Reading files...")
        print(f"   Reading {grokipedia_file}...")
        grok_content = self._read_file(grokipedia_file)
        print(f"   ✓ Grokipedia content loaded ({len(grok_content)} characters)")
        print(f"   Reading {wikipedia_file}...")
        wiki_content = self._read_file(wikipedia_file)
        print(f"   ✓ Wikipedia content loaded ({len(wiki_content)} characters)")
        print()
        
        # Parse contradictions from results file
        print("🔍 Step 2/4: Parsing contradictions from triple.py results...")
        all_contradictions = self._parse_contradictions_from_results(results_file)
        
        if not all_contradictions:
            print("   ⚠️ No contradictions found. Make sure to run triple.py first!")
            return {
                "summary": {
                    "total_contradictions": 0,
                    "contradictions_checked": 0,
                    "grok_claims_verified": 0,
                    "wiki_claims_verified": 0
                },
                "contradictory_claims": {"total_pairs": 0, "pairs": []},
                "metrics": {}
            }
        
        # Limit to first 5 contradictions for fact-checking
        MAX_CONTRADICTIONS_TO_CHECK = 5
        total_contradictions = len(all_contradictions)
        contradictions = all_contradictions[:MAX_CONTRADICTIONS_TO_CHECK]
        
        if total_contradictions > MAX_CONTRADICTIONS_TO_CHECK:
            print(f"   ✓ Found {total_contradictions} total contradictions")
            print(f"   ⚠️ Limiting fact-checking to first {MAX_CONTRADICTIONS_TO_CHECK} contradictions")
            print(f"   → Will fact-check {len(contradictions)} contradictions")
        else:
            print(f"   ✓ Found {len(contradictions)} contradictions to fact-check")
        print()
        
        # Find sentences and verify contradictions
        print("🔎 Step 3/4: Finding sentences and verifying contradictions...")
        print("   (Showing detailed logs for each contradiction)")
        
        contradictory_verifications = []
        all_claims = []
        all_verifications = []
        
        for i, contradiction in enumerate(contradictions):
            print(f"\n   🔄 Contradiction {i + 1}/{len(contradictions)}:")
            print(f"      Subject-Predicate: {contradiction['subject_predicate']}")
            print(f"      Grokipedia says: {contradiction['grok_object']}")
            print(f"      Wikipedia says: {contradiction['wiki_object']}")
            
            # Find the actual sentences
            print(f"      → Finding sentences in source files...")
            sentences = self._find_sentences_for_contradiction(contradiction, grok_content, wiki_content, verbose=True)
            
            if sentences["grok_sentence"]:
                print(f"      ✓ Found Grokipedia sentence: {sentences['grok_sentence'][:100]}...")
            else:
                print(f"      ⚠️ Could not find Grokipedia sentence")
            
            if sentences["wiki_sentence"]:
                print(f"      ✓ Found Wikipedia sentence: {sentences['wiki_sentence'][:100]}...")
            else:
                print(f"      ⚠️ Could not find Wikipedia sentence")
            
            # Create claim objects and verify
            grok_claim = None
            wiki_claim = None
            grok_verif = None
            wiki_verif = None
            
            if sentences["grok_sentence"]:
                grok_claim = {
                    "claim_id": f"grok_contradiction_{i+1}",
                    "source": "grokipedia",
                    "subject": contradiction["subject_predicate"].split()[0] if contradiction["subject_predicate"] else "",
                    "predicate": " ".join(contradiction["subject_predicate"].split()[1:]) if len(contradiction["subject_predicate"].split()) > 1 else contradiction["subject_predicate"],
                    "object": contradiction["grok_object"],
                    "sentence": sentences["grok_sentence"],
                    "claim_text": sentences["grok_claim"] or f"{contradiction['subject_predicate']} {contradiction['grok_object']}",
                    "has_citation": self._has_citation(sentences["grok_sentence"]),
                    "citation_count": self._count_citations(sentences["grok_sentence"]),
                    "extracted_dates": self._extract_dates(sentences["grok_sentence"]),
                    "extracted_numbers": self._extract_numbers(sentences["grok_sentence"]),
                    "entities": [contradiction["subject_predicate"].split()[0]] if contradiction["subject_predicate"] else []
                }
                print(f"      → Verifying Grokipedia claim...")
                grok_verif = self.verify_contradiction_excerpt(sentences["grok_sentence"], grok_claim["claim_text"], verbose=True)
                all_claims.append(grok_claim)
                all_verifications.append(grok_verif)
                time.sleep(1)  # Rate limiting
            
            if sentences["wiki_sentence"]:
                wiki_claim = {
                    "claim_id": f"wiki_contradiction_{i+1}",
                    "source": "wikipedia",
                    "subject": contradiction["subject_predicate"].split()[0] if contradiction["subject_predicate"] else "",
                    "predicate": " ".join(contradiction["subject_predicate"].split()[1:]) if len(contradiction["subject_predicate"].split()) > 1 else contradiction["subject_predicate"],
                    "object": contradiction["wiki_object"],
                    "sentence": sentences["wiki_sentence"],
                    "claim_text": sentences["wiki_claim"] or f"{contradiction['subject_predicate']} {contradiction['wiki_object']}",
                    "has_citation": self._has_citation(sentences["wiki_sentence"]),
                    "citation_count": self._count_citations(sentences["wiki_sentence"]),
                    "extracted_dates": self._extract_dates(sentences["wiki_sentence"]),
                    "extracted_numbers": self._extract_numbers(sentences["wiki_sentence"]),
                    "entities": [contradiction["subject_predicate"].split()[0]] if contradiction["subject_predicate"] else []
                }
                print(f"      → Verifying Wikipedia claim...")
                wiki_verif = self.verify_contradiction_excerpt(sentences["wiki_sentence"], wiki_claim["claim_text"], verbose=True)
                all_claims.append(wiki_claim)
                all_verifications.append(wiki_verif)
                time.sleep(1)  # Rate limiting
            
            contradictory_verifications.append({
                "contradiction_number": contradiction["number"],
                "subject_predicate": contradiction["subject_predicate"],
                "grok_object": contradiction["grok_object"],
                "wiki_object": contradiction["wiki_object"],
                "grok_sentence": sentences["grok_sentence"],
                "wiki_sentence": sentences["wiki_sentence"],
                "grok_claim": grok_claim,
                "wiki_claim": wiki_claim,
                "grok_verification": grok_verif,
                "wiki_verification": wiki_verif
            })
        
        print(f"\n   ✓ Verified {len(contradictory_verifications)} contradictions")
        print()
        
        # Calculate metrics
        print("📊 Step 4/4: Calculating metrics...")
        
        # Separate Grokipedia and Wikipedia claims/verifications
        grok_claims = [c for c in all_claims if c and c.get("source") == "grokipedia"]
        wiki_claims = [c for c in all_claims if c and c.get("source") == "wikipedia"]
        grok_verifications = [v for i, v in enumerate(all_verifications) if i < len(all_claims) and all_claims[i] and all_claims[i].get("source") == "grokipedia"]
        wiki_verifications = [v for i, v in enumerate(all_verifications) if i < len(all_claims) and all_claims[i] and all_claims[i].get("source") == "wikipedia"]
        
        # Calculate all metrics
        unsourced_grok = self.calculate_unsourced_claim_ratio(grok_claims)
        unsourced_wiki = self.calculate_unsourced_claim_ratio(wiki_claims)
        
        external_verif_grok = self.calculate_external_verification_score(grok_verifications)
        external_verif_wiki = self.calculate_external_verification_score(wiki_verifications)
        
        temporal_grok = self.check_temporal_consistency(grok_claims, grok_verifications)
        temporal_wiki = self.check_temporal_consistency(wiki_claims, wiki_verifications)
        
        fabrication_grok = self.calculate_fabrication_risk_score(grok_claims, grok_verifications)
        fabrication_wiki = self.calculate_fabrication_risk_score(wiki_claims, wiki_verifications)
        
        # Build results
        results = {
            "summary": {
                "total_contradictions": total_contradictions,
                "contradictions_checked": len(contradictions),
                "grok_claims_verified": len(grok_verifications),
                "wiki_claims_verified": len(wiki_verifications)
            },
            "contradictory_claims": {
                "total_pairs": len(contradictory_verifications),
                "pairs": contradictory_verifications
            },
            "metrics": {
                "grokipedia": {
                    "unsourced_claim_ratio": unsourced_grok,
                    "external_verification_score": external_verif_grok,
                    "temporal_consistency": temporal_grok,
                    "fabrication_risk_score": fabrication_grok
                },
                "wikipedia": {
                    "unsourced_claim_ratio": unsourced_wiki,
                    "external_verification_score": external_verif_wiki,
                    "temporal_consistency": temporal_wiki,
                    "fabrication_risk_score": fabrication_wiki
                }
            }
        }
        
        print("\n✅ Fact-checking analysis complete!")
        
        return results


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
    output_file = "factcheck_results.txt"
    tee = TeeOutput(output_file)
    original_stdout = sys.stdout
    sys.stdout = tee
    
    try:
        # Print API key status at startup
        print("\n" + "=" * 80)
        print("🔑 API KEY STATUS CHECK")
        print("=" * 80)
        if OPENAI_AVAILABLE:
            print(f"✓ OpenAI API key is loaded and client initialized")
            print(f"  Key length: {len(OPENAI_API_KEY)} characters")
            print(f"  First 10 chars: {OPENAI_API_KEY[:10]}...")
            print(f"  Using models: gpt-4o-search-preview (web search) + gpt-4o (structured analysis)")
        else:
            print("⚠️ OpenAI API key NOT loaded or client not initialized")
            print("  Make sure OPENAI_API_KEY is set in .env file and openai package is installed")
        print("=" * 80 + "\n")
        
        checker = FactChecker()
        
        results = checker.fact_check_article(
            "dual_scraper_output/grokipedia.txt",
            "dual_scraper_output/wikipedia.txt",
            "kg_analysis_results.txt"
        )
        
        # Print summary
        print("\n" + "=" * 80)
        print("📊 FACT-CHECKING & HALLUCINATION DETECTION SUMMARY")
        print("=" * 80)
        
        if "contradictions_found" in results.get("summary", {}) and results["summary"].get("contradictions_found") == 0:
            print("\n⚠️ No contradictions found. Make sure to run triple.py first!")
        else:
            print("\n📊 SUMMARY:")
            print(f"   Total Contradictions Found: {results['summary']['total_contradictions']}")
            print(f"   Grokipedia Claims Verified: {results['summary']['grok_claims_verified']}")
            print(f"   Wikipedia Claims Verified: {results['summary']['wiki_claims_verified']}")
            
            print("\n📊 GROKIPEDIA METRICS:")
            grok_metrics = results['metrics']['grokipedia']
            print(f"   Unsourced Claim Ratio: {grok_metrics['unsourced_claim_ratio']['unsourced_ratio']:.2f}%")
            print(f"   External Verification Score: {grok_metrics['external_verification_score']['external_verification_score']:.2f}%")
            print(f"   Temporal Inconsistencies: {grok_metrics['temporal_consistency']['inconsistency_count']}")
            print(f"   Fabrication Risk Score: {grok_metrics['fabrication_risk_score']['fabrication_risk_score']:.2f}% ({grok_metrics['fabrication_risk_score']['risk_level']})")
            
            print("\n📊 WIKIPEDIA METRICS:")
            wiki_metrics = results['metrics']['wikipedia']
            print(f"   Unsourced Claim Ratio: {wiki_metrics['unsourced_claim_ratio']['unsourced_ratio']:.2f}%")
            print(f"   External Verification Score: {wiki_metrics['external_verification_score']['external_verification_score']:.2f}%")
            print(f"   Temporal Inconsistencies: {wiki_metrics['temporal_consistency']['inconsistency_count']}")
            print(f"   Fabrication Risk Score: {wiki_metrics['fabrication_risk_score']['fabrication_risk_score']:.2f}% ({wiki_metrics['fabrication_risk_score']['risk_level']})")
            
            print("\n🔍 CONTRADICTORY CLAIMS DETAILS:")
            for i, pair in enumerate(results['contradictory_claims']['pairs'], 1):
                print(f"\n   Contradiction {i}:")
                print(f"      Subject-Predicate: {pair['subject_predicate']}")
                print(f"      Grokipedia: {pair['grok_object']}")
                if pair.get('grok_verification'):
                    status = pair['grok_verification'].get('verification_status', 'unknown')
                    confidence = pair['grok_verification'].get('confidence_score', 0.0)
                    verif_score = pair['grok_verification'].get('verification_score', 0)
                    print(f"         Verification: {status} (confidence: {confidence:.2f}, score: {verif_score}%)")
                print(f"      Wikipedia: {pair['wiki_object']}")
                if pair.get('wiki_verification'):
                    status = pair['wiki_verification'].get('verification_status', 'unknown')
                    confidence = pair['wiki_verification'].get('confidence_score', 0.0)
                    verif_score = pair['wiki_verification'].get('verification_score', 0)
                    print(f"         Verification: {status} (confidence: {confidence:.2f}, score: {verif_score}%)")
        
        # Save JSON results
        with open("factcheck_results.json", 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=2, ensure_ascii=False)
        print(f"\n💾 Results saved to factcheck_results.json")
        
        print("\n" + "=" * 80)
        print("✨ Analysis complete!")
        print("=" * 80)
        
    finally:
        sys.stdout = original_stdout
        tee.close()
        print(f"💾 All output saved to {output_file}")


if __name__ == "__main__":
    main()
