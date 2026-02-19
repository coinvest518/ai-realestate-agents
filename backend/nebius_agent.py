"""
Nebius LLM with Function Calling - Intelligent tool use
Based on: https://github.com/nebius/token-factory-cookbook/tree/main/tool-calling
"""
import os
import json
import httpx
from typing import Optional, Dict, Any, List

NEBIUS_API_KEY = os.getenv("NEBIUS_API_KEY")
NEBIUS_MODEL = os.getenv("NEBIUS_MODEL", "nebius/meta-llama/Meta-Llama-3.1-8B-Instruct")
NEBIUS_BASE_URL = "https://api.tokenfactory.nebius.com/v1"
API_BASE_URL = os.getenv("NEXT_PUBLIC_API_BASE", "http://localhost:8000")

# Tool definitions for Nebius
TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "get_user_history",
            "description": "Get user's recent searches and scrapes. Use this to reference what the user has searched for before.",
            "parameters": {
                "type": "object",
                "properties": {
                    "history_type": {
                        "type": "string",
                        "enum": ["searches", "scrapes", "all"],
                        "description": "Type of history to retrieve"
                    }
                },
                "required": ["history_type"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "people_search",
            "description": "Search for a person's contact information (phone, email, address) using Apify Skip Trace. Use this when user asks to find someone or search for contact info.",
            "parameters": {
                "type": "object",
                "properties": {
                    "name": {
                        "type": "string",
                        "description": "Full name of the person to search for"
                    },
                    "limit": {
                        "type": "integer",
                        "description": "Maximum number of results (default 5)",
                        "default": 5
                    }
                },
                "required": ["name"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "web_search",
            "description": "Search the web using Tavily AI-optimized search. Use for general web searches, research, or finding information online.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Search query"
                    },
                    "max_results": {
                        "type": "integer",
                        "description": "Maximum number of results (default 5)",
                        "default": 5
                    }
                },
                "required": ["query"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "property_scraper",
            "description": "Scrape property listing data from Zillow, Realtor.com, or Redfin URLs. Use when user provides a property URL.",
            "parameters": {
                "type": "object",
                "properties": {
                    "url": {
                        "type": "string",
                        "description": "Property listing URL"
                    }
                },
                "required": ["url"]
            }
        }
    }
]


def call_nebius_with_tools(user_message: str, conversation_history: List[Dict] = None, user_id: str = None) -> Dict[str, Any]:
    """
    Call Nebius LLM with function calling support.
    LLM decides whether to use tools or just chat.
    """
    if not NEBIUS_API_KEY:
        return {"error": "NEBIUS_API_KEY not configured"}
    
    # Build user context from history
    user_context = ""
    if user_id:
        try:
            from supabase_helper import get_user_search_history, get_user_scrape_history
            searches = get_user_search_history(user_id, limit=3)
            scrapes = get_user_scrape_history(user_id, limit=3)
            
            if searches:
                user_context += "\n\nRecent searches: " + ", ".join([s['search_query'] for s in searches])
            if scrapes:
                user_context += "\n\nRecent properties: " + ", ".join([s['property_url'].split('/')[-1] for s in scrapes[:3]])
        except Exception as e:
            print(f"Error fetching user history: {e}")
    
    # Build messages
    messages = []
    if conversation_history:
        messages.extend(conversation_history[-5:])
    messages.append({"role": "user", "content": user_message})
    
    # System prompt with user context
    system_message = {
        "role": "system",
        "content": f"""You are a helpful real estate assistant. You can chat normally OR use tools when needed.

IMPORTANT: Only use tools when the user explicitly requests an action:
- "Find John Doe" → Use people_search
- "Search for real estate trends" → Use web_search  
- "Scrape https://zillow.com/..." → Use property_scraper

For conversational queries, respond naturally WITHOUT using tools:
- "Hi" → Greet them
- "What can you do?" → Explain capabilities
- "Tell me about real estate" → Have a conversation

Be friendly, concise, and helpful.{user_context}"""
    }
    messages.insert(0, system_message)
    
    try:
        with httpx.Client(timeout=30.0) as client:
            payload = {
                "model": NEBIUS_MODEL.replace("nebius/", ""),
                "messages": messages,
                "temperature": 0.7,
                "max_tokens": 512
            }
            
            response = client.post(
                f"{NEBIUS_BASE_URL}/chat/completions",
                headers={
                    "Authorization": f"Bearer {NEBIUS_API_KEY}",
                    "Content-Type": "application/json"
                },
                json=payload
            )
            response.raise_for_status()
            result = response.json()
        if result.get("choices") and len(result.get("choices", [])) > 0:
            choice = result["choices"][0]
        else:
            return {"error": "No choices in LLM response"}
        message = choice.get("message", {})
        if message.get("tool_calls") and len(message.get("tool_calls", [])) > 0:
            # LLM decided to use a tool
            tool_call = message["tool_calls"][0]
            function_name = tool_call["function"]["name"]
            try:
                arguments = json.loads(tool_call["function"]["arguments"])
            except (json.JSONDecodeError, KeyError) as e:
                return {
                    "error": f"Failed to parse tool arguments: {str(e)}"
                }
            return {
                "type": "tool_call",
                "function": function_name,
                "arguments": arguments,
                "message": message.get("content", "")
            }
        else:
            # LLM responded conversationally
            return {
                "type": "text",
                "content": message.get("content", "No response")
            }
    except Exception as e:
        return {"error": str(e)}


