# Supabase Setup Guide - AI Real Estate Scraper

## Your Supabase Project
- **Project**: AI Real Estate
- **URL**: https://vuoahwhnpxjwopeypqje.supabase.co
- **Already configured in `.env`** ✅

## Setup Steps

### 1. Run Database Schema
1. Go to: https://supabase.com/dashboard/project/vuoahwhnpxjwopeypqje/sql
2. Copy contents of `supabase_schema.sql`
3. Paste into SQL Editor
4. Click "Run"

This creates:
- ✅ User profiles table
- ✅ People searches table (saves all searches)
- ✅ Property scrapes table (saves all scraped properties)
- ✅ Chat history table (saves conversations)
- ✅ Saved searches table (user favorites)
- ✅ Storage bucket for files
- ✅ Row Level Security (RLS) policies
- ✅ Auto-create profile on signup

### 2. Enable Auth Providers
Go to: https://supabase.com/dashboard/project/vuoahwhnpxjwopeypqje/auth/providers

Enable:
- ✅ Email (already enabled)
- ✅ Google OAuth (optional)
- ✅ GitHub OAuth (optional)

### 3. Configure Email Templates
Go to: https://supabase.com/dashboard/project/vuoahwhnpxjwopeypqje/auth/templates

Customize:
- Confirmation email
- Magic link email
- Password reset email

## Database Tables

### `user_profiles`
Stores user information
```sql
- id (UUID, references auth.users)
- email (TEXT)
- full_name (TEXT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### `people_searches`
Saves all people search results
```sql
- id (UUID)
- user_id (UUID)
- search_query (TEXT) - "Amanda Wray"
- search_type (TEXT) - 'name', 'address', 'phone', 'email'
- results (JSONB) - Full Apify/Tavily results
- result_count (INTEGER)
- source (TEXT) - 'apify', 'tavily'
- status (TEXT) - 'pending', 'completed', 'failed'
- created_at (TIMESTAMP)
```

### `property_scrapes`
Saves all property scrape results
```sql
- id (UUID)
- user_id (UUID)
- property_url (TEXT)
- property_data (JSONB) - Full scraped data
- source (TEXT) - 'zillow', 'realtor', 'redfin'
- status (TEXT)
- created_at (TIMESTAMP)
```

### `chat_history`
Saves chat conversations
```sql
- id (UUID)
- user_id (UUID)
- role (TEXT) - 'user', 'assistant'
- content (TEXT)
- tool_used (TEXT) - 'people_search', 'property_scraper', etc.
- created_at (TIMESTAMP)
```

### `saved_searches`
User's favorite searches
```sql
- id (UUID)
- user_id (UUID)
- search_name (TEXT) - "My Idaho Searches"
- search_type (TEXT) - 'people', 'property'
- search_params (JSONB) - {"name": "Amanda Wray", "limit": 5}
- created_at (TIMESTAMP)
```

## Storage

### `scraped-data` bucket
Stores files like:
- Property images
- PDF reports
- Exported CSVs

Files organized by user: `{user_id}/filename.pdf`

## Row Level Security (RLS)

All tables have RLS enabled:
- ✅ Users can only see their own data
- ✅ Users can only insert their own data
- ✅ Users can only update their own data
- ✅ Users can only delete their own data

## Next Steps

1. **Run the SQL schema** (copy `supabase_schema.sql` to SQL Editor)
2. **Test auth** - Sign up a user at `/auth/sign-up`
3. **Integrate with backend** - Save searches/scrapes to Supabase
4. **Add to frontend** - Show user's search history

## API Usage Examples

### Save a people search
```python
from supabase import create_client

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

supabase.table('people_searches').insert({
    'user_id': user_id,
    'search_query': 'Amanda Wray',
    'search_type': 'name',
    'results': apify_results,
    'result_count': len(apify_results),
    'source': 'apify',
    'status': 'completed'
}).execute()
```

### Get user's search history
```python
searches = supabase.table('people_searches')\
    .select('*')\
    .eq('user_id', user_id)\
    .order('created_at', desc=True)\
    .limit(10)\
    .execute()
```

### Save chat message
```python
supabase.table('chat_history').insert({
    'user_id': user_id,
    'role': 'user',
    'content': 'Find Amanda Wray',
    'tool_used': 'people_search'
}).execute()
```

## Security Notes

- ✅ All API keys in `.env` (never commit)
- ✅ RLS enabled on all tables
- ✅ Service role key only used server-side
- ✅ Anon key safe for client-side
- ✅ Storage policies restrict file access

## Resources

- Dashboard: https://supabase.com/dashboard/project/vuoahwhnpxjwopeypqje
- Auth: https://supabase.com/dashboard/project/vuoahwhnpxjwopeypqje/auth/users
- Database: https://supabase.com/dashboard/project/vuoahwhnpxjwopeypqje/editor
- Storage: https://supabase.com/dashboard/project/vuoahwhnpxjwopeypqje/storage/buckets
- Docs: https://supabase.com/docs
