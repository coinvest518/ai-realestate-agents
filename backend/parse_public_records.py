"""
Parse HTML from public records sites (Whitepages, Spokeo, BeenVerified)
Extract structured person data for frontend display
"""
from bs4 import BeautifulSoup
import re
import json


def parse_whitepages(html: str) -> list[dict]:
    """Parse Whitepages HTML and extract person data"""
    soup = BeautifulSoup(html, 'html.parser')
    results = []
    
    # Find all person cards/results
    # Whitepages uses JSON-LD structured data
    scripts = soup.find_all('script', type='application/ld+json')
    for script in scripts:
        try:
            data = json.loads(script.string)
            if isinstance(data, dict) and data.get('@type') == 'Person':
                person = {
                    'First Name': data.get('givenName', ''),
                    'Last Name': data.get('familyName', ''),
                    'Age': data.get('age', ''),
                    'Address Locality': '',
                    'Address Region': '',
                    'Postal Code': '',
                    'Phone-1': '',
                    'Phone-2': '',
                    'Email-1': '',
                }
                
                # Extract location
                if data.get('homeLocation'):
                    loc = data['homeLocation']
                    if isinstance(loc, list):
                        loc = loc[0]
                    if isinstance(loc, dict) and loc.get('address'):
                        addr = loc['address']
                        person['Address Locality'] = addr.get('addressLocality', '')
                        person['Address Region'] = addr.get('addressRegion', '')
                        person['Postal Code'] = addr.get('postalCode', '')
                
                # Extract phones
                phones = data.get('telephone', [])
                if isinstance(phones, str):
                    phones = [phones]
                if isinstance(phones, list):
                    for i, phone in enumerate(phones[:3], 1):
                        person[f'Phone-{i}'] = phone
                
                results.append(person)
        except:
            continue
    
    return results


def parse_spokeo(html: str) -> list[dict]:
    """Parse Spokeo HTML and extract person data"""
    soup = BeautifulSoup(html, 'html.parser')
    results = []
    
    # Spokeo also uses JSON-LD
    scripts = soup.find_all('script', type='application/ld+json')
    for script in scripts:
        try:
            data = json.loads(script.string)
            if isinstance(data, dict) and data.get('@type') == 'Person':
                person = {
                    'First Name': data.get('givenName', ''),
                    'Last Name': data.get('familyName', ''),
                    'Age': '',
                    'Address Locality': '',
                    'Address Region': '',
                    'Phone-1': '',
                    'Email-1': '',
                }
                
                # Extract location
                if data.get('address'):
                    addr = data['address']
                    person['Address Locality'] = addr.get('addressLocality', '')
                    person['Address Region'] = addr.get('addressRegion', '')
                
                # Extract phone
                if data.get('telephone'):
                    person['Phone-1'] = data['telephone']
                
                results.append(person)
        except:
            continue
    
    return results


def parse_beenverified(html: str) -> list[dict]:
    """Parse BeenVerified HTML and extract person data"""
    soup = BeautifulSoup(html, 'html.parser')
    results = []
    
    # BeenVerified uses JSON-LD structured data
    scripts = soup.find_all('script', type='application/ld+json')
    for script in scripts:
        try:
            data = json.loads(script.string)
            if isinstance(data, dict) and data.get('@type') == 'Person':
                person = {
                    'First Name': data.get('givenName', ''),
                    'Last Name': data.get('familyName', ''),
                    'Age': '',
                    'Address Locality': '',
                    'Address Region': '',
                    'Postal Code': '',
                    'Phone-1': '',
                    'Phone-2': '',
                    'Phone-3': '',
                    'Email-1': '',
                }
                
                # Extract location
                if data.get('homeLocation'):
                    locs = data['homeLocation']
                    if not isinstance(locs, list):
                        locs = [locs]
                    if locs and isinstance(locs[0], dict) and locs[0].get('address'):
                        addr = locs[0]['address']
                        person['Address Locality'] = addr.get('addressLocality', '')
                        person['Address Region'] = addr.get('addressRegion', '')
                        person['Postal Code'] = addr.get('postalCode', '')
                
                # Extract phones
                phones = data.get('telephone', [])
                if isinstance(phones, str):
                    phones = [phones]
                if isinstance(phones, list):
                    for i, phone in enumerate(phones[:3], 1):
                        person[f'Phone-{i}'] = phone
                
                results.append(person)
        except:
            continue
    
    return results


def parse_public_records_html(html: str, source: str) -> list[dict]:
    """
    Parse HTML from public records sites and return structured data
    
    Args:
        html: Raw HTML content
        source: Site name ('whitepages', 'spokeo', 'beenverified')
    
    Returns:
        List of person dictionaries with standardized fields
    """
    source = source.lower()
    
    if 'whitepages' in source:
        return parse_whitepages(html)
    elif 'spokeo' in source:
        return parse_spokeo(html)
    elif 'beenverified' in source:
        return parse_beenverified(html)
    else:
        return []


if __name__ == "__main__":
    # Test with saved HTML files
    import os
    
    files = [
        ('scraperapi_whitepages.html', 'whitepages'),
        ('scraperapi_spokeo.html', 'spokeo'),
        ('scraperapi_beenverified.html', 'beenverified'),
    ]
    
    for filename, source in files:
        if os.path.exists(filename):
            print(f"\n=== Testing {source} ===")
            with open(filename, 'r', encoding='utf-8') as f:
                html = f.read()
            
            results = parse_public_records_html(html, source)
            print(f"Found {len(results)} results")
            if results:
                print(json.dumps(results[0], indent=2))
