"""
Supabase helper for auto-saving user searches, scrapes, and chat history
"""
import os
from typing import Optional, Dict, Any
from supabase import create_client, Client

def get_supabase() -> Optional[Client]:
    """Get Supabase client - reads env vars at call time"""
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        return None
    return create_client(url, key)


def save_people_search(user_id: str, search_query: str, results: Any, source: str = "apify") -> bool:
    """
    Auto-save people search to database
    
    Args:
        user_id: User's UUID from auth
        search_query: Search query (e.g. "Amanda Wray")
        results: Search results (dict or list)
        source: 'apify', 'tavily', etc.
    
    Returns:
        True if saved successfully
    """
    supabase = get_supabase()
    if not supabase:
        return False
    
    try:
        result_count = len(results) if isinstance(results, list) else len(results.get('items', [])) if isinstance(results, dict) else 0
        
        supabase.table('people_searches').insert({
            'user_id': user_id,
            'search_query': search_query,
            'results': results,
            'result_count': result_count,
            'source': source,
            'status': 'completed'
        }).execute()
        return True
    except Exception as e:
        print(f"Error saving people search: {e}")
        return False


def save_property_scrape(user_id: str, property_url: str, property_data: Dict, source: str = "zillow") -> bool:
    """
    Auto-save property scrape to database
    
    Args:
        user_id: User's UUID from auth
        property_url: Property listing URL
        property_data: Scraped property data
        source: 'zillow', 'realtor', 'redfin', etc.
    
    Returns:
        True if saved successfully
    """
    supabase = get_supabase()
    if not supabase:
        return False
    
    try:
        supabase.table('property_scrapes').insert({
            'user_id': user_id,
            'property_url': property_url,
            'property_data': property_data,
            'source': source,
            'status': 'completed'
        }).execute()
        return True
    except Exception as e:
        print(f"Error saving property scrape: {e}")
        return False


def save_chat_message(user_id: str, role: str, content: str, tool_used: Optional[str] = None) -> bool:
    """
    Auto-save chat message to database
    
    Args:
        user_id: User's UUID from auth
        role: 'user' or 'assistant'
        content: Message content
        tool_used: 'people_search', 'property_scraper', 'web_search', or None
    
    Returns:
        True if saved successfully
    """
    supabase = get_supabase()
    if not supabase:
        return False
    
    try:
        supabase.table('chat_history').insert({
            'user_id': user_id,
            'role': role,
            'content': content,
            'tool_used': tool_used
        }).execute()
        return True
    except Exception as e:
        print(f"Error saving chat message: {e}")
        return False


def get_user_search_history(user_id: str, limit: int = 10):
    """Get user's recent searches"""
    supabase = get_supabase()
    if not supabase:
        return []
    
    try:
        response = supabase.table('people_searches')\
            .select('*')\
            .eq('user_id', user_id)\
            .order('created_at', desc=True)\
            .limit(limit)\
            .execute()
        return response.data
    except Exception as e:
        print(f"Error getting search history: {e}")
        return []


def get_user_scrape_history(user_id: str, limit: int = 10):
    """Get user's recent property scrapes"""
    supabase = get_supabase()
    if not supabase:
        return []
    
    try:
        response = supabase.table('property_scrapes')\
            .select('*')\
            .eq('user_id', user_id)\
            .order('created_at', desc=True)\
            .limit(limit)\
            .execute()
        return response.data
    except Exception as e:
        print(f"Error getting scrape history: {e}")
        return []


def get_user_chat_history(user_id: str, limit: int = 50):
    """Get user's recent chat messages"""
    supabase = get_supabase()
    if not supabase:
        return []
    
    try:
        response = supabase.table('chat_history')\
            .select('*')\
            .eq('user_id', user_id)\
            .order('created_at', desc=True)\
            .limit(limit)\
            .execute()
        return response.data
    except Exception as e:
        print(f"Error getting chat history: {e}")
        return []


def cache_bright_data_result(property_url: str, property_data: dict) -> bool:
    """Cache Bright Data marketplace result"""
    supabase = get_supabase()
    if not supabase:
        return False
    
    try:
        supabase.table('bright_data_cache').upsert({
            'property_url': property_url,
            'property_data': property_data,
            'source': 'bright_data_marketplace'
        }).execute()
        return True
    except Exception as e:
        print(f"Error caching Bright Data result: {e}")
        return False


def get_cached_bright_data(property_url: str) -> Optional[Dict]:
    """Get cached Bright Data result if not expired"""
    supabase = get_supabase()
    if not supabase:
        return None
    
    try:
        response = supabase.table('bright_data_cache')\
            .select('property_data')\
            .eq('property_url', property_url)\
            .gt('expires_at', 'now()')\
            .execute()
        
        if response.data:
            return response.data[0]['property_data']
        return None
    except Exception as e:
        print(f"Error getting cached Bright Data: {e}")
        return None
