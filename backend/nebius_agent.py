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

# Tool definitions for Nebius
TOOLS = [
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


def call_nebius_with_tools(user_message: str, conversation_history: List[Dict] = None) -> Dict[str, Any]:
    """
    Call Nebius LLM with function calling support.
    LLM decides whether to use tools or just chat.
    """
    if not NEBIUS_API_KEY:
        return {"error": "NEBIUS_API_KEY not configured"}
    
    # Build messages
    messages = []
    if conversation_history:
        messages.extend(conversation_history[-5:])  # Last 5 messages for context
    messages.append({"role": "user", "content": user_message})
    
    # System prompt
    system_message = {
        "role": "system",
        "content": """You are a helpful real estate assistant. You can chat normally OR use tools when needed.

IMPORTANT: Only use tools when the user explicitly requests an action:
- "Find John Doe" → Use people_search
- "Search for real estate trends" → Use web_search  
- "Scrape https://zillow.com/..." → Use property_scraper

For conversational queries, respond naturally WITHOUT using tools:
- "Hi" → Greet them
- "What can you do?" → Explain capabilities
- "Tell me about real estate" → Have a conversation

Be friendly, concise, and helpful."""
    }
    messages.insert(0, system_message)
    
    try:
        with httpx.Client(timeout=30.0) as client:
            payload = {
                "model": NEBIUS_MODEL.replace("nebius/", ""),
                "messages": messages,
                "tools": TOOLS,
                "tool_choice": "auto",  # Let LLM decide
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
            
            # Check if LLM wants to use a tool
            choice = result.get("choices", [{}])[0]
            message = choice.get("message", {})
            
            if message.get("tool_calls"):
                # LLM decided to use a tool
                tool_call = message["tool_calls"][0]
                function_name = tool_call["function"]["name"]
                arguments = json.loads(tool_call["function"]["arguments"])
                
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


def execute_tool(function_name: str, arguments: Dict[str, Any]) -> str:
    """Execute the tool function and return results."""
    if function_name == "people_search":
        # Call Apify orchestrator
        try:
            with httpx.Client(timeout=120.0) as client:
                res = client.post(
                    "http://localhost:8000/api/people-search/start-orchestrator",
                    json={"people_name": arguments["name"], "data_limit": arguments.get("limit", 5)}
                )
                if res.status_code == 200:
                    return f"People search started for {arguments['name']}. Task ID: {res.json().get('task_id')}"
                return f"Error: {res.text}"
        except Exception as e:
            return f"Error: {str(e)}"
    
    elif function_name == "web_search":
        # Call Tavily
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
    
    elif function_name == "property_scraper":
        # Call property scraper
        try:
            with httpx.Client(timeout=120.0) as client:
                res = client.post(
                    "http://localhost:8000/api/scrape/start",
                    json={"url": arguments["url"]}
                )
                if res.status_code == 200:
                    return f"Property scrape started for {arguments['url']}. Task ID: {res.json().get('task_id')}"
                return f"Error: {res.text}"
        except Exception as e:
            return f"Error: {str(e)}"
    
    return "Unknown tool"


def chat_with_nebius_agent(user_message: str, conversation_history: List[Dict] = None) -> str:
    """
    Main entry point: Chat with Nebius agent that intelligently uses tools.
    """
    # Call Nebius with tools
    response = call_nebius_with_tools(user_message, conversation_history)
    
    if response.get("error"):
        return f"Error: {response['error']}"
    
    if response.get("type") == "tool_call":
        # LLM decided to use a tool
        function_name = response["function"]
        arguments = response["arguments"]
        
        # Execute the tool
        tool_result = execute_tool(function_name, arguments)
        
        return f"I'll help you with that.\n\n{tool_result}"
    
    else:
        # LLM responded conversationally
        return response.get("content", "No response")
