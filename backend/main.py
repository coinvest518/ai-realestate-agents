"""
FastAPI backend for AgentScrape dashboard.
- POST /api/scrape – run real estate agent on a listing URL
- GET /api/env-status – which env vars are set (no values)
"""
import json
import os
import re
import time
import threading
from contextlib import asynccontextmanager
from uuid import uuid4

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl
from tavily_helper import tavily_search
from history_api import router as history_router
from usage_api import router as usage_router
from stripe_api import router as stripe_router

# Load .env from project root
from dotenv import load_dotenv
root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
env_path = os.path.join(root_dir, ".env")
load_dotenv(env_path)

# In-memory settings (persist to DB later). Defaults pulled from environment where appropriate.
SETTINGS = {
    "sources": {"zillow": True, "realtor": True, "redfin": True},
    "bright_data_realtor_dataset_id": os.getenv("BRIGHT_DATA_REALTOR_DATASET_ID"),
    "use_dataset_for_realtor": bool(os.getenv("BRIGHT_DATA_REALTOR_DATASET_ID")),
    # keep BrowserAct env name but integration removed from code
    "browseract_profiles": {},
    "disable_browseract": True,  # default to True since BrowserAct removed
}

APIFY_BASE = "https://api.apify.com/v2"

# Background tasks and logs
TASKS: dict = {}
# TASKS[task_id] = { status: 'pending'|'running'|'finished'|'failed', logs: [str], result: any }


def _normalize_image_urls_field(data):
    if not data or "image_urls" not in data:
        return
    v = data.get("image_urls")
    try:
        if isinstance(v, list):
            cleaned = [s for s in v if isinstance(s, str) and s.startswith("http")]
            data["image_urls"] = list(dict.fromkeys(cleaned)) if cleaned else data.pop("image_urls", None)
            return
        if isinstance(v, str):
            try:
                parsed = json.loads(v)
                if isinstance(parsed, list):
                    cleaned = [s for s in parsed if isinstance(s, str) and s.startswith("http")]
                    data["image_urls"] = list(dict.fromkeys(cleaned)) if cleaned else data.pop("image_urls", None)
                    return
            except Exception:
                pass
            parts = [p.strip() for p in re.split(r"[,\n\\s]+", v) if p.strip()]
            parts = [p for p in parts if p.startswith("http")]
            data["image_urls"] = list(dict.fromkeys(parts)) if parts else data.pop("image_urls", None)
            return
    except Exception:
        data.pop("image_urls", None)


REQUIRED_ENV = [
    "BRIGHT_DATA_API_TOKEN",
    "WEB_UNLOCKER_ZONE",
    "BROWSER_ZONE",
    "NEBIUS_API_KEY",
]
OPTIONAL_ENV = [
    "NEBIUS_MODEL",
    "BROWSERACT_API_KEY",
    "DATABASE_URL",
    "SUPABASE_URL",
    "SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
]


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


