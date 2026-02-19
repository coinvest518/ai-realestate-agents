# AgentScrape Backend (Python)

FastAPI server that runs the Real Estate AI agent (CrewAI + Bright Data MCP + Nebius LLM). The Next.js dashboard calls this API to run scrapes and check env status. Supported public sources include Zillow, Realtor.com, Redfin and other listing sites via Bright Data MCP.

## Prerequisites

- **Python 3.9+** (3.9–3.12 recommended)
- **Node.js + npm** (for Bright Data MCP: `npx @brightdata/mcp`)
- **Bright Data** account and API token
- **Nebius AI** API key

## Setup

1. From the **project root** (where `.env` lives), create a venv and install deps:

   ```bash
   cd backend
   python -m venv venv
   # Windows:
   .\venv\Scripts\activate
   # macOS/Linux:
   source venv/bin/activate
   pip install -r requirements.txt
   ```

2. Ensure the **root** `.env` has (see root `ENV.md` for full list):

   - `BRIGHT_DATA_API_TOKEN`
   - `WEB_UNLOCKER_ZONE`
   - `BROWSER_ZONE`
   - `NEBIUS_API_KEY`
   - Optional: `NEBIUS_MODEL` (defaults to Qwen3-235B if unset)
   - Optional: `BRIGHT_DATA_REALTOR_DATASET_ID` (if you want to use Bright Data Marketplace Realtor dataset)

3. Run the API:

   ```bash
   # From backend/ with venv active; loads ../.env
   uvicorn main:app --reload --port 8000
   ```

API additions

- `GET /api/settings` & `POST /api/settings` — runtime settings (sources toggles, dataset id). These are stored in-memory for now.
- `POST /api/datasets/trigger` — trigger a Bright Data dataset run (useful for marketplace/collected datasets).
- `GET /api/diagnostics` — quick health check (reports whether `litellm` is installed, Bright Data / Nebius keys present, and settings state).
- `POST /api/scrape/start` — start an asynchronous scrape task and return `{ "task_id" }` immediately.
- `GET /api/scrape/task/{task_id}/stream` — Server-Sent Events (SSE) stream of task logs; final `done` event contains the result.
- `GET /api/scrape/task/{task_id}/status` and `GET /api/scrape/task/{task_id}/logs` — pollable task status and logs endpoints.

Behavior

- If `BRIGHT_DATA_REALTOR_DATASET_ID` is set and the Settings flag `use_dataset_for_realtor` is enabled, `POST /api/scrape` will delegate Realtor URLs to the Bright Data dataset (collect-by-url) when requested.
- Prefer the async `/api/scrape/start` + SSE stream for UI-driven scrapes so the dashboard can show live agent/log output.
4. Open the Next.js app at `http://localhost:3000` and go to **Dashboard**. The dashboard uses `NEXT_PUBLIC_API_BASE=http://localhost:8000` to talk to this backend.

## API

- **GET /api/env-status** – Which env vars are set (no values). Used by the dashboard “Environment & API connection” card.
- **POST /api/scrape** – Body: `{ "url": "https://..." }`. Runs the agent and returns `{ "success", "data", "error?" }`.
- **GET /docs** – Swagger UI.

## Run agent from CLI

From `backend/` with venv active:

```bash
python real_estate_agents.py "https://www.zillow.com/homedetails/..."
```
