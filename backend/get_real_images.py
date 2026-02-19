#!/usr/bin/env python3
"""
Scrape one real property to get actual images
"""
import os
import sys
import json
import re
from dotenv import load_dotenv

load_dotenv()

from real_estate_agents import scrape_property_data
from supabase_helper import cache_bright_data_result

# Real Albany property URL
TEST_URL = "https://www.zillow.com/homedetails/1-Steuben-St-Albany-NY-12207/30449196_zpid/"

print("Scraping property for real images...")
print(f"URL: {TEST_URL}\n")

try:
    result = scrape_property_data(TEST_URL)
    text = str(result.raw) if hasattr(result, "raw") else str(result)
    
    # Extract JSON
    json_match = re.search(r"```(?:json)?\s*([\s\S]*?)```", text)
    if json_match:
        text = json_match.group(1).strip()
    
    try:
        data = json.loads(text)
    except:
        data = {"raw_output": text}
    
    print("✓ Scraped successfully!")
    print(f"Address: {data.get('address', 'N/A')}")
    print(f"Price: {data.get('price', 'N/A')}")
    print(f"Images found: {len(data.get('image_urls', []))}")
    
    if data.get('image_urls'):
        print("\nImage URLs:")
        for i, url in enumerate(data.get('image_urls', [])[:5], 1):
            print(f"  {i}. {url}")
    
    # Cache to Supabase
    cache_bright_data_result(TEST_URL, data)
    print("\n✓ Cached to Supabase")
    
    # Update JSON file
    json_path = os.path.join(os.path.dirname(__file__), "albany_properties.json")
    with open(json_path, 'r') as f:
        properties = json.load(f)
    
    # Update first property with real data
    properties[0] = {
        'id': '1',
        'url': TEST_URL,
        'address': data.get('address', 'N/A'),
        'city': 'Albany',
        'state': 'NY',
        'zip': data.get('zip', '12207'),
        'price': data.get('price'),
        'beds': data.get('bedrooms') or data.get('beds'),
        'baths': data.get('bathrooms') or data.get('baths'),
        'sqft': data.get('square_feet') or data.get('sqft'),
        'image_urls': data.get('image_urls', []),
        'description': data.get('description', ''),
        'source': 'zillow',
        'cached_at': '2024-01-20T10:00:00Z'
    }
    
    with open(json_path, 'w') as f:
        json.dump(properties, f, indent=2)
    
    print(f"✓ Updated {json_path}")
    print("\nNow visit: http://localhost:3000/market")
    
except Exception as e:
    print(f"✗ Error: {e}")
    import traceback
    traceback.print_exc()
