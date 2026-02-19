# Environment variables

Use a `.env` file in the **project root** (same folder as `package.json`). Both the Next.js app and the Python backend read it.

## Required for scraping (backend)

| Variable | Description |
|----------|-------------|
| `BRIGHT_DATA_API_TOKEN` | Bright Data API token (used as `API_TOKEN` by MCP). |
| `WEB_UNLOCKER_ZONE` | Bright Data Web Unlocker zone name. |
| `BROWSER_ZONE` | Bright Data Browser zone name (e.g. `scraping_browser1`). |
| `NEBIUS_API_KEY` | Nebius AI API key for the LLM. |

## Optional

| Variable | Description |
|----------|-------------|
| `NEBIUS_MODEL` | Nebius model id (e.g. `nebius/meta-llama/Meta-Llama-3.1-8B-Instruct` or `nebius/Qwen/Qwen3-235B-A22B`). Default used by backend if unset. |
| `BROWSERACT_API_KEY` | **People search / skip tracing:** BrowserAct API key. Get it from [BrowserAct](https://www.browseract.com) → Integrations & API → API Keys. Used for the Phone Number Extractor (Fast People Search) in the dashboard and chat. |
| `NEXT_PUBLIC_API_BASE` | Backend URL for the dashboard (e.g. `http://localhost:8000`). |
| `DATABASE_URL` | PostgreSQL connection string (e.g. Supabase). |
| `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | For future Supabase features. |
| `BRIGHT_DATA_REALTOR_DATASET_ID` | (Optional) Bright Data Marketplace dataset id for Realtor data; used when pulling Realtor listings from Bright Data marketplace. |

## Connection checklist

- **Dashboard “Environment & API connection”** shows which of these are set (values are never shown).
- Backend must be running (`cd backend && uvicorn main:app --reload --port 8000`) and reachable at `NEXT_PUBLIC_API_BASE` for scraping to work.
- Bright Data zones must match your Bright Data dashboard (Web Unlocker and Browser zone names).
