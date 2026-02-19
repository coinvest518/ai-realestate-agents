"""
Tavily API integration for web search, extraction, crawling, and research.
"""
import os
from typing import Optional, Dict, Any, List
from tavily import TavilyClient

TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")

def get_tavily_client() -> Optional[TavilyClient]:
    """Get Tavily client if API key is configured."""
    if not TAVILY_API_KEY:
        return None
    return TavilyClient(api_key=TAVILY_API_KEY)

def tavily_search(query: str, max_results: int = 5) -> Dict[str, Any]:
    """
    Search the web using Tavily AI-optimized search.
    Returns structured results with titles, URLs, and content.
    """
    client = get_tavily_client()
    if not client:
        return {"error": "Tavily API key not configured"}
    
    try:
        response = client.search(query, max_results=max_results)
        return {"ok": True, "result": response}
    except Exception as e:
        return {"ok": False, "error": str(e)}
