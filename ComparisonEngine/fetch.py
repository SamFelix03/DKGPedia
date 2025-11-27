from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from datetime import datetime
import time
import os
import requests


class WikipediaAPIScraper:
    """Scraper for Wikipedia using the MediaWiki API"""
    
    def __init__(self):
        """Initialize the Wikipedia API scraper"""
        self.base_url = "https://en.wikipedia.org/w/api.php"
    
    def search_and_scrape(self, query):
        """
        Search for a query on Wikipedia and get the content
        
        Args:
            query: Search term
        
        Returns:
            Dictionary containing scraped data
        """
        try:
            print(f"🔍 Searching Wikipedia for: {query}")
            
            # Step 1: Search for the page
            search_params = {
                "action": "query",
                "list": "search",
                "srsearch": query,
                "format": "json",
                "srlimit": 1
            }
            
            headers = {
                'User-Agent': 'DualScraper/1.0 (Educational Project)'
            }
            
            search_response = requests.get(self.base_url, params=search_params, headers=headers, timeout=10)
            search_response.raise_for_status()
            search_data = search_response.json()
            
            if not search_data.get("query", {}).get("search"):
                return {"error": "No Wikipedia results found"}
            
            # Get the title of the first result
            page_title = search_data["query"]["search"][0]["title"]
            print(f"✓ Found page: {page_title}")
            
            # Step 2: Get the full page content
            content_params = {
                "action": "query",
                "titles": page_title,
                "prop": "extracts|info|extlinks",
                "explaintext": True,
                "inprop": "url",
                "ellimit": "max",
                "format": "json"
            }
            
            content_response = requests.get(self.base_url, params=content_params, headers=headers, timeout=10)
            content_response.raise_for_status()
            content_data = content_response.json()
            
            # Extract page data
            pages = content_data.get("query", {}).get("pages", {})
            page_id = list(pages.keys())[0]
            page_data = pages[page_id]
            
            title = page_data.get("title", "Title not found")
            url = page_data.get("fullurl", "URL not found")
            content_text = page_data.get("extract", "")
            
            # Get external links (references)
            references = []
            extlinks = page_data.get("extlinks", [])
            for i, link in enumerate(extlinks[:100], 1):  # Limit to 100
                references.append({
                    'number': i,
                    'url': link.get("*", "")
                })
            
            word_count = len(content_text.split())
            char_count = len(content_text)
            
            print(f"📊 Scraped {word_count:,} words, {char_count:,} characters")
            print(f"📚 Found {len(references)} external references")
            
            return {
                'title': title,
                'url': url,
                'content_text': content_text,
                'word_count': word_count,
                'char_count': char_count,
                'references_count': len(references),
                'references': references,
                'structured_content': None
            }
            
        except Exception as e:
            print(f"❌ Error during Wikipedia scraping: {str(e)}")
            return {"error": str(e)}


