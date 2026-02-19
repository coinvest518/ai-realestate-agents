# Supabase Integration & AI Agent Data Access Analysis

## Current State: What's Implemented ✅

### 1. Supabase PostgreSQL Database Setup

**Database**: Supabase (PostgreSQL)
**URL**: `https://vuoahwhnpxjwopeypqje.supabase.co`
**Tables Created**:
- `user_profiles` - User account info
- `people_searches` - People search history
- `property_scrapes` - Property scrape history
- `chat_history` - Chat messages
- `saved_searches` - Saved search queries
- `usage_logs` - Usage tracking

**Row Level Security (RLS)**: ✅ Enabled
- Users can only see their own data
- Automatic user profile creation on signup

### 2. Data Being Saved to Supabase

**People Searches**:
```python
save_people_search(user_id, search_query, results, source='apify')
# Saves: search_query, results (JSONB), result_count, source, status
```

**Property Scrapes**:
```python
save_property_scrape(user_id, property_url, property_data, source='zillow')
# Saves: property_url, property_data (JSONB), source, status
```

**Chat History**:
```python
save_chat_message(user_id, role, content, tool_used=None)
# Saves: role, content, tool_used (people_search, property_scraper, web_search)
```

**Usage Logs**:
```python
# Tracks: usage_type (scrape, people_search), timestamp
```

### 3. Data Retrieval APIs

**Get People Search History**:
```bash
GET /api/history/people?limit=50
Header: x-user-id: {user_id}
```

**Get Property Scrape History**:
```bash
GET /api/history/property?limit=50
Header: x-user-id: {user_id}
```

**Get Storage Usage**:
```bash
GET /api/usage/storage
Header: x-user-id: {user_id}
```

---

## Current Limitation: AI Agent Access ❌

### The Problem

**The AI agent (nebius_agent.py, chat_agent.py) does NOT have access to:**
- User's historical search data
- User's previous scrapes
- User's chat history
- Real-time data from Supabase

**Why?**
1. AI agent is stateless - no user context passed
2. No database queries in agent initialization
3. Agent only sees current message, not history
4. No mechanism to inject Supabase data into agent context

### Current Flow (Limited)

```
User Message → Chat API → Nebius LLM
                          ↓
                    (No Supabase access)
                          ↓
                    Generic Response
```

### What We Need (Enhanced)

```
User Message → Chat API → Fetch User History from Supabase
                          ↓
                    Inject into Agent Context
                          ↓
                    Nebius LLM (with knowledge)
                          ↓
                    Smarter Response
```

---

## Solution: Enable AI Agent Access to Supabase Data

### Step 1: Modify Chat Endpoint to Pass User Context

**File**: `backend/main.py`

```python
@app.post("/api/chat")
async def chat_endpoint(request: Request):
    body = await request.json()
    prompt = (body.get("prompt") or body.get("message") or "").strip()
    conversation_history = body.get("history", [])
    user_id = request.headers.get("x-user-id")  # Get user ID
    
    if not prompt:
        raise HTTPException(status_code=400, detail="Missing prompt")
    
    try:
        from nebius_agent import chat_with_nebius_agent
        # Pass user_id to agent
        response = chat_with_nebius_agent(prompt, conversation_history, user_id=user_id)
        return {"response": response}
    except Exception as e:
        print(f"/api/chat: Nebius agent error: {e}")
        pass
    
    return {"response": "I can help you with people searches, property scraping, and general questions."}
```

### Step 2: Modify Nebius Agent to Accept User Context

**File**: `backend/nebius_agent.py`

```python
def chat_with_nebius_agent(user_message: str, conversation_history: List[Dict] = None, user_id: str = None) -> str:
    """
    Chat with Nebius agent that has access to user's historical data.
    """
    # Fetch user's recent searches and scrapes
    user_context = ""
    if user_id:
        from supabase_helper import get_user_search_history, get_user_scrape_history
        
        recent_searches = get_user_search_history(user_id, limit=5)
        recent_scrapes = get_user_scrape_history(user_id, limit=5)
        
        if recent_searches:
            user_context += "\n\nRecent people searches:\n"
            for search in recent_searches:
                user_context += f"- {search['search_query']} ({search['result_count']} results)\n"
        
        if recent_scrapes:
            user_context += "\n\nRecent property scrapes:\n"
            for scrape in recent_scrapes:
                user_context += f"- {scrape['property_url']}\n"
    
    # Build system prompt with user context
    system_message = {
        "role": "system",
        "content": f"""You are a helpful real estate assistant with access to user's search history.
        
{user_context}

You can use this context to provide better recommendations and follow-ups."""
    }
    
    # Rest of agent logic...
```

### Step 3: Create Tool to Query User's Saved Data

**File**: `backend/nebius_agent.py` (add new tool)