app = FastAPI(title="AgentScrape API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include history, usage, and stripe routers
app.include_router(history_router)
app.include_router(usage_router)
app.include_router(stripe_router)


# ---------------- General LLM Chat endpoint ----------------
@app.post("/api/chat")
async def chat_endpoint(request: Request):
    body = await request.json()
    prompt = (body.get("prompt") or body.get("message") or "").strip()
    conversation_history = body.get("history", [])
    user_id = request.headers.get("x-user-id")
    
    if not prompt:
        raise HTTPException(status_code=400, detail="Missing prompt")
    
    try:
        from nebius_agent import chat_with_nebius_agent
        response = chat_with_nebius_agent(prompt, conversation_history, user_id=user_id)
        return {"response": response}
    except Exception as e:
        print(f"/api/chat: Nebius agent error: {e}")
        pass
    
    low = prompt.lower()
    if re.match(r'^(hi|hello|hey|yo|sup|good\s+morning|good\s+afternoon|good\s+evening)\b', low):
        return {"response": "Hi — how can I help you today?"}
    
    return {"response": "I can help you with people searches, property scraping, and general questions. What would you like to do?"}


class ScrapeRequest(BaseModel):
    url: HttpUrl


class EnvStatusItem(BaseModel):
    name: str
    set: bool
    required: bool


@app.get("/api/env-status")
def get_env_status():
    result = []
    for name in REQUIRED_ENV:
        result.append(EnvStatusItem(name=name, set=bool(os.getenv(name)), required=True))
    for name in OPTIONAL_ENV:
        result.append(EnvStatusItem(name=name, set=bool(os.getenv(name)), required=False))
    return {"env": result, "ready": all(os.getenv(n) for n in REQUIRED_ENV)}


# ---------------- Settings endpoints (simple in-memory store) ----------------
@app.get("/api/settings")
def get_settings():
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if supabase_url and supabase_key:
        try:
            import httpx
            r = httpx.get(f"{supabase_url}/rest/v1/user_settings?id=eq.default", headers={
                "apikey": supabase_key,
                "Authorization": f"Bearer {supabase_key}",
            }, timeout=10.0)
            if r.status_code == 200 and r.json():
                row = r.json()[0]
                data = row.get("data") or {}
                merged = {**SETTINGS, **(data if isinstance(data, dict) else {})}
                return {
                    "sources": merged.get("sources", {}),
                    "bright_data_realtor_dataset_id": merged.get("bright_data_realtor_dataset_id"),
                    "use_dataset_for_realtor": merged.get("use_dataset_for_realtor", False),
                    "disable_browseract": merged.get("disable_browseract", True),
                }
        except Exception:
            pass
    return {
        "sources": SETTINGS.get("sources", {}),
        "bright_data_realtor_dataset_id": SETTINGS.get("bright_data_realtor_dataset_id"),
        "use_dataset_for_realtor": SETTINGS.get("use_dataset_for_realtor", False),
        "user_api_keys": SETTINGS.get("user_api_keys", {}),
        "browseract_profiles": SETTINGS.get("browseract_profiles", {}),
        "disable_browseract": SETTINGS.get("disable_browseract", True),
    }


@app.post("/api/settings")
def post_settings(body: dict):
    sources = body.get("sources")
    if isinstance(sources, dict):
        SETTINGS["sources"].update({k: bool(v) for k, v in sources.items()})
    if "bright_data_realtor_dataset_id" in body:
        SETTINGS["bright_data_realtor_dataset_id"] = body.get("bright_data_realtor_dataset_id")
    if "use_dataset_for_realtor" in body:
        SETTINGS["use_dataset_for_realtor"] = bool(body.get("use_dataset_for_realtor"))
    if "user_api_keys" in body and isinstance(body.get("user_api_keys"), dict):
        SETTINGS["user_api_keys"] = {k: v for k, v in body.get("user_api_keys").items()}
    if "disable_browseract" in body:
        # keep the flag but BrowserAct is removed; allow UI to toggle for compatibility
        SETTINGS["disable_browseract"] = bool(body.get("disable_browseract"))
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if supabase_url and supabase_key:
        try:
            import httpx
            payload = {"id": "default", "data": SETTINGS}
            httpx.post(f"{supabase_url}/rest/v1/user_settings?on_conflict=id", json=payload, headers={
                "apikey": supabase_key,
                "Authorization": f"Bearer {supabase_key}",
                "Prefer": "return=representation",
                "Content-Type": "application/json",
            }, timeout=10.0)
        except Exception:
            pass
    return {"ok": True, "settings": get_settings()}


# ---------------- Bright Data dataset trigger (example usage) ----------------
def _brightdata_trigger_dataset(dataset_id: str, inputs: list, params: dict | None = None):
    token = os.getenv("BRIGHT_DATA_API_TOKEN")
    if not token:
        raise HTTPException(status_code=503, detail="BRIGHT_DATA_API_TOKEN not set")
    params = params or {}
    url = f"https://api.brightdata.com/datasets/v3/trigger?dataset_id={dataset_id}&include_errors=true"
    if params:
        for k, v in params.items():
            url += f"&{k}={v}"
    import httpx
    try:
        with httpx.Client(timeout=120.0) as client:
            r = client.post(url, json=inputs, headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"})
            r.raise_for_status()
            return r.json()
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail=e.response.text or str(e))
    except Exception as e:
        raise HTTPException(status_code=503, detail=str(e))


@app.post("/api/datasets/trigger")
def trigger_dataset(body: dict):
    inputs = body.get("inputs")
    if not isinstance(inputs, list) or not inputs:
        raise HTTPException(status_code=400, detail="`inputs` (non-empty list) is required")
    dataset_id = body.get("dataset_id") or SETTINGS.get("bright_data_realtor_dataset_id")
    if not dataset_id:
        raise HTTPException(status_code=400, detail="dataset_id not provided and BRIGHT_DATA_REALTOR_DATASET_ID not set")
    params = body.get("params") or {}
    return _brightdata_trigger_dataset(dataset_id, inputs, params)


# ---------------- Asynchronous / streaming scrape API ----------------
@app.post('/api/scrape/start')
def start_scrape(body: ScrapeRequest, use_dataset: bool = False):
    url = str(body.url)
    if not url:
        raise HTTPException(status_code=400, detail='url is required')
    task_id = uuid4().hex
    TASKS[task_id] = {"status": "pending", "logs": [], "result": None}

    def _log(tid, msg):
        TASKS[tid]["logs"].append(f"{time.strftime('%H:%M:%S')} - {msg}")

    def worker(tid, u, use_dataset_flag):
        TASKS[tid]["status"] = "running"
        _log(tid, f"Task started for {u}")
        try:
            host = u.lower()
            dataset_id = SETTINGS.get("bright_data_realtor_dataset_id")
            
            # Check cache first
            from supabase_helper import get_cached_bright_data, cache_bright_data_result
            cached = get_cached_bright_data(u)
            if cached:
                _log(tid, "Found cached result")
                TASKS[tid]['result'] = {"success": True, "data": cached, "source": "cache"}
                TASKS[tid]["status"] = "finished"
                return
            
            if "realtor.com" in host and (use_dataset_flag or SETTINGS.get("use_dataset_for_realtor")) and dataset_id:
                _log(tid, f"Triggering Bright Data dataset {dataset_id} for URL")
                resp = _brightdata_trigger_dataset(dataset_id, [{"url": u}], params={"type": "collect", "discover_by": "url"})
                result_data = {"success": True, "data": resp, "source": "brightdata_dataset"}
                cache_bright_data_result(u, resp)
                TASKS[tid]["result"] = result_data
                _log(tid, "Dataset run started and cached")
                TASKS[tid]["status"] = "finished"
                return

            _log(tid, "Running CrewAI scraping agent...")
            from real_estate_agents import scrape_property_data
            _log(tid, "Connecting to MCP server and LLM — this may take a few seconds...")
            result = scrape_property_data(u)
            _log(tid, "Agent finished — processing output")
            text = str(result.raw) if hasattr(result, "raw") else str(result)
            json_match = re.search(r"```(?:json)?\s*([\s\S]*?)```", text)
            if json_match:
                text = json_match.group(1).strip()
            try:
                data = json.loads(text)
            except Exception:
                data = {"raw_output": text}
            try:
                _normalize_image_urls_field(data)
            except Exception:
                pass
            imgs = []
            imgs += re.findall(r"https?://photos\.zillowstatic\.com/[^\s'\"]+", text)
            imgs += re.findall(r'https?://\S+\.(?:jpg|jpeg|png|webp)(?:\?\S*)?', text)
            imgs += re.findall(r"<img[^>]+src=[\\'\"]([^\\'\"]+)[\\'\"]", text)
            imgs = [x for x in imgs if x.startswith('http')]
            seen = set()
            imgs = [x for x in imgs if not (x in seen or seen.add(x))]
            if imgs and not data.get('image_urls'):
                data['image_urls'] = imgs
            cache_bright_data_result(u, data)
            TASKS[tid]['result'] = {"success": True, "data": data, "raw_preview": text[:500]}
            _log(tid, 'Scrape result ready and cached')
            TASKS[tid]["status"] = "finished"
        except Exception as e:
            TASKS[tid]["status"] = "failed"
            TASKS[tid]["result"] = {"success": False, "error": str(e)}
            _log(tid, f"Error: {str(e)}")

    thread = threading.Thread(target=worker, args=(task_id, url, use_dataset), daemon=True)
    thread.start()
    return {"task_id": task_id}


@app.get('/api/scrape/task/{task_id}/status')
def scrape_task_status(task_id: str):
    t = TASKS.get(task_id)
    if not t:
        raise HTTPException(status_code=404, detail='task not found')
    return {"status": t['status'], "has_result": bool(t.get('result'))}


@app.get('/api/scrape/task/{task_id}/logs')
def scrape_task_logs(task_id: str, from_index: int = 0):
    t = TASKS.get(task_id)
    if not t:
        raise HTTPException(status_code=404, detail='task not found')
    logs = t.get('logs', [])
    return {"logs": logs[from_index:], "next_index": len(logs), "status": t['status']}


from fastapi.responses import StreamingResponse

@app.get('/api/scrape/task/{task_id}/stream')
def scrape_task_stream(task_id: str):
    if task_id not in TASKS:
        raise HTTPException(status_code=404, detail='task not found')

    def event_generator():
        last = 0
        while True:
            t = TASKS.get(task_id)
            if not t:
                break
            logs = t.get('logs', [])
            while last < len(logs):
                line = logs[last]
                yield f"data: {json.dumps({'line': line})}\n\n"
                last += 1
            if t['status'] in ('finished', 'failed'):
                yield f"event: done\ndata: {json.dumps({'status': t['status'], 'result': t.get('result')})}\n\n"
                break
            time.sleep(0.5)

    return StreamingResponse(event_generator(), media_type='text/event-stream')


# ---------------- Orchestrator: Apify-first -> ScraperAPI fallback ----------------
class PeopleSearchRequest(BaseModel):
    people_name: str
    data_limit: int = 5
    proxy_region: str | None = "US"
    save_browser_data: bool | None = False
    template_hint: str | None = None


def _append_task_log(tid: str, msg: str):
    TASKS.setdefault(tid, {})
    TASKS[tid].setdefault("logs", []).append(f"{time.strftime('%H:%M:%S')} - {msg}")


class ApifyRunRequest(BaseModel):
    task_id: str
    input: dict | None = None
    wait_for_finish: bool = False
    fetch_dataset: bool = False


def _run_people_search_orchestration(body: PeopleSearchRequest, log_fn=None, timeout: int = 120, user_id: str = None):
    def _log(m: str):
        if callable(log_fn):
            try:
                log_fn(m)
            except Exception:
                pass

    apify_task_slug = os.getenv('APIFY_DEFAULT_PEOPLE_TASK') or 'one-api/skip-trace'
    if os.getenv('APIFY_API_KEY'):
        _log(f"Calling Apify actor '{apify_task_slug}'...")
        try:
            apify_input = {'name': [body.people_name], 'max_results': body.data_limit}
            apify_req = ApifyRunRequest(task_id=apify_task_slug, input=apify_input, wait_for_finish=True, fetch_dataset=True)
            apify_res = apify_run_task(apify_req)
            _log(f"Apify response received")
            items = apify_res.get('items', []) if isinstance(apify_res, dict) else []
            if items:
                _log(f"Apify returned {len(items)} results")
                # Auto-save to Supabase
                if user_id:
                    try:
                        from supabase_helper import save_people_search
                        save_people_search(user_id, body.people_name, {'items': items}, 'apify')
                    except Exception as e:
                        print(f"Error saving to Supabase: {e}")
                return {'ok': True, 'source': 'apify', 'result': {'items': items, 'dataset_id': apify_res.get('dataset_id')}}
            else:
                _log(f"Apify returned no results")
                return {'ok': False, 'reason': 'no_results', 'tried': [{'source': 'apify', 'response': apify_res}]}
        except Exception as e:
            _log(f"Apify error: {e}")
            return {'ok': False, 'reason': 'apify_error', 'error': str(e), 'tried': [{'source': 'apify_error', 'error': str(e)}]}

    return {'ok': False, 'reason': 'no_apify_key', 'tried': []}


@app.post('/api/people-search/start-orchestrator')
def people_search_start_orchestrator(body: PeopleSearchRequest, request: Request):
    task_id = uuid4().hex
    TASKS[task_id] = {"status": "running", "logs": [], "result": None}
    
    # Extract user_id from Authorization header (if present)
    user_id = None
    auth_header = request.headers.get('Authorization')
    if auth_header and auth_header.startswith('Bearer '):
        # TODO: Verify JWT token and extract user_id
        # For now, accept any user_id from header
        user_id = request.headers.get('X-User-ID')

    def worker():
        try:
            def _log(m: str):
                _append_task_log(task_id, m)

            res = _run_people_search_orchestration(body, log_fn=_log, user_id=user_id)
            TASKS[task_id]["result"] = res
            TASKS[task_id]["status"] = "finished" if res.get('ok') else "failed"
            _append_task_log(task_id, f"Orchestrator finished: ok={res.get('ok', False)} source={res.get('source') or res.get('reason')}")
        except Exception as e:
            TASKS[task_id]["status"] = "failed"
            TASKS[task_id]["result"] = {"ok": False, "error": str(e)}
            _append_task_log(task_id, f"Orchestrator error: {e}")

    thread = threading.Thread(target=worker, daemon=True)
    thread.start()
    return {"task_id": task_id}


# ---------------- Apify Actor integration ----------------
def _apify_token():
    token = os.getenv("APIFY_API_KEY")
    if not token:
        raise HTTPException(status_code=503, detail="APIFY_API_KEY not set. Add it to .env to enable Apify integration.")
    return token


@app.post('/api/apify/run-task')
def apify_run_task(body: ApifyRunRequest):
    token = _apify_token()
    task_id = body.task_id
    try:
        from apify_client import ApifyClient
        client = ApifyClient(token)
        actor_client = client.actor(task_id)
        
        if body.wait_for_finish and body.fetch_dataset:
            call_result = actor_client.call(run_input=body.input or {})
            dataset_id = call_result.get('defaultDatasetId') if isinstance(call_result, dict) else None
            items = []
            if dataset_id:
                try:
                    dataset_client = client.dataset(dataset_id)
                    list_result = dataset_client.list_items()
                    if isinstance(list_result, dict) and 'items' in list_result:
                        items = list_result.get('items')
                    elif hasattr(list_result, 'items'):
                        items = getattr(list_result, 'items')
                    else:
                        items = list_result
                except Exception:
                    items = []
            return {"items": items, "dataset_id": dataset_id, "call_result": call_result}

        if body.wait_for_finish:
            call_result = actor_client.call(run_input=body.input or {})
            return {"call_result": call_result}

        run = actor_client.start(run_input=body.input or {})
        return {"run": run}

    except Exception:
        import httpx
        try:
            with httpx.Client(timeout=120.0) as client:
                if body.wait_for_finish and body.fetch_dataset:
                    r = client.post(f"{APIFY_BASE}/actor-tasks/{task_id}/run-sync-get-dataset-items?token={token}", json=body.input or {})
                    r.raise_for_status()
                    return r.json()

                if body.wait_for_finish:
                    r = client.post(f"{APIFY_BASE}/actor-tasks/{task_id}/run-sync?token={token}", json=body.input or {})
                    r.raise_for_status()
                    return r.json()

                r = client.post(f"{APIFY_BASE}/actor-tasks/{task_id}/runs?token={token}", json={"body": body.input} if body.input else {})
                r.raise_for_status()
                data = r.json()
                return {"run": data}
        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=e.response.status_code, detail=e.response.text or str(e))
        except Exception as e:
            raise HTTPException(status_code=503, detail=str(e))


