from fastapi import APIRouter, Header, HTTPException
from typing import Optional
from supabase_helper import get_supabase
import json

router = APIRouter()

@router.post("/api/usage/track")
async def track_usage(body: dict, x_user_id: Optional[str] = Header(None)):
    """Track user's search/scrape usage"""
    if not x_user_id:
        raise HTTPException(status_code=401, detail="User ID required")
    
    try:
        supabase = get_supabase()
        if not supabase:
            raise HTTPException(status_code=500, detail="Database not initialized")
        
        usage_type = body.get("type", "search")  # 'scrape', 'people_search'
        
        # Log usage in database
        supabase.table("usage_logs").insert({
            "user_id": x_user_id,
            "usage_type": usage_type
        }).execute()
        
        return {"success": True, "message": "Usage tracked"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/usage/searches")
async def get_search_usage(x_user_id: Optional[str] = Header(None)):
    """Get user's search count for free trial tracking"""
    if not x_user_id:
        raise HTTPException(status_code=401, detail="User ID required")
    
    try:
        supabase = get_supabase()
        if not supabase:
            raise HTTPException(status_code=500, detail="Database not initialized")
        
        result = supabase.table("people_searches").select("id").eq("user_id", x_user_id).execute()
        count = len(result.data) if result.data else 0
        
        # Get user tier
        user_result = supabase.table("user_profiles").select("tier").eq("id", x_user_id).execute()
        tier = user_result.data[0]["tier"] if user_result.data else "free"
        
        # Free tier gets 1 search
        limit = 1 if tier == "free" else float('inf')
        
        return {
            "success": True,
            "data": {
                "count": count,
                "limit": limit,
                "tier": tier,
                "can_search": count < limit if limit != float('inf') else True
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/api/usage/check-free-trial")
async def check_free_trial(x_user_id: Optional[str] = Header(None)):
    """Check if user has free trial remaining"""
    if not x_user_id:
        raise HTTPException(status_code=401, detail="User ID required")
    
    try:
        supabase = get_supabase()
        if not supabase:
            raise HTTPException(status_code=500, detail="Database not initialized")
        
        # Count searches
        result = supabase.table("people_searches").select("id").eq("user_id", x_user_id).execute()
        search_count = len(result.data) if result.data else 0
        
        # Get user tier
        user_result = supabase.table("user_profiles").select("tier").eq("id", x_user_id).execute()
        tier = user_result.data[0]["tier"] if user_result.data else "free"
        
        if tier == "free" and search_count >= 1:
            return {
                "success": True,
                "trial_expired": True,
                "message": "Free trial used. Please upgrade to continue."
            }
        
        return {
            "success": True,
            "trial_expired": False,
            "searches_used": search_count,
            "searches_remaining": 1 - search_count if tier == "free" else "unlimited"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/api/upgrade-tier")
async def upgrade_tier(body: dict, x_user_id: Optional[str] = Header(None)):
    """Upgrade user tier (after payment)"""
    if not x_user_id:
        raise HTTPException(status_code=401, detail="User ID required")
    
    try:
        supabase = get_supabase()
        if not supabase:
            raise HTTPException(status_code=500, detail="Database not initialized")
        
        tier = body.get("tier", "pro")  # 'pro' or 'enterprise'
        
        supabase.table("user_profiles").update({
            "tier": tier,
            "storage_limit_bytes": 5 * 1024 * 1024 * 1024 if tier == "pro" else float('inf')
        }).eq("id", x_user_id).execute()
        
        return {"success": True, "message": f"Upgraded to {tier} tier"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