```python
@tool("User History Tool")
def get_user_history(user_id: str, history_type: str = "all") -> str:
    """
    Get user's search and scrape history.
    Use this to reference previous searches or scrapes.
    
    Args:
        user_id: User's UUID
        history_type: 'searches', 'scrapes', or 'all'
    
    Returns:
        Formatted history data
    """
    from supabase_helper import get_user_search_history, get_user_scrape_history
    
    result = ""
    if history_type in ["searches", "all"]:
        searches = get_user_search_history(user_id, limit=10)
        if searches:
            result += "Recent Searches:\n"
            for s in searches:
                result += f"- {s['search_query']}: {s['result_count']} results\n"
    
    if history_type in ["scrapes", "all"]:
        scrapes = get_user_scrape_history(user_id, limit=10)
        if scrapes:
            result += "\nRecent Scrapes:\n"
            for s in scrapes:
                result += f"- {s['property_url']}\n"
    
    return result or "No history found"
```

---

## Bright Data Marketplace Data Integration

### Current State

**Bright Data Marketplace Dataset** (Optional):
- Dataset ID: `gd_m517agnc1jppzwgtmw`
- Used for: Realtor.com pre-collected data
- Triggered via: `POST /api/datasets/trigger`

### Enhancement: Cache Marketplace Data in Supabase

**New Table**: `bright_data_cache`

```sql
CREATE TABLE IF NOT EXISTS public.bright_data_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dataset_id TEXT NOT NULL,
    property_url TEXT NOT NULL,
    property_data JSONB,
    source TEXT DEFAULT 'bright_data_marketplace',
    cached_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '30 days'
);

CREATE INDEX idx_bright_data_cache_url ON public.bright_data_cache(property_url);
CREATE INDEX idx_bright_data_cache_expires ON public.bright_data_cache(expires_at);
```

**New Function**: Cache Marketplace Data

```python
def cache_bright_data_result(dataset_id: str, property_url: str, property_data: dict):
    """Cache Bright Data marketplace results in Supabase"""
    from supabase_helper import supabase
    
    supabase.table('bright_data_cache').insert({
        'dataset_id': dataset_id,
        'property_url': property_url,
        'property_data': property_data,
        'source': 'bright_data_marketplace'
    }).execute()

def get_cached_bright_data(property_url: str):
    """Get cached Bright Data result"""
    from supabase_helper import supabase
    
    result = supabase.table('bright_data_cache')\
        .select('*')\
        .eq('property_url', property_url)\
        .gt('expires_at', 'now()')\
        .execute()
    
    return result.data[0] if result.data else None
```

---

## Recommended Implementation Plan

### Phase 1: Enable AI Agent Access (Quick Win)
1. ✅ Pass `user_id` to chat endpoint
2. ✅ Fetch user history in agent initialization
3. ✅ Inject context into system prompt
4. **Time**: 30 minutes

### Phase 2: Add User History Tool (Medium)
1. ✅ Create tool to query user's saved data
2. ✅ Allow agent to reference previous searches
3. ✅ Enable follow-up recommendations
4. **Time**: 1 hour

### Phase 3: Cache Bright Data Marketplace (Advanced)
1. ✅ Create cache table in Supabase
2. ✅ Save marketplace results after scraping
3. ✅ Query cache before making new requests
4. ✅ Reduce API costs and improve speed
5. **Time**: 2 hours

### Phase 4: Real-Time Knowledge Base (Future)
1. ✅ Embed user's historical data into vector DB
2. ✅ Use semantic search for context retrieval
3. ✅ Enable AI to learn from user patterns
4. **Time**: 4+ hours

---

## Benefits of Each Phase

| Phase | Benefit | Impact |
|-------|---------|--------|
| Phase 1 | AI knows user's search history | Better recommendations |
| Phase 2 | AI can reference past searches | Smarter follow-ups |
| Phase 3 | Cached marketplace data | 50% faster, lower costs |
| Phase 4 | Semantic search on history | Personalized AI responses |

---

## Data Flow After Implementation

```
User Message
    ↓
Chat API (with user_id)
    ↓
Fetch from Supabase:
  - Recent searches
  - Recent scrapes
  - Chat history
    ↓
Inject into Agent Context
    ↓
Nebius LLM (with knowledge)
    ↓
Agent decides: Use tool or chat?
    ↓
If tool: Query Supabase cache first
    ↓
Return smart response with context
    ↓
Save to Supabase for future reference
```

---

## Summary

**Current State**:
- ✅ Supabase PostgreSQL set up
- ✅ Data being saved (searches, scrapes, chat)
- ✅ History APIs working
- ❌ AI agent has NO access to this data

**What's Missing**:
- User context not passed to AI agent
- No mechanism to inject historical data
- Agent is stateless

**Solution**:
- Pass `user_id` to chat endpoint
- Fetch user history in agent
- Inject into system prompt
- Add tools to query history
- Cache Bright Data results

**Effort**: 30 minutes to 2 hours depending on phase
