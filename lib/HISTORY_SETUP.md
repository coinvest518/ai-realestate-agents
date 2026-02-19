# History & Storage System Setup

## Overview
Professional history viewer with per-user data storage, PDF export, and tiered storage limits.

## Features Implemented

### 1. History Page (`/dashboard/history`)
- **Tabbed Interface**: Separate tabs for People Searches and Property Scrapes
- **Search & Filter**: Real-time search across history items
- **Export to PDF**: Download any search result as formatted PDF
- **Delete Items**: Remove individual history entries
- **Real-time Stats**: Shows count of items per category

### 2. Backend API Endpoints

#### Get History
```bash
GET /api/history/people
GET /api/history/property
Headers: X-User-ID: <user_id>
Query: ?limit=50
```

#### Delete Item
```bash
DELETE /api/history/{item_type}/{item_id}
Headers: X-User-ID: <user_id>
```

#### Export to PDF
```bash
GET /api/history/export/{item_type}/{item_id}
Headers: X-User-ID: <user_id>
Returns: PDF file download
```

#### Storage Usage
```bash
GET /api/usage/storage
Headers: X-User-ID: <user_id>
Returns: {
  used_bytes, used_mb, limit_bytes, limit_mb, tier, percentage
}
```

### 3. Storage Tiers

| Tier | Storage Limit | Price |
|------|--------------|-------|
| Free | 100 MB | $0/month |
| Pro | 5 GB | $29/month |
| Enterprise | Unlimited | Custom |

### 4. Database Schema Updates

Added to `user_profiles` table:
- `tier` (TEXT): 'free', 'pro', 'enterprise'
- `storage_limit_bytes` (BIGINT): Default 104857600 (100MB)

### 5. Auto-Save Integration

All searches are automatically saved to Supabase:
- People searches → `people_searches` table
- Property scrapes → `property_scrapes` table
- Includes: query, results, source, status, timestamp

## How Professional Apps Do It

### ChatGPT/Claude Pattern
- **Sidebar**: Recent conversations (last 7 days)
- **Archive**: Full history page with search
- **Export**: Individual conversation export
- **Delete**: Soft delete with recovery option

### Notion Pattern
- **Workspace**: All pages in sidebar tree
- **Search**: Global search across all content
- **Export**: Markdown, PDF, HTML options
- **Trash**: 30-day recovery period

### Linear Pattern
- **Filters**: Status, assignee, date range
- **Views**: List, Board, Calendar
- **Export**: CSV, JSON
- **Archive**: Separate archived items view

## Our Implementation

We follow the **ChatGPT pattern**:
1. ✅ Sidebar shows main navigation (not recent items - keeps it clean)
2. ✅ Dedicated History page with tabs
3. ✅ Search/filter within history
4. ✅ Export to PDF per item
5. ✅ Delete with immediate removal
6. ✅ Storage quota tracking

## Next Steps

### Phase 1: Basic (Current)
- [x] History page with tabs
- [x] API endpoints for CRUD
- [x] PDF export
- [x] Storage calculation

### Phase 2: Enhanced
- [ ] Add "Recent" section to sidebar (last 5 items)
- [ ] Implement soft delete (trash/recovery)
- [ ] Add date range filters
- [ ] Bulk export (multiple items to single PDF)
- [ ] Storage usage widget in dashboard

### Phase 3: Premium
- [ ] Payment integration (Stripe)
- [ ] Tier upgrade flow
- [ ] Storage quota warnings
- [ ] Auto-cleanup for free tier (30 days)
- [ ] Export to CSV/JSON

## Usage Example

### Frontend (History Page)
```typescript
// Fetch history
const response = await fetch('http://localhost:8000/api/history/people', {
  headers: { 'X-User-ID': 'user-123' }
})
const data = await response.json()
setSearchHistory(data.data)

// Export to PDF
const response = await fetch(`http://localhost:8000/api/history/export/people/${id}`, {
  headers: { 'X-User-ID': 'user-123' }
})
const blob = await response.blob()
// Download file...

// Delete item
await fetch(`http://localhost:8000/api/history/people/${id}`, {
  method: 'DELETE',
  headers: { 'X-User-ID': 'user-123' }
})
```

### Backend (Auto-save)
```python
# In main.py orchestration
from supabase_helper import save_people_search

result = apify_run_task(...)
if user_id and result:
    save_people_search(user_id, query, result, 'apify')
```

## Storage Calculation

Storage is calculated from JSON size:
```python
total_bytes = 0
for item in history:
    if item.get('results'):
        total_bytes += len(json.dumps(item['results']).encode('utf-8'))

percentage = (total_bytes / limit_bytes) * 100
```

## PDF Export Format

Generated PDFs include:
- Title (People Search Report / Property Scrape Report)
- Metadata table (Query, Date, Status, Source)
- Results section (formatted JSON)
- Professional styling with ReportLab

## Files Modified

1. `app/dashboard/history/page.tsx` - History viewer UI
2. `app/dashboard/layout.tsx` - Added History link to sidebar
3. `backend/history_api.py` - API endpoints for history operations
4. `backend/main.py` - Integrated history router
5. `supabase_schema.sql` - Added tier and storage_limit columns
6. `backend/requirements.txt` - Added reportlab

## Testing

1. Run backend: `cd backend && uvicorn main:app --reload`
2. Run frontend: `npm run dev`
3. Navigate to `/dashboard/history`
4. Perform a people search from dashboard
5. Check history page for saved search
6. Test export and delete functions

## Notes

- User authentication not yet implemented (using X-User-ID header)
- Storage limits not enforced yet (calculation only)
- Payment integration pending
- Soft delete/trash not implemented (immediate deletion)
