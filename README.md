# AI Real Estate Scraper Agents
> A full-stack SaaS platform that uses AI agents and Bright Data to scrape real estate listings, perform skip-tracing people searches, and run AI-powered web searches — all from a clean Next.js dashboard.
---
## Table of Contents
- [What This Project Does](#what-this-project-does)
- [Feature Breakdown](#feature-breakdown)
- [Architecture Overview](#architecture-overview)
- [Tech Stack](#tech-stack)
- [API Connections & Environment Variables](#api-connections--environment-variables)
- [Database Schema](#database-schema)
- [Backend API Endpoints](#backend-api-endpoints)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Deployment](#deployment)
---
## What This Project Does
**AI Real Estate Scraper Agents** automates the most time-consuming parts of real estate research:
1. **Property Data Extraction** – Paste any Zillow, Realtor.com, or Redfin listing URL and let AI agents extract the full property profile (price, beds/baths, square footage, images, listing agent, MLS number, and more) using Bright Data's proxy network to bypass anti-scraping measures.
2. **People / Skip-Trace Search** – Enter a name and location to find contact information (phone numbers, email addresses, mailing addresses) via Apify skip-trace APIs.
3. **AI Chat with Tools** – A conversational assistant that can autonomously decide to run a property scrape, a people search, or a Tavily web search based on what you ask.
4. **Subscription & Usage Management** – Free trial limits enforced per user, with Stripe-powered Pro and Enterprise upgrade paths.
5. **History & PDF Export** – Every scrape, search, and chat session is saved and can be exported to PDF.
6. **Real Estate Marketplace** – Browse and manage property listings pulled from Bright Data datasets.
---
## Feature Breakdown
### 🏠 Property Scraping
- Supports **Zillow**, **Realtor.com**, and **Redfin** listing URLs
- AI agent (CrewAI + Nebius LLM) navigates and extracts structured JSON:
  - `address`, `price`, `bedrooms`, `bathrooms`, `square_feet`, `lot_size`
  - `year_built`, `property_type`, `listing_agent`, `days_on_market`
  - `mls_number`, `description`, `image_urls`, `neighborhood`
- Bright Data MCP (Model Context Protocol) provides proxy rotation and browser rendering to bypass CAPTCHAs and bot detection
- Realtor.com can optionally use a **Bright Data Marketplace Dataset** for faster, pre-structured data
- Scraping jobs run asynchronously with real-time log streaming via Server-Sent Events (SSE)
### 🔍 People Search / Skip Tracing
- Accepts a name + optional location
- Calls **Apify** skip-trace actor to retrieve:
  - Phone numbers, email addresses, physical addresses
  - Associated relatives and age/demographic data
- Results are saved to history and displayed in the dashboard
### 💬 AI Chat Interface
- Conversational interface powered by **Nebius LLM** (Meta-Llama / Qwen models)
- Function-calling agent that can:
  - Trigger a property scrape from a URL mentioned in chat
  - Run a people/contact search
  - Execute a Tavily web search for any real-world query
  - Answer general questions without any tools
- Full conversation history persisted per user in Supabase
### 📊 Dashboard & History
- View all past property scrapes with full extracted data and images
- View all past people searches with contact results
- Chat history browser
- Usage counters with free-tier enforcement
- Export any history entry to PDF (via ReportLab)
### 💳 Subscriptions (Stripe)
- **Free tier**: limited searches and scrapes
- **Pro** and **Enterprise** tiers with higher limits
- Stripe Checkout + webhook handler for subscription lifecycle events
- Subscription status reflected in dashboard UI
### 🔐 Authentication
- Supabase Auth (email/password + magic links)
- Protected dashboard routes with server-side session checks
- Encrypted storage of user API keys in `user_integrations` table
### 🏪 Marketplace
- Real estate listings browsable in a marketplace view
- Data sourced from Bright Data datasets and manual imports
- Alert system for new listing events
### ⚙️ Settings & Integrations
- Per-user settings stored in Supabase
- Dashboard panel shows which environment/API keys are configured
- User-provided API keys are AES-encrypted before storage
---
## Architecture Overview
```
┌──────────────────────────────────────────────────────────┐
│                   Next.js Frontend (Vercel)               │
│  app/  (pages, API routes)  +  components/  +  hooks/    │
│                                                           │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │  Dashboard  │  │  Auth Pages  │  │  Marketplace    │  │
│  │  Chat Panel │  │  (Supabase)  │  │  Upgrade/Stripe │  │
│  └──────┬──────┘  └──────────────┘  └─────────────────┘  │
│         │ REST / SSE                                       │
└─────────┼────────────────────────────────────────────────┘
          │
          ▼
┌──────────────────────────────────────────────────────────┐
│               FastAPI Backend (Render.com)                │
│  backend/main.py  +  routers                             │
│                                                           │
│  ┌──────────────────┐   ┌─────────────────────────────┐  │
│  │  CrewAI Agents   │   │  Chat Agent (Nebius LLM)    │  │
│  │  real_estate_    │   │  chat_agent.py              │  │
│  │  agents.py       │   │  nebius_agent.py            │  │
│  └────────┬─────────┘   └──────────────┬──────────────┘  │
│           │                             │                  │
│  ┌────────▼─────────┐   ┌──────────────▼──────────────┐  │
│  │  Bright Data MCP │   │  Apify / Tavily / Stripe     │  │
│  │  (npx @brightdata│   │  External API calls          │  │
│  │   /mcp)          │   │                              │  │
│  └──────────────────┘   └──────────────────────────────┘  │
│                                                           │
│  ┌───────────────────────────────────────────────────┐   │
│  │              Supabase (PostgreSQL)                │   │
│  │  history · users · integrations · listings        │   │
│  └───────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────┘
```
---
## Tech Stack
### Frontend
| Technology | Version | Purpose |
|---|---|---|
| Next.js | 16.1.6 | Full-stack React framework |
| React | 19.2.4 | UI library |
| TypeScript | 5.7.3 | Type safety |
| Tailwind CSS | 4.2.0 | Utility-first styling |
| Radix UI | various | Accessible headless components |
| Shadcn/ui | — | Pre-built component library on top of Radix |
| React Hook Form + Zod | — | Form handling and validation |
| Stripe.js | 8.7.0 | Client-side payment integration |
| Supabase JS | 2.97.0 | Auth and DB client |
| Recharts | 2.15.0 | Usage charts |
| Vitest | 4.0.18 | Unit testing |
### Backend
| Technology | Version | Purpose |
|---|---|---|
| FastAPI | ≥0.115.0 | REST API server |
| Python | 3.11+ | Runtime |
| CrewAI | ≥0.86.0 | AI agent orchestration |
| CrewAI Tools (MCP) | ≥0.17.0 | Bright Data MCP integration |
| LiteLLM | ≥1.80.0 | Unified LLM interface |
| Uvicorn | ≥0.30.0 | ASGI server |
| Apify Client | ≥1.0.0 | People search / skip tracing |
| Tavily Python | ≥0.3.0 | Web search |
| Supabase Python | ≥2.0.0 | Database operations |
| Stripe Python | ≥5.0.0 | Payments |
| ReportLab | ≥4.0.0 | PDF export |
| BeautifulSoup4 | ≥4.12.0 | HTML parsing |
| httpx | ≥0.27.0 | Async HTTP client |
---
## API Connections & Environment Variables
Create a `.env` file in the **project root** (same directory as `package.json`). Both the Next.js app and the Python backend read from this file.
### 🔴 Required — Scraping & AI
| Variable | Where to Get It | Description |
|---|---|---|
| `BRIGHT_DATA_API_TOKEN` | [Bright Data → Account Settings → API Token](https://brightdata.com) | Authenticates the `@brightdata/mcp` MCP server used by CrewAI agents for proxy-powered browsing |
| `WEB_UNLOCKER_ZONE` | Bright Data dashboard → Proxies & Scraping → Web Unlocker → Zone name | Zone name for Bright Data's Web Unlocker product (e.g. `web_unlocker1`) |
| `BROWSER_ZONE` | Bright Data dashboard → Proxies & Scraping → Scraping Browser → Zone name | Zone name for Bright Data's Scraping Browser product (e.g. `scraping_browser1`) |
| `NEBIUS_API_KEY` | [Nebius AI Studio → API Keys](https://studio.nebius.ai) | API key for the Nebius LLM (Meta-Llama / Qwen models used by CrewAI and the chat agent) |
### 🟡 Required — Database & Auth
| Variable | Where to Get It | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project → Settings → API → Project URL | Public URL for Supabase (used by frontend client) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Project → Settings → API → anon key | Public anon key for Supabase (used by frontend client) |
| `SUPABASE_URL` | Same as above | Supabase URL for backend server-side calls |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Project → Settings → API → service_role key | Service role key for backend (bypasses RLS — keep secret) |
| `DATABASE_URL` | Supabase Project → Settings → Database → Connection string | Direct PostgreSQL connection string |
| `INTEGRATIONS_ENCRYPTION_KEY` | Generate a random 32+ char string | AES key used to encrypt user-provided API keys stored in `user_integrations` table |
### 🟡 Required — Payments
| Variable | Where to Get It | Description |
|---|---|---|
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | [Stripe Dashboard → Developers → API Keys](https://dashboard.stripe.com) | Publishable key for Stripe.js (frontend) |
| `STRIPE_SECRET_KEY` | Stripe Dashboard → Developers → API Keys | Secret key for server-side Stripe calls |
| `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard → Developers → Webhooks → Signing secret | Validates incoming Stripe webhook payloads |
### 🟢 Optional — Enhanced Features
| Variable | Where to Get It | Description |
|---|---|---|
| `NEBIUS_MODEL` | — | Override the default LLM model (e.g. `nebius/meta-llama/Meta-Llama-3.1-8B-Instruct` or `nebius/Qwen/Qwen3-235B-A22B`) |
| `NEXT_PUBLIC_API_BASE` | — | URL of the FastAPI backend as seen by the browser (e.g. `http://localhost:8000` for local dev, your Render URL in prod) |
| `NEXT_PUBLIC_WS_BASE` | — | WebSocket base URL (e.g. `localhost:8000` for local dev) |
| `TAVILY_API_KEY` | [Tavily → Dashboard → API Keys](https://tavily.com) | Enables AI-powered web search in the chat agent and `/api/tavily/search` endpoint |
| `APIFY_API_KEY` | [Apify → Settings → Integrations → API token](https://apify.com) | Enables people/skip-trace search via Apify actors |
| `APIFY_ID` | Apify console | Your Apify user/organization ID |
| `APIFY_DEFAULT_PEOPLE_TASK` | — | Apify actor/task slug for skip tracing (default: `one-api/skip-trace`) |
| `BRIGHT_DATA_REALTOR_DATASET_ID` | Bright Data → Data Marketplace | Optional dataset ID for pre-collected Realtor.com data (e.g. `gd_xxx`) |
| `BRIGHT_DATA_BROWSER_WS` | Bright Data → Scraping Browser → Access Parameters | WebSocket endpoint for direct browser connections |
| `STRIPE_PRICE_PRO_ID` | Stripe Dashboard → Products | Pre-created Price ID for Pro plan |
| `STRIPE_PRICE_ENTERPRISE_ID` | Stripe Dashboard → Products | Pre-created Price ID for Enterprise plan |
| `STRIPE_PRO_PRODUCT_ID` | Stripe Dashboard → Products | Product ID for Pro plan (backend creates Price on-the-fly if no Price ID given) |
| `STRIPE_ENTERPRISE_PRODUCT_ID` | Stripe Dashboard → Products | Product ID for Enterprise plan |
| `SCRAPERAPI_KEY` | [ScraperAPI](https://www.scraperapi.com) | Alternative scraping proxy (optional fallback) |
| `BROWSERACT_API_KEY` | [BrowserAct → Integrations & API → API Keys](https://www.browseract.com) | Legacy key from earlier BrowserAct integration (currently disabled in code) |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `SMTP_SECURE` | Your email provider | SMTP credentials for transactional email (password resets, notifications) |
### Quick `.env` Template
```env
# ── Supabase ──────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon_key>
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service_role_key>
DATABASE_URL=postgresql://postgres:<pass>@db.<project>.supabase.co:5432/postgres
INTEGRATIONS_ENCRYPTION_KEY=<random_32+_char_string>
# ── Bright Data ───────────────────────────────────
BRIGHT_DATA_API_TOKEN=<your_api_token>
WEB_UNLOCKER_ZONE=web_unlocker1
BROWSER_ZONE=scraping_browser1
BRIGHT_DATA_BROWSER_WS=wss://<user>:<pass>@brd.superproxy.io:9222
BRIGHT_DATA_REALTOR_DATASET_ID=   # optional
# ── Nebius AI (LLM) ───────────────────────────────
NEBIUS_API_KEY=<your_nebius_key>
NEBIUS_MODEL=nebius/meta-llama/Meta-Llama-3.1-8B-Instruct
# ── Stripe ────────────────────────────────────────
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_PRO_ID=price_...
STRIPE_PRICE_ENTERPRISE_ID=price_...
# ── Tavily (web search) ───────────────────────────
TAVILY_API_KEY=tvly_...
# ── Apify (people search) ─────────────────────────
APIFY_API_KEY=apify_api_...
APIFY_ID=<your_apify_id>
APIFY_DEFAULT_PEOPLE_TASK=one-api/skip-trace
# ── Frontend → Backend URL ────────────────────────
NEXT_PUBLIC_API_BASE=http://localhost:8000   # change to Render URL in prod
# ── Email (optional) ──────────────────────────────
SMTP_FROM=noreply@yourdomain.com
SMTP_HOST=smtp.yourdomain.com
SMTP_PORT=587
SMTP_USER=noreply@yourdomain.com
SMTP_PASS=<password>
SMTP_SECURE=false
```
---
## Database Schema
The project uses **Supabase (PostgreSQL)**. Run the migration files in `migrations/` in order:
| File | Purpose |
|---|---|
| `supabase_schema.sql` | Core tables: `user_profiles`, `people_searches`, `property_scrapes`, `chat_history`, `user_settings` |
| `002_add_bright_data_cache.sql` | `bright_data_cache` table for caching scraper results |
| `003_insert_albany_properties.sql` | Seed data for Albany, NY properties |
| `004_update_property_urls.sql` | Updates seed data URLs |
| `010_create_user_integrations.sql` | `user_integrations` table for encrypted per-user API keys |
| `020_create_listings.sql` | `listings` table for marketplace property listings |
| `021_create_alerts.sql` | `listing_alerts` table for user-defined search alerts |
| `022_create_alert_events.sql` | `alert_events` table for alert trigger history |
---
## Backend API Endpoints
Base URL: `http://localhost:8000` (local) or your Render deployment URL.
### Scraping
| Method | Path | Description |
|---|---|---|
| `POST` | `/api/scrape/start` | Start an async property scraping task; returns `{ task_id }` |
| `GET` | `/api/scrape/task/{task_id}/status` | Poll scraping task status and result |
| `GET` | `/api/scrape/task/{task_id}/stream` | SSE stream of live agent logs |
### Chat
| Method | Path | Description |
|---|---|---|
| `POST` | `/api/chat` | Send a message; agent auto-selects tools (scrape / people search / web search / chat) |
### People Search
| Method | Path | Description |
|---|---|---|
| `POST` | `/api/people-search/start-orchestrator` | Start a skip-trace search job; returns `{ task_id }` |
### History
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/history/property` | List property scrape history for a user |
| `GET` | `/api/history/people` | List people search history for a user |
| `GET` | `/api/history/chat` | List chat history for a user |
| `GET` | `/api/history/property/{id}/pdf` | Export a property scrape to PDF |
| `GET` | `/api/history/people/{id}/pdf` | Export a people search result to PDF |
### Usage
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/usage/searches` | Get usage counts and tier limits for a user |
### Settings & Environment
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/env-status` | Returns which required/optional env vars are set (no values) |
| `GET` | `/api/settings` | Get current app settings |
| `POST` | `/api/settings` | Update app settings (source toggles, dataset IDs, etc.) |
### Tavily Web Search
| Method | Path | Description |
|---|---|---|
| `POST` | `/api/tavily/search` | Run a Tavily web search; returns results array |
### Stripe
| Method | Path | Description |
|---|---|---|
| `POST` | `/api/stripe/checkout` | Create a Stripe Checkout session for Pro/Enterprise upgrade |
| `POST` | `/api/stripe/webhook` | Stripe webhook receiver (subscription lifecycle) |
---
## Project Structure
```
realestate-scraper-agents/
│
├── app/                          # Next.js App Router pages & API routes
│   ├── page.tsx                  # Landing page (hero, features, pricing)
│   ├── layout.tsx                # Root layout (auth & stripe providers)
│   ├── globals.css               # Global styles
│   ├── dashboard/
│   │   ├── page.tsx              # Main dashboard: chat interface
│   │   ├── history/              # Scrape & search history viewer
│   │   └── settings/             # Settings panel
│   ├── auth/                     # Login, signup, password reset pages
│   ├── market/                   # Real estate marketplace
│   ├── upgrade/                  # Subscription upgrade page
│   ├── settings/                 # App-level settings
│   ├── privacy/                  # Privacy policy
│   ├── terms/                    # Terms of service
│   └── api/                      # Next.js API routes (proxy → FastAPI or direct)
│       ├── integrations/         # User API key management
│       └── market/               # Marketplace listing endpoints
│
├── backend/                      # Python FastAPI backend
│   ├── main.py                   # App factory, routes, CORS, task management
│   ├── real_estate_agents.py     # CrewAI agent + Bright Data MCP for property scraping
│   ├── chat_agent.py             # Conversational agent with tool routing
│   ├── nebius_agent.py           # Nebius LLM wrapper with function calling
│   ├── stripe_api.py             # Stripe checkout & webhook router
│   ├── supabase_helper.py        # Database read/write helpers
│   ├── history_api.py            # History & PDF export router
│   ├── usage_api.py              # Usage tracking & tier enforcement router
│   ├── tavily_helper.py          # Tavily search wrapper
│   ├── get_real_images.py        # Image URL extraction utilities
│   ├── parse_public_records.py   # Public records HTML parser
│   ├── requirements.txt          # Python dependencies
│   └── pyproject.toml            # Python project metadata
│
├── components/                   # Reusable React components
│   ├── chat-panel.tsx            # Chat interface with SSE log streaming
│   ├── auth-provider.tsx         # Supabase auth context
│   ├── stripe-provider.tsx       # Stripe elements context
│   ├── hero-section.tsx          # Landing page hero
│   ├── pricing-section.tsx       # Pricing cards
│   ├── navbar.tsx                # Navigation bar
│   ├── footer.tsx                # Footer
│   └── ui/                       # 100+ Shadcn/Radix UI primitives
│
├── hooks/
│   └── use-toast.ts              # Toast notification hook
│
├── lib/
│   ├── crypto.ts                 # AES encryption/decryption for API key storage
│   ├── utils.ts                  # cn() and other utilities
│   ├── adapters.ts               # Data shape adapters
│   └── notify.ts                 # Notification helpers
│
├── migrations/                   # SQL migration files (run against Supabase)
├── styles/                       # Additional CSS
│
├── .env.local.example            # Full environment variable template
├── ENV.md                        # Environment variable reference
├── next.config.mjs               # Next.js config
├── tailwind.config.ts            # Tailwind config
├── tsconfig.json                 # TypeScript config
├── package.json                  # Frontend dependencies & scripts
├── vitest.config.ts              # Vitest test config
├── build.sh                      # Build script (installs all dependencies)
├── render.yaml                   # Render.com deployment config
└── vercel.json                   # Vercel deployment config
```
---
## Getting Started
### Prerequisites
- Node.js 18+ and npm
- Python 3.11+
- A Supabase project (free tier works for dev)
- A Bright Data account with Web Unlocker and Scraping Browser zones
- A Nebius AI API key
### 1. Clone & Install
```bash
git clone https://github.com/coinvest518/realestate-scraper-agents.git
cd realestate-scraper-agents
# Install frontend dependencies
npm install
# Install backend dependencies
cd backend && pip install -r requirements.txt && cd ..
```
### 2. Configure Environment
```bash
cp .env.local.example .env
# Edit .env and fill in all required variables (see table above)
```
### 3. Run Database Migrations
In your Supabase SQL editor (or via `psql`), run the files in `migrations/` in numerical order, starting with `supabase_schema.sql`.
### 4. Start the Backend
```bash
cd backend
uvicorn main:app --reload --port 8000
```
### 5. Start the Frontend
```bash
# From project root
npm run dev
# Open http://localhost:3000
```
### 6. (Optional) Set Up Stripe Webhooks
For local development, use the [Stripe CLI](https://stripe.com/docs/stripe-cli) to forward webhooks:
```bash
stripe listen --forward-to http://localhost:8000/api/stripe/webhook
```
Copy the printed signing secret into `STRIPE_WEBHOOK_SECRET` in your `.env`.
---
## Deployment
### Frontend → Vercel
1. Import the repository in [Vercel](https://vercel.com).
2. Set all `NEXT_PUBLIC_*` and server-side env vars in Project Settings → Environment Variables.
3. Set `NEXT_PUBLIC_API_BASE` to your Render backend URL.
### Backend → Render
The `render.yaml` file defines the Render service. Key settings:
- **Runtime**: Python 3
- **Build Command**: `pip install -r backend/requirements.txt`
- **Start Command**: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
- Set all backend env vars in the Render dashboard.
### Stripe Webhooks (Production)
Register your Render URL as a webhook endpoint in the Stripe dashboard:
`https://<your-render-url>/api/stripe/webhook`
Select at minimum these events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`.