class GrokipediaSeleniumScraper:
    """Scraper for Grokipedia using Selenium WebDriver"""
    
    def __init__(self, headless=False):
        """
        Initialize the scraper with Chrome WebDriver
        
        Args:
            headless: Run browser in headless mode (no GUI)
        """
        options = webdriver.ChromeOptions()
        
        if headless:
            options.add_argument('--headless')
        
        options.add_argument('--no-sandbox')
        options.add_argument('--disable-dev-shm-usage')
        options.add_argument('--disable-blink-features=AutomationControlled')
        options.add_experimental_option("excludeSwitches", ["enable-automation"])
        options.add_experimental_option('useAutomationExtension', False)
        
        self.driver = webdriver.Chrome(options=options)
        self.driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
        self.wait = WebDriverWait(self.driver, 10)
    
    def search_and_scrape(self, query):
        """
        Search for a query on Grokipedia and scrape the first result
        
        Args:
            query: Search term
        
        Returns:
            Dictionary containing scraped data
        """
        try:
            print(f"🌐 Opening Grokipedia...")
            self.driver.get("https://grokipedia.com/")
            
            # Wait for page to load
            time.sleep(2)
            
            # Find the search input box
            print(f"🔍 Searching for: {query}")
            search_input = self.wait.until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='text'], input.w-full"))
            )
            
            # Clear any existing text and type the query
            search_input.clear()
            search_input.send_keys(query)
            time.sleep(1)
            
            # Press Enter to search
            search_input.send_keys(Keys.RETURN)
            print("⏳ Waiting for search results...")
            time.sleep(4)
            
            # Try to find and click the correct search result
            try:
                print("🔍 Looking for search results...")
                
                # Strategy 1: Find result that EXACTLY matches the query
                try:
                    # Look for elements with the exact query text
                    results = self.driver.find_elements(By.XPATH, 
                        f"//div[contains(@class, 'cursor-pointer')]//span[normalize-space(text())='{query.title()}']")
                    
                    if results:
                        result = results[0]
                        result_parent = result.find_element(By.XPATH, "./ancestor::div[contains(@class, 'cursor-pointer')]")
                        print(f"✓ Found exact match: '{result.text}'")
                        
                        self.driver.execute_script("arguments[0].scrollIntoView(true);", result_parent)
                        time.sleep(0.5)
                        self.driver.execute_script("arguments[0].click();", result_parent)
                        print("✓ Clicked exact match!")
                        time.sleep(3)
                    else:
                        raise Exception("No exact match found")
                        
                except Exception as e:
                    print(f"⚠️ Exact match strategy failed: {str(e)}")
                    
                    # Strategy 2: Try case-insensitive match
                    print("Trying case-insensitive match...")
                    try:
                        results = self.driver.find_elements(By.XPATH, 
                            f"//div[contains(@class, 'cursor-pointer')]//span[contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '{query.lower()}')]")
                        
                        if results:
                            # Find the shortest matching text (most likely to be the main article)
                            best_result = min(results, key=lambda r: len(r.text))
                            result_parent = best_result.find_element(By.XPATH, "./ancestor::div[contains(@class, 'cursor-pointer')]")
                            print(f"✓ Found match: '{best_result.text}'")
                            
                            self.driver.execute_script("arguments[0].scrollIntoView(true);", result_parent)
                            time.sleep(0.5)
                            self.driver.execute_script("arguments[0].click();", result_parent)
                            print("✓ Clicked!")
                            time.sleep(3)
                        else:
                            raise Exception("No match found")
                            
                    except Exception as e2:
                        print(f"⚠️ Case-insensitive strategy failed: {str(e2)}")
                        
                        # Strategy 3: Direct navigation
                        print("Trying direct navigation...")
                        page_url = f"https://grokipedia.com/page/{query.replace(' ', '_').title()}"
                        print(f"📍 Navigating to: {page_url}")
                        self.driver.get(page_url)
                        time.sleep(3)
                        
            except Exception as e:
                print(f"⚠️ Error in result selection: {str(e)}")
                print("Attempting direct navigation as fallback...")
                page_url = f"https://grokipedia.com/page/{query.replace(' ', '_').title()}"
                self.driver.get(page_url)
                time.sleep(3)
            
            # Verify we're on the correct page
            current_url = self.driver.current_url
            if "search?q=" in current_url:
                print("⚠️ Still on search results page. Attempting direct navigation...")
                page_url = f"https://grokipedia.com/page/{query.replace(' ', '_').title()}"
                self.driver.get(page_url)
                time.sleep(3)
            
            # Now scrape the article content
            print("📖 Scraping article content...")
            data = self._scrape_article_page()
            
            return data
            
        except Exception as e:
            print(f"❌ Error during scraping: {str(e)}")
            return {"error": str(e)}
    
    def _scrape_article_page(self):
        """Scrape content from the article page with proper structure"""
        try:
            time.sleep(2)
            
            current_url = self.driver.current_url
            print(f"📍 Current URL: {current_url}")
            
            # Get the main title
            title = "Title not found"
            title_selectors = ["h1", "h1.text-3xl", "h1.font-bold"]
            
            for selector in title_selectors:
                try:
                    title_element = self.driver.find_element(By.CSS_SELECTOR, selector)
                    if title_element.text.strip():
                        title = title_element.text.strip()
                        print(f"✓ Found title: {title}")
                        break
                except NoSuchElementException:
                    continue
            
            url = self.driver.current_url
            
            # Find the main article container
            content_selectors = [
                "article",
                "main", 
                "[role='main']",
                "div.prose",
                "div[class*='content']"
            ]
            
            content_container = None
            for selector in content_selectors:
                try:
                    content_container = self.driver.find_element(By.CSS_SELECTOR, selector)
                    if content_container:
                        print(f"✓ Found content container using: {selector}")
                        break
                except NoSuchElementException:
                    continue
            
            if not content_container:
                print("⚠️ No specific content container found, using body")
                content_container = self.driver.find_element(By.TAG_NAME, "body")
            
            # Extract structured content
            print("📝 Extracting structured content...")
            
            structured_content = []
            all_text_parts = []
            
            # Get all headings and paragraphs
            all_elements = content_container.find_elements(By.CSS_SELECTOR, "h1, h2, h3, h4, h5, h6, p")
            
            if not all_elements:
                print("⚠️ No structured elements found, trying alternative extraction...")
                all_elements = self.driver.find_elements(By.CSS_SELECTOR, "h1, h2, h3, h4, h5, h6, p")
            
            current_section = {
                'title': None,
                'level': 0,
                'content': []
            }
            
            section_count = 0
            paragraph_count = 0
            
            # First pass: identify all sections and paragraphs with their positions
            elements_data = []
            for idx, element in enumerate(all_elements):
                try:
                    tag_name = element.tag_name.lower()
                    text = element.text.strip()
                    
                    if not text or len(text) < 3:
                        continue
                    
                    # Store element info
                    if tag_name.startswith('h'):
                        level = int(tag_name[1])
                        elements_data.append({
                            'type': 'heading',
                            'text': text,
                            'level': level,
                            'index': idx
                        })
                        print(f"  📌 Section: {text}")
                    elif tag_name == 'p' and len(text) > 20:
                        elements_data.append({
                            'type': 'paragraph',
                            'text': text,
                            'index': idx
                        })
                        
                except Exception as e:
                    continue
            
            # Second pass: group paragraphs under their sections
            for i, elem in enumerate(elements_data):
                if elem['type'] == 'heading':
                    # Save previous section if it exists
                    if current_section['title'] and current_section['content']:
                        structured_content.append(current_section)
                        section_count += 1
                        
                        # Format section for output
                        all_text_parts.append(f"\n\n{'='*70}\n")
                        all_text_parts.append(f"{current_section['title']}\n")
                        all_text_parts.append(f"{'='*70}\n\n")
                        all_text_parts.append("\n\n".join(current_section['content']))
                    
                    # Start new section
                    current_section = {
                        'title': elem['text'],
                        'level': elem['level'],
                        'content': []
                    }
                    
                    # Collect all paragraphs until next heading
                    j = i + 1
                    while j < len(elements_data) and elements_data[j]['type'] == 'paragraph':
                        current_section['content'].append(elements_data[j]['text'])
                        paragraph_count += 1
                        j += 1
            
            # Add the last section
            if current_section['title'] and current_section['content']:
                structured_content.append(current_section)
                section_count += 1
                all_text_parts.append(f"\n\n{'='*70}\n")
                all_text_parts.append(f"{current_section['title']}\n")
                all_text_parts.append(f"{'='*70}\n\n")
                all_text_parts.append("\n\n".join(current_section['content']))
            
            # Combine all text
            content_text = "".join(all_text_parts)
            
            print(f"✓ Extracted {section_count} sections with {paragraph_count} paragraphs")
            
            # Fallback: if no structured content, try getting all paragraphs
            if not content_text or len(content_text) < 100:
                print("⚠️ Minimal structured content, trying paragraph extraction...")
                
                try:
                    all_paragraphs = content_container.find_elements(By.TAG_NAME, "p")
                    texts = []
                    
                    for p in all_paragraphs:
                        text = p.text.strip()
                        if text and len(text) > 20:
                            texts.append(text)
                    
                    if texts:
                        content_text = "\n\n".join(texts)
                        print(f"✓ Extracted {len(texts)} paragraphs as fallback")
                except Exception as e:
                    print(f"⚠️ Paragraph extraction failed: {str(e)}")
            
            # Final fallback: get all visible text
            if not content_text or len(content_text) < 50:
                print("⚠️ Using final fallback: extracting all visible text...")
                try:
                    # Try to get text from main content area only
                    content_text = content_container.text
                except:
                    # Last resort: get all body text
                    body = self.driver.find_element(By.TAG_NAME, "body")
                    content_text = body.text
            
            # Get metadata
            word_count = len(content_text.split())
            char_count = len(content_text)
            
            print(f"📊 Final stats: {word_count:,} words, {char_count:,} characters")
            
            # Extract references
            references = []
            try:
                ref_elements = self.driver.find_elements(By.CSS_SELECTOR, "a[href^='http']")
                seen_urls = set()
                
                for ref in ref_elements:
                    try:
                        href = ref.get_attribute('href')
                        if href and 'grokipedia.com' not in href and href not in seen_urls:
                            seen_urls.add(href)
                            references.append({
                                'number': len(references) + 1,
                                'url': href
                            })
                            
                            if len(references) >= 100:
                                break
                    except Exception:
                        continue
                        
                print(f"📚 Found {len(references)} external references")
            except Exception as e:
                print(f"⚠️ Could not extract references: {str(e)}")
            
            # Post-processing: Extract section titles for formatting even if structured extraction failed
            section_titles = []
            if not structured_content or len(structured_content) == 0:
                print("📝 Extracting section titles for post-processing...")
                try:
                    # Find all heading elements
                    heading_elements = content_container.find_elements(By.CSS_SELECTOR, "h1, h2, h3, h4, h5, h6")
                    for heading in heading_elements:
                        heading_text = heading.text.strip()
                        if heading_text and len(heading_text) > 2 and heading_text != title:
                            section_titles.append(heading_text)
                    
                    print(f"✓ Found {len(section_titles)} section titles for formatting")
                except Exception as e:
                    print(f"⚠️ Could not extract section titles: {str(e)}")
            
            return {
                'title': title,
                'url': url,
                'content_text': content_text,
                'word_count': word_count,
                'char_count': char_count,
                'references_count': len(references),
                'references': references,
                'structured_content': structured_content if structured_content else None,
                'section_titles': section_titles if section_titles else None
            }
            
        except Exception as e:
            print(f"❌ Error scraping article: {str(e)}")
            return {"error": f"Failed to scrape article: {str(e)}"}
    
    def close(self):
        """Close the browser"""
        if self.driver:
            self.driver.quit()


