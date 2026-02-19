"""
Conversational AI Agent with optional tool use.
Uses CrewAI to intelligently decide when to use tools vs just chat.
"""
import os
from crewai import Agent, Task, Crew
from crewai.tools import tool
from typing import Optional

# Import existing tool functions
from tavily_helper import tavily_search

API_BASE_URL = os.getenv("NEXT_PUBLIC_API_BASE", "http://localhost:8000")

@tool("People Search Tool")
def people_search_tool(name: str, limit: int = 5) -> str:
    """
    Search for a person's contact information using Apify Skip Trace.
    Use this when user asks to find someone, search for contact info, or skip trace.
    
    Args:
        name: Full name of the person to search for
        limit: Maximum number of results (default 5)
    
    Returns:
        JSON string with contact information
    """
    import httpx
    try:
        with httpx.Client(timeout=120.0) as client:
            res = client.post(
                f"{API_BASE_URL}/api/people-search/start-orchestrator",
                json={"people_name": name, "data_limit": limit}
            )
            if res.status_code == 200:
                return f"People search started for {name}. Check results in dashboard."
            return f"Error: {res.text}"
    except Exception as e:
        return f"Error searching for {name}: {str(e)}"

@tool("Web Search Tool")
def web_search_tool(query: str, max_results: int = 5) -> str:
    """
    Search the web using Tavily AI-optimized search.
    Use this for general web searches, research, or finding information online.
    
    Args:
        query: Search query
        max_results: Maximum number of results (default 5)
    
    Returns:
        Search results with titles, URLs, and content snippets
    """
    try:
        result = tavily_search(query, max_results)
        if result.get("ok") and result.get("result", {}).get("results"):
            results = result["result"]["results"]
            formatted = "\n\n".join([
                f"**{r.get('title', 'N/A')}**\nURL: {r.get('url', 'N/A')}\n{r.get('content', '')[:200]}..."
                for r in results[:max_results]
            ])
            return formatted
        return "No results found."
    except Exception as e:
        return f"Search error: {str(e)}"

@tool("Property Scraper Tool")
def property_scraper_tool(url: str) -> str:
    """
    Scrape property listing data from Zillow, Realtor.com, or Redfin URLs.
    Use this when user provides a property URL or asks to scrape a listing.
    
    Args:
        url: Property listing URL
    
    Returns:
        Structured property data
    """
    import httpx
    try:
        with httpx.Client(timeout=120.0) as client:
            res = client.post(
                f"{API_BASE_URL}/api/scrape/start",
                json={"url": url}
            )
            if res.status_code == 200:
                return f"Property scrape started for {url}. Check results in dashboard."
            return f"Error: {res.text}"
    except Exception as e:
        return f"Error scraping {url}: {str(e)}"


def create_chat_agent():
    """Create a conversational agent that uses tools only when needed."""
    
    # Configure LLM to use Nebius
    from litellm import completion
    import os
    
    llm_config = {
        "model": "nebius/meta-llama/Meta-Llama-3.1-8B-Instruct",
        "api_key": os.getenv("NEBIUS_API_KEY"),
        "base_url": "https://api.tokenfactory.nebius.com/v1",
        "temperature": 0.7,
    }
    
    agent = Agent(
        role="Real Estate Assistant",
        goal="Help users with real estate tasks and answer questions conversationally",
        backstory="""You are a helpful real estate assistant with access to powerful tools.
        
        You can:
        - Search for people's contact information (phone, email, address)
        - Scrape property listings from Zillow, Realtor.com, Redfin
        - Search the web for information
        
        IMPORTANT: Only use tools when the user explicitly asks for an action:
        - "Find John Doe" → Use people_search_tool
        - "Search for real estate trends" → Use web_search_tool
        - "Scrape https://zillow.com/..." → Use property_scraper_tool
        
        For conversational queries, just respond naturally:
        - "Hi" → Greet them
        - "What can you do?" → Explain your capabilities
        - "Tell me about real estate" → Have a conversation
        
        Be friendly, concise, and helpful. Don't use tools unless necessary.""",
        tools=[people_search_tool, web_search_tool, property_scraper_tool],
        verbose=True,
        allow_delegation=False,
        llm=llm_config
    )
    
    return agent


def chat_with_agent(user_message: str, conversation_history: list = None) -> str:
    """
    Send a message to the conversational agent.
    
    Args:
        user_message: User's message
        conversation_history: Previous messages (optional)
    
    Returns:
        Agent's response
    """
    agent = create_chat_agent()
    
    # Build context from conversation history
    context = ""
    if conversation_history:
        context = "\n".join([
            f"{'User' if msg['role'] == 'user' else 'Assistant'}: {msg['content']}"
            for msg in conversation_history[-5:]  # Last 5 messages for context
        ])
    
    task = Task(
        description=f"""
        Previous conversation:
        {context}
        
        User's current message: {user_message}
        
        Respond appropriately. If the user is asking for an action (search, scrape, find), use the appropriate tool.
        If they're just chatting or asking questions, respond conversationally without using tools.
        """,
        expected_output="A helpful response to the user's message",
        agent=agent
    )
    
    crew = Crew(
        agents=[agent],
        tasks=[task],
        verbose=False
    )
    
    try:
        result = crew.kickoff()
        return str(result)
    except Exception as e:
        return f"I encountered an error: {str(e)}"
