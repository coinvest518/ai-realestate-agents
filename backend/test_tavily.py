"""
Test Tavily API integration - all 4 methods
"""
import os
from dotenv import load_dotenv
load_dotenv()

from tavily_helper import tavily_search, tavily_extract, tavily_crawl, tavily_research

print("=" * 80)
print("TAVILY API TEST")
print("=" * 80)

# Test 1: Search
print("\n1. SEARCH TEST - 'Amanda Wray phone number email'")
print("-" * 80)
result = tavily_search("Amanda Wray phone number email address", max_results=3)
if result.get("ok"):
    print(f"[OK] Success! Found {len(result['result'].get('results', []))} results")
    for idx, r in enumerate(result['result'].get('results', [])[:2], 1):
        print(f"\nResult {idx}:")
        print(f"  Title: {r.get('title', 'N/A')}")
        print(f"  URL: {r.get('url', 'N/A')}")
        print(f"  Content: {r.get('content', 'N/A')[:150]}...")
else:
    print(f"[ERROR] Error: {result.get('error')}")

# Test 2: Extract
print("\n\n2. EXTRACT TEST - Wikipedia AI page")
print("-" * 80)
result = tavily_extract("https://en.wikipedia.org/wiki/Artificial_intelligence")
if result.get("ok"):
    print(f"[OK] Success! Extracted content")
    content = result['result'].get('content', '') or result['result'].get('raw_content', '')
    print(f"  Content length: {len(content)} chars")
    print(f"  Preview: {content[:200]}...")
else:
    print(f"[ERROR] Error: {result.get('error')}")

# Test 3: Research
print("\n\n3. RESEARCH TEST - 'Latest real estate market trends 2024'")
print("-" * 80)
result = tavily_research("Latest real estate market trends 2024", max_results=3)
if result.get("ok"):
    print(f"[OK] Success! Research completed")
    if isinstance(result['result'], dict):
        print(f"  Answer: {str(result['result'].get('answer', 'N/A'))[:200]}...")
        sources = result['result'].get('results', [])
        print(f"  Sources: {len(sources)}")
        for idx, s in enumerate(sources[:2], 1):
            print(f"    {idx}. {s.get('title', 'N/A')} - {s.get('url', 'N/A')}")
    else:
        print(f"  Result: {str(result['result'])[:200]}...")
else:
    print(f"[ERROR] Error: {result.get('error')}")

# Test 4: Crawl (optional - can be slow)
print("\n\n4. CRAWL TEST - Tavily docs")
print("-" * 80)
result = tavily_crawl("https://docs.tavily.com", instructions="Find all pages about Python SDK")
if result.get("ok"):
    print(f"[OK] Success! Crawl completed")
    pages = result['result'].get('results', []) if isinstance(result['result'], dict) else []
    print(f"  Pages found: {len(pages)}")
    for idx, p in enumerate(pages[:2], 1):
        print(f"    {idx}. {p.get('url', 'N/A')}")
else:
    print(f"[ERROR] Error: {result.get('error')}")

print("\n" + "=" * 80)
print("TEST COMPLETE")
print("=" * 80)
