# ai-realestate-agents
Comprehensive Repository Summary
1. PROJECT OVERVIEW
AI-Realestate-Agents is a full-stack SaaS platform that uses AI agents to scrape real estate property listings, search for people's contact information, and perform web searches. It features a Next.js frontend dashboard paired with a Python FastAPI backend powered by CrewAI agents and LLM integrations.

2. MAIN FUNCTIONALITY
Property Scraping: Extract structured real estate data (price, bedrooms, bathrooms, images, etc.) from Zillow, Realtor.com, and Redfin using AI agents
People Search: Find contact information (phone, email, address) for individuals using skip-tracing services
Web Search: AI-powered web search with Tavily integration
Chat Interface: Conversational AI assistant that intelligently decides whether to use tools or just chat
User Authentication & Management: Supabase-based auth with user profiles and integrations
Subscription Management: Stripe integration for Pro and Enterprise tiers
History & Analytics: Auto-save searches, scrapes, and chat history with usage tracking
Real Estate Marketplace: Browse and display property listings from multiple sources
3. TECHNOLOGY STACK
Frontend:

Next.js 16.1.6 with React 19.2.4
TypeScript 5.7.3
Tailwind CSS 4.2.0
Radix UI components
React Hook Form + Zod validation
Stripe.js for payments
Recharts for visualizations
Backend:

FastAPI (Python)
CrewAI (AI agents framework)
Nebius LLM (Meta-Llama-3.1-8B-Instruct)
Supabase (PostgreSQL + auth)
Stripe API
Tavily API (web search)
Bright Data MCP (web scraping via Model Context Protocol)
Apify (skip tracing/people search)
ReportLab (PDF generation)
4. API INTEGRATIONS & EXTERNAL SERVICES
Service	Purpose	Environment Variable
Bright Data	Web scraping with proxy rotation	BRIGHT_DATA_API_TOKEN, WEB_UNLOCKER_ZONE, BROWSER_ZONE
Nebius AI	LLM for agent reasoning	NEBIUS_API_KEY, NEBIUS_MODEL
Supabase	Database + authentication	SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
Stripe	Payment processing	STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
Tavily	AI-optimized web search	TAVILY_API_KEY
Apify	People search/skip tracing	APIFY_API_KEY
BrowserAct	Contact extraction (optional)	BROWSERACT_API_KEY
5. CONFIGURATION & ENVIRONMENT VARIABLES
Required:

BRIGHT_DATA_API_TOKEN - Bright Data API authentication
WEB_UNLOCKER_ZONE - Bright Data Web Unlocker zone name
BROWSER_ZONE - Bright Data Browser zone name
NEBIUS_API_KEY - Nebius AI LLM API key
Optional:

NEBIUS_MODEL - Custom LLM model (defaults to Meta-Llama-3.1-8B)
DATABASE_URL - PostgreSQL connection string
STRIPE_PRICE_PRO_ID, STRIPE_PRICE_ENTERPRISE_ID - Stripe pricing IDs
NEXT_PUBLIC_API_BASE - Backend URL for frontend (e.g., http://localhost:8000)
See ENV.md for complete list.

6. PROJECT STRUCTURE
Code
realestate-scraper-agents/
├── app/                          # Next.js frontend
│   ├── page.tsx                  # Landing page (hero, features, pricing)
│   ├── layout.tsx                # Root layout with auth & stripe providers
│   ├── dashboard/                # Main dashboard pages
│   │   ├── page.tsx              # Chat interface
│   │   ├── history/              # Search/scrape history
│   │   ├── settings.tsx          # Settings panel
│   ├── auth/                     # Authentication pages (login, signup, pwd reset)
│   ├── api/                      # Next.js API routes
│   │   ├── integrations/         # User integration management
│   │   ├── market/               # Marketplace listings
│   └── [other routes]            # Upgrade, privacy, terms, etc.
│
├── backend/                       # Python FastAPI backend
│   ├── main.py                   # Main API server with chat, scraping, people search
│   ├── real_estate_agents.py     # CrewAI agents for property scraping
│   ├── chat_agent.py             # Conversational chat agent with tools
│   ├── nebius_agent.py           # Nebius LLM with function calling
│   ├── stripe_api.py             # Stripe checkout & webhook handling
│   ├── supabase_helper.py        # Database operations
│   ├── tavily_helper.py          # Web search integration
│   ├── history_api.py            # Search/scrape history & PDF export
│   ├── usage_api.py              # Usage tracking & tier management
│   ├── get_real_images.py        # Image extraction utilities
│   └── parse_public_records.py   # Public records parsing
│
├── components/                    # Reusable React components
│   ├── chat-panel.tsx            # Chat interface component
│   ├── auth-provider.tsx         # Auth context provider
│   ├── stripe-provider.tsx       # Stripe context provider
│   ├── ui/                       # Shadcn UI components (100+ components)
│   └── [feature components]      # Hero, pricing, navbar, footer, etc.
│
├── hooks/                         # Custom React hooks
│   └── use-toast.ts              # Toast notifications
│
├── lib/                           # Utilities
│   ├── crypto.ts                 # Encryption/decryption for API keys
│   ├── supabase_helper.py        # DB operations
│   ├── notify.ts                 # Notification utilities
│   └── utils.ts, adapters.ts     # Helper functions
│
├── migrations/                    # Database migrations (Supabase)
│   ├── supabase_schema.sql       # Main schema
│   ├── 010_create_user_integrations.sql
│   ├── 020_create_listings.sql
│   └── [other migrations]
│
├── styles/                        # Tailwind CSS & global styles
├── tailwind.config.ts            # Tailwind configuration
├── next.config.mjs               # Next.js configuration
├── tsconfig.json                 # TypeScript configuration
├── package.json                  # Frontend dependencies
├── vitest.config.ts              # Testing configuration
└── .env.local.example            # Environment template
7. KEY BACKEND API ENDPOINTS
Chat & Scraping:

POST /api/chat - Chat with AI agent (with tool calling)
POST /api/scrape/start - Start property scraping task
GET /api/scrape/task/{task_id}/status - Get scraping task status
GET /api/scrape/task/{task_id}/stream - Stream scraping logs
People Search:

POST /api/people-search/start-orchestrator - Start people search
GET /api/history/people - Get search history
Settings & Configuration:

GET /api/env-status - Check environment variable status
GET /api/settings - Get app settings
POST /api/settings - Update settings
Stripe Integration:

POST /api/stripe/checkout - Create checkout session
POST /api/stripe/webhook - Handle webhook events
Other:

GET /api/history/property - Property scrape history
POST /api/tavily/search - Web search endpoint
GET /api/market/properties - Marketplace listings
GET /api/usage/searches - Usage tracking
8. ENTRY POINTS & STARTUP
Frontend:

bash
npm run dev              # Local dev (http://localhost:3000)
npm run build           # Production build
npm start               # Start production server
npm test                # Run tests with Vitest
Backend:

bash
cd backend && uvicorn main:app --reload --port 8000
Deployment:

Frontend: Vercel (Next.js)
Backend: Render.com (Python/FastAPI)
9. DATABASE SCHEMA (Supabase PostgreSQL)
Key Tables:

user_profiles - User account data
user_integrations - Encrypted API keys for integrations
people_searches - Search history
property_scrapes - Scraping history with property data
chat_history - Conversation history
listings - Real estate marketplace
bright_data_cache - Cached scraping results
user_settings - App settings per user
10. README & DOCUMENTATION
README.md: High-level project overview
ENV.md: Detailed environment variable documentation
build.sh: Build script for installing dependencies
render.yaml: Render deployment configuration
11. KEY FEATURES SUMMARY
✅ AI-powered property data extraction from major real estate sites
✅ Skip-tracing for contact information lookup
✅ Intelligent chat interface with tool calling
✅ User authentication & subscription management (Stripe)
✅ Complete search/scrape history with PDF export
✅ Real estate marketplace
✅ Multi-source support (Zillow, Realtor, Redfin)
✅ Bright Data proxy integration for anti-scraping bypass
✅ Responsive UI with Tailwind CSS & Shadcn components
✅ Usage tracking & free trial management

This is a production-ready SaaS platform with full-stack capabilities for real estate data automation.