def execute_tool(function_name: str, arguments: Dict[str, Any], user_id: str = None) -> str:
    """Execute the tool function and return results."""
    if function_name == "get_user_history":
        if not user_id:
            return "No user context available"
        try:
            from supabase_helper import get_user_search_history, get_user_scrape_history
            history_type = arguments.get("history_type", "all")
            result = ""
            
            if history_type in ["searches", "all"]:
                searches = get_user_search_history(user_id, limit=5)
                if searches:
                    result += "Recent Searches:\n"
                    for s in searches:
                        result += f"- {s['search_query']}: {s['result_count']} results\n"
            
            if history_type in ["scrapes", "all"]:
                scrapes = get_user_scrape_history(user_id, limit=5)
                if scrapes:
                    result += "\nRecent Properties:\n"
                    for s in scrapes:
                        url = s['property_url'].split('/')[-1]
                        result += f"- {url}\n"
            
            return result or "No history found"
        except Exception as e:
            return f"Error: {str(e)}"
    
    if function_name == "people_search":
        try:
            with httpx.Client(timeout=120.0) as client:
                res = client.post(
                    f"{API_BASE_URL}/api/people-search/start-orchestrator",
                    json={"people_name": arguments["name"], "data_limit": arguments.get("limit", 5)}
                )
                if res.status_code == 200:
                    return f"People search started for {arguments['name']}. Task ID: {res.json().get('task_id')}"
                return f"Error: {res.text}"
        except Exception as e:
            return f"Error: {str(e)}"
    
    elif function_name == "web_search":
        try:
            from tavily_helper import tavily_search
            result = tavily_search(arguments["query"], arguments.get("max_results", 5))
            if result.get("ok"):
                results = result["result"].get("results", [])
                formatted = "\n\n".join([
                    f"**{r.get('title')}**\n{r.get('url')}\n{r.get('content', '')[:150]}..."
                    for r in results[:3]
                ])
                return formatted or "No results found"
            return "Search failed"
        except Exception as e:
            return f"Error: {str(e)}"
    
    elif function_name == "property_scraper":
        try:
            with httpx.Client(timeout=120.0) as client:
                res = client.post(
                    f"{API_BASE_URL}/api/scrape/start",
                    json={"url": arguments["url"]}
                )
                if res.status_code == 200:
                    return f"Property scrape started for {arguments['url']}. Task ID: {res.json().get('task_id')}"
                return f"Error: {res.text}"
        except Exception as e:
            return f"Error: {str(e)}"
    
    return "Unknown tool"


def chat_with_nebius_agent(user_message: str, conversation_history: List[Dict] = None, user_id: str = None) -> str:
    """
    Main entry point: Chat with Nebius agent that has user context.
    """
    response = call_nebius_with_tools(user_message, conversation_history, user_id=user_id)
    
    if response.get("error"):
        return f"Error: {response['error']}"
    
    if response.get("type") == "tool_call":
        # LLM decided to use a tool
        function_name = response["function"]
        arguments = response["arguments"]
        
        # Execute the tool
        tool_result = execute_tool(function_name, arguments, user_id=user_id)
        
        return f"I'll help you with that.\n\n{tool_result}"
    
    else:
        # LLM responded conversationally
        return response.get("content", "No response")