def format_content_with_sections(content_text, section_titles):
    """
    Post-process content to add section headers based on found titles
    
    Args:
        content_text: Raw text content
        section_titles: List of section titles found in the page
    
    Returns:
        Formatted text with section headers
    """
    if not section_titles or not content_text:
        return content_text
    
    print(f"🔧 Post-processing content with {len(section_titles)} section titles...")
    
    formatted_parts = []
    lines = content_text.split('\n')
    
    for i, line in enumerate(lines):
        line_stripped = line.strip()
        
        # Check if this line matches any section title
        is_section_title = False
        for title in section_titles:
            if line_stripped == title or line_stripped.startswith(title):
                # Add formatted section header
                formatted_parts.append(f"\n\n{'='*70}\n{title}\n{'='*70}\n\n")
                is_section_title = True
                break
        
        # If not a section title, add the line as-is
        if not is_section_title and line_stripped:
            formatted_parts.append(line)
    
    formatted_text = '\n'.join(formatted_parts)
    
    # Clean up excessive newlines
    import re
    formatted_text = re.sub(r'\n{4,}', '\n\n', formatted_text)
    
    print(f"✓ Content formatted with section headers")
    return formatted_text


def save_to_file(data, filename, source, query):
    """Save scraped data to a text file with improved formatting"""
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(f"{source} Data Export\n")
        f.write(f"Query: {query}\n")
        f.write(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write("="*80 + "\n\n")
        
        if "error" in data:
            f.write(f"❌ Error: {data['error']}\n")
            return
        
        f.write(f"📖 Title: {data.get('title', 'N/A')}\n")
        f.write(f"🔗 URL: {data.get('url', 'N/A')}\n")
        f.write(f"📝 Word Count: {data.get('word_count', 0):,}\n")
        f.write(f"📄 Character Count: {data.get('char_count', 0):,}\n")
        f.write(f"📚 References: {data.get('references_count', 0)}\n")
        
        # Show section count if available
        structured_content = data.get('structured_content')
        if structured_content:
            f.write(f"📑 Sections: {len(structured_content)}\n")
        
        f.write("="*80 + "\n\n")
        
        # Write content
        content = data.get('content_text', '')
        if content:
            # Apply post-processing if we have section titles but no structured content
            section_titles = data.get('section_titles')
            structured_content = data.get('structured_content')
            
            if section_titles and not structured_content:
                print(f"🔧 Applying post-processing formatting for {source}...")
                content = format_content_with_sections(content, section_titles)
            
            if structured_content:
                f.write("📄 ARTICLE CONTENT (Structured):\n\n")
            else:
                f.write("📄 ARTICLE CONTENT:\n\n")
            
            f.write(content)
            f.write("\n\n")
        else:
            f.write("⚠️ No content could be extracted.\n\n")
        
        # Write references
        if data.get('references'):
            f.write(f"\n{'='*80}\n")
            f.write(f"📚 REFERENCES ({len(data['references'])}):\n")
            f.write(f"{'='*80}\n\n")
            for ref in data['references']:
                f.write(f"  [{ref['number']}] {ref['url']}\n")


def main():
    """Main function"""
    output_dir = "dual_scraper_output"
    os.makedirs(output_dir, exist_ok=True)
    
    print("🚀 Grokipedia + Wikipedia Dual Scraper")
    print("="*80)
    
    query = input("\nEnter your search query: ").strip()
    
    if not query:
        print("❌ No query provided. Exiting.")
        return
    
    headless = True
    print("🔇 Running in headless mode...")
    
    grokipedia_scraper = None
    try:
        # Scrape Wikipedia first
        print("\n" + "="*80)
        print("SCRAPING WIKIPEDIA")
        print("="*80)
        wikipedia_scraper = WikipediaAPIScraper()
        wikipedia_data = wikipedia_scraper.search_and_scrape(query)
        
        if "error" in wikipedia_data:
            print(f"❌ Wikipedia Error: {wikipedia_data['error']}")
        else:
            print(f"✅ Wikipedia scraped successfully")
            print(f"📝 Word count: {wikipedia_data.get('word_count', 0):,}")
            print(f"📚 References: {wikipedia_data.get('references_count', 0)}")
        
        # Scrape Grokipedia
        print("\n" + "="*80)
        print("SCRAPING GROKIPEDIA")
        print("="*80)
        grokipedia_scraper = GrokipediaSeleniumScraper(headless=headless)
        grokipedia_data = grokipedia_scraper.search_and_scrape(query)
        
        if "error" in grokipedia_data:
            print(f"❌ Grokipedia Error: {grokipedia_data['error']}")
        else:
            print(f"✅ Grokipedia scraped successfully")
            print(f"📝 Word count: {grokipedia_data.get('word_count', 0):,}")
            print(f"📚 References: {grokipedia_data.get('references_count', 0)}")
            if grokipedia_data.get('structured_content'):
                print(f"📑 Sections: {len(grokipedia_data['structured_content'])}")
        
        # Save to files
        grokipedia_filename = f"{output_dir}/grokipedia.txt"
        wikipedia_filename = f"{output_dir}/wikipedia.txt"
        
        save_to_file(grokipedia_data, grokipedia_filename, "Grokipedia", query)
        save_to_file(wikipedia_data, wikipedia_filename, "Wikipedia", query)
        
        print(f"\n✅ Grokipedia data saved to: {grokipedia_filename}")
        print(f"✅ Wikipedia data saved to: {wikipedia_filename}")
        
        print("\n" + "="*80)
        print("🎉 Done!")
        
    except Exception as e:
        print(f"\n❌ Unexpected error: {str(e)}")
    
    finally:
        if grokipedia_scraper:
            print("\n🔒 Closing browser...")
            grokipedia_scraper.close()


if __name__ == "__main__":
    main()