@app.get('/api/apify/run/{run_id}')
def apify_get_run(run_id: str):
    import httpx
    token = _apify_token()
    try:
        with httpx.Client(timeout=30.0) as client:
            r = client.get(f"{APIFY_BASE}/runs/{run_id}?token={token}")
            r.raise_for_status()
            return r.json()
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail=e.response.text or str(e))
    except Exception as e:
        raise HTTPException(status_code=503, detail=str(e))


@app.get('/api/apify/run/{run_id}/dataset')
def apify_run_dataset(run_id: str, limit: int = 100):
    import httpx
    token = _apify_token()
    try:
        with httpx.Client(timeout=30.0) as client:
            r = client.get(f"{APIFY_BASE}/runs/{run_id}?token={token}")
            r.raise_for_status()
            run = r.json()
            dataset_id = run.get('defaultDatasetId')
            if not dataset_id:
                raise HTTPException(status_code=404, detail='No dataset associated with run')
            items_r = client.get(f"{APIFY_BASE}/datasets/{dataset_id}/items?limit={limit}&token={token}")
            items_r.raise_for_status()
            return {"items": items_r.json(), "dataset_id": dataset_id}
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail=e.response.text or str(e))
    except Exception as e:
        raise HTTPException(status_code=503, detail=str(e))


