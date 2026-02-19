# AI Chat System - Code Review & Improvements

## Overview
The AI chat system has been reorganized to make conversational AI the **main feature** on the dashboard, with property scraping and people search as secondary tools below.

## Dashboard Reorganization
- **Chat moved to top** - Now the primary interface
- **Property Scraper** - Secondary tool below chat
- **People Search** - Secondary tool below chat
- Users can interact naturally with AI first, then use dedicated tools if needed

## Critical Issues Fixed

### 1. **Error Handling in nebius_agent.py**
**Issues Found:**
- Array access without bounds checking (IndexError risk)
- JSON parsing without error handling (JSONDecodeError risk)

**Fixes Applied:**
```python
# Before: Direct array access
choice = result.get("choices", [{}])[0]

# After: Safe bounds checking
if result.get("choices") and len(result.get("choices", [])) > 0:
    choice = result["choices"][0]
else:
    return {"error": "No choices in LLM response"}

# Before: Unprotected JSON parsing
arguments = json.loads(tool_call["function"]["arguments"])

# After: Try-catch with error handling
try:
    arguments = json.loads(tool_call["function"]["arguments"])
except (json.JSONDecodeError, KeyError) as e:
    return {"error": f"Failed to parse tool arguments: {str(e)}"}
```

### 2. **Hardcoded URLs → Environment Variables**
**Issues Found:**
- Hardcoded `http://localhost:8000` in multiple files
- Reduces deployment flexibility
- Breaks in production environments

**Fixes Applied:**
- Added `API_BASE_URL = os.getenv("NEXT_PUBLIC_API_BASE", "http://localhost:8000")` to:
  - `nebius_agent.py`
  - `chat_agent.py`
- Updated all API calls to use `API_BASE_URL` instead of hardcoded URLs

### 3. **Memory Leaks in chat-panel.tsx**
**Issues Found:**
- EventSource connections not cleaned up on component unmount
- Silent error handling (empty catch blocks)
- Missing error logging

**Fixes Applied:**
```typescript
// Added EventSource ref for cleanup
const esRef = useRef<EventSource | null>(null)

// Added cleanup effect
useEffect(() => {
  return () => {
    if (esRef.current) {
      esRef.current.close()
    }
  }
}, [])

// Track EventSource in ref
const es = new EventSource(...)
esRef.current = es

// Clear ref on close
es.close()
esRef.current = null

// Add error logging
catch (e) {
  console.error("Failed to parse message:", e)
}
```

### 4. **Performance Issues**
**Issues Found:**
- Agent recreated on every message in `chat_agent.py`
- Unnecessary overhead

**Recommendation:**
- Consider implementing agent caching or singleton pattern for future optimization

## AI Chat Intent Recognition

### How It Works
The chat system intelligently detects user intent:

1. **People Search Intent**
   - Triggers: "Find John Doe", "Search Mike Smith", "Look up Jane"
   - Extracts name and optional limit parameter
   - Runs Apify Skip Trace → Falls back to Tavily web search

2. **Property Scraping Intent**
   - Triggers: Any URL detected (Zillow, Realtor, Redfin)
   - Asks for confirmation before scraping
   - Streams logs in real-time via SSE

3. **Apify Actor Intent**
   - Triggers: "Run Apify task", "Run actor skip-trace"
   - Prompts for task ID if not provided
   - Supports sync/async execution

4. **Web Search Intent**
   - Triggers: "Search for", "Research", "Find information"
   - Uses Tavily AI-optimized search
   - Returns formatted results with URLs

5. **General Chat**
   - Fallback for conversational queries
   - Uses Nebius LLM with function calling
   - LLM decides when to use tools vs. just chat

### Example Interactions

**User:** "Find John Doe"
```
AI: I can run a people search for "John Doe" (limit 5). Run now?
[Run] [Cancel]
```

**User:** "Search for real estate trends in Austin"
```
AI: [Runs Tavily web search]
[Returns formatted results with titles, URLs, content]
```

**User:** "Scrape https://zillow.com/homedetails/..."
```
AI: I detected a URL and can run a property scrape. Run the scrape?
[Run] [Cancel]
```

## Security Improvements

### XSS Prevention
- User input is properly escaped in React components
- No direct HTML injection from user messages
- All API responses validated before display

### API Security
- Environment variables for sensitive credentials
- No hardcoded API keys in code
- Bearer token validation on backend

## Testing Recommendations

1. **Test Intent Recognition**
   - "Find John Doe" → Should trigger people search
   - "Search for Austin real estate" → Should trigger web search
   - "https://zillow.com/..." → Should trigger property scraper
   - "What's the weather?" → Should trigger general chat

2. **Test Error Handling**
   - Invalid JSON responses from API
   - Network timeouts
   - Missing environment variables

3. **Test Memory Leaks**
   - Open chat, run multiple searches
   - Close component
   - Check browser DevTools for EventSource cleanup

## Deployment Checklist

- [ ] Set `NEXT_PUBLIC_API_BASE` in Vercel environment variables
- [ ] Set `NEBIUS_API_KEY` in backend environment
- [ ] Set `APIFY_API_KEY` for people search
- [ ] Set `TAVILY_API_KEY` for web search
- [ ] Test chat with all intent types
- [ ] Monitor error logs for JSON parsing issues
- [ ] Verify EventSource cleanup in production

## Files Modified

1. `app/dashboard/page.tsx` - Reorganized sections (chat first)
2. `backend/nebius_agent.py` - Added error handling, env vars
3. `backend/chat_agent.py` - Added error handling, env vars
4. `components/chat-panel.tsx` - Fixed memory leaks, error logging

## Next Steps

1. **Implement Agent Caching** - Avoid recreating agent on every message
2. **Add Chat History Persistence** - Save conversations to database
3. **Implement Rate Limiting** - Prevent API abuse
4. **Add User Feedback** - Track which tools are most useful
5. **Improve Intent Recognition** - Add more sophisticated NLP patterns