@app.get('/api/apify/task/{task_id}/last')
def apify_task_last_run(task_id: str):
    import httpx
    token = _apify_token()
    try:
        with httpx.Client(timeout=30.0) as client:
            r = client.get(f"{APIFY_BASE}/actor-tasks/{task_id}/runs?limit=1&token={token}")
            r.raise_for_status()
            data = r.json()
            items = data.get('items') or []
            if not items:
                return {"last": None}
            return {"last": items[0]}
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail=e.response.text or str(e))
    except Exception as e:
        raise HTTPException(status_code=503, detail=str(e))


# Market data endpoint - fetch sample properties
@app.get("/api/market/properties")
def get_market_properties(limit: int = 20, offset: int = 0):
    """Fetch market properties from Supabase cache"""
    from supabase_helper import get_supabase
    supabase = get_supabase()
    
    if not supabase:
        print("ERROR: Supabase not initialized")
        return {"properties": [], "total": 0}
    
    # Unsplash house images for placeholders
    UNSPLASH_HOUSES = [
        'photo-1568605114967-8130f3a36994',
        'photo-1570129477492-45c003edd2be',
        'photo-1600596542815-ffad4c1539a9',
        'photo-1600585154340-be6161a56a0c',
        'photo-1605276374104-dee2a0ed3cd6',
        'photo-1564013799919-ab600027ffc6',
    ]
    
    def has_valid_images(urls):
        if not urls or not isinstance(urls, list) or len(urls) == 0:
            return False
        for url in urls:
            if not isinstance(url, str) or not url.startswith('http'):
                return False
            if any(x in url.lower() for x in ['abcdef', 'xyz123', 'example', '-1.jpg', '-2.jpg', 'clinton-ave', 'russell-rd', 'pine-ave', 'arcadia-ct', 'bryn-mawr', 'eileen-st', 'hackett-blvd', 'fairway-ct', 'everett-rd']):
                return False
        return True
    
    def generate_placeholder_images(index):
        photo_id = UNSPLASH_HOUSES[index % len(UNSPLASH_HOUSES)]
        return [
            f"https://images.unsplash.com/{photo_id}?w=800&h=600&fit=crop",
            f"https://images.unsplash.com/{photo_id}?w=800&h=600&fit=crop&sat=-20",
            f"https://images.unsplash.com/{photo_id}?w=800&h=600&fit=crop&brightness=5",
        ]
    
    try:
        response = supabase.table('bright_data_cache').select('property_url, property_data, cached_at').order('cached_at', desc=True).range(offset, offset + limit - 1).execute()
        
        if response.data:
            properties = []
            for idx, row in enumerate(response.data):
                data = row.get('property_data', {})
                image_urls = data.get('image_urls', [])
                
                if not has_valid_images(image_urls):
                    image_urls = generate_placeholder_images(idx)
                
                properties.append({
                    'id': row.get('property_url', '').split('/')[-1],
                    'url': row.get('property_url'),
                    'address': data.get('address', 'N/A'),
                    'city': data.get('city', ''),
                    'state': data.get('state', ''),
                    'zip': data.get('zip', ''),
                    'price': data.get('price'),
                    'beds': data.get('beds'),
                    'baths': data.get('baths'),
                    'sqft': data.get('sqft') or data.get('square_feet'),
                    'image_urls': image_urls,
                    'description': data.get('description', ''),
                    'source': data.get('source', 'unknown'),
                    'cached_at': row.get('cached_at')
                })
            return {"properties": properties, "total": len(properties), "limit": limit, "offset": offset}
        return {"properties": [], "total": 0}
    except Exception as e:
        print(f"Error: {e}")
        return {"properties": [], "total": 0}


@app.get("/")
def root():
    return {"service": "AgentScrape API", "docs": "/docs"}


# ---------------- Tavily API endpoints ----------------
class TavilySearchRequest(BaseModel):
    query: str
    max_results: int = 5


@app.post('/api/tavily/search')
def tavily_search_endpoint(body: TavilySearchRequest):
    """Web search using Tavily AI-optimized search."""
    return tavily_search(body.query, body.max_results)
