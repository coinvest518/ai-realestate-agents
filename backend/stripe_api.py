import os
import stripe
from fastapi import APIRouter, HTTPException, Header
from typing import Optional
from supabase_helper import get_supabase

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

router = APIRouter()

# server-side plan metadata (fallback values)
PLANS = {
    "pro": {"price": 4900, "name": "Pro", "searches": 50000},
    "enterprise": {"price": 29900, "name": "Enterprise", "searches": float('inf')}
}

# Optional: configure PRICE IDs or PRODUCT IDs via environment variables
STRIPE_PRICE_PRO_ID = os.getenv("STRIPE_PRICE_PRO_ID")
STRIPE_PRICE_ENTERPRISE_ID = os.getenv("STRIPE_PRICE_ENTERPRISE_ID")
STRIPE_PRO_PRODUCT_ID = os.getenv("STRIPE_PRO_PRODUCT_ID")
STRIPE_ENTERPRISE_PRODUCT_ID = os.getenv("STRIPE_ENTERPRISE_PRODUCT_ID")

@router.post("/api/stripe/checkout")
async def create_checkout_session(body: dict, x_user_id: Optional[str] = Header(None)):
    """Create Stripe checkout session.

    Behavior:
    - If STRIPE_PRICE_* env var is provided for the plan, use that Price (recommended).
    - Else if a PRODUCT ID env var (prod_...) is provided, create a one-off Price tied to that product and use it.
    - Otherwise fall back to inline price_data (existing behavior).
    """
    if not x_user_id:
        raise HTTPException(status_code=401, detail="User ID required")
    
    try:
        plan = body.get("plan", "pro")
        if plan not in PLANS:
            raise HTTPException(status_code=400, detail="Invalid plan")
        
        plan_info = PLANS[plan]

        supabase = get_supabase()
        if not supabase:
            raise HTTPException(status_code=500, detail="Database not initialized")

        # Get user email from Supabase
        user_result = supabase.table("user_profiles").select("email").eq("id", x_user_id).execute()
        if not user_result.data:
            raise HTTPException(status_code=404, detail="User not found")
        user_email = user_result.data[0]["email"]

        # Prefer price IDs from env
        price_id = None
        product_id = None
        if plan == "pro":
            price_id = STRIPE_PRICE_PRO_ID
            product_id = STRIPE_PRO_PRODUCT_ID
        else:
            price_id = STRIPE_PRICE_ENTERPRISE_ID
            product_id = STRIPE_ENTERPRISE_PRODUCT_ID

        metadata = {"user_id": x_user_id, "plan": plan}
        if product_id:
            metadata["product_id"] = product_id
        if price_id:
            metadata["price_id"] = price_id

        # Build line_items depending on available config
        if price_id:
            # Use pre-created Price ID (recommended)
            session = stripe.checkout.Session.create(
                payment_method_types=["card"],
                line_items=[{"price": price_id, "quantity": 1}],
                mode="subscription",
                customer_email=user_email,
                success_url=f"{os.getenv('NEXT_PUBLIC_API_BASE', 'http://localhost:3000')}/dashboard?payment=success",
                cancel_url=f"{os.getenv('NEXT_PUBLIC_API_BASE', 'http://localhost:3000')}/dashboard?payment=cancelled",
                metadata=metadata,
            )
        elif product_id and product_id.startswith("prod_"):
            # Create a price on-the-fly for the provided product (recurring monthly)
            created_price = stripe.Price.create(
                unit_amount=plan_info["price"],
                currency="usd",
                recurring={"interval": "month"},
                product=product_id,
            )
            session = stripe.checkout.Session.create(
                payment_method_types=["card"],
                line_items=[{"price": created_price.id, "quantity": 1}],
                mode="subscription",
                customer_email=user_email,
                success_url=f"{os.getenv('NEXT_PUBLIC_API_BASE', 'http://localhost:3000')}/dashboard?payment=success",
                cancel_url=f"{os.getenv('NEXT_PUBLIC_API_BASE', 'http://localhost:3000')}/dashboard?payment=cancelled",
                metadata={**metadata, "created_price_id": created_price.id},
            )
        else:
            # Fallback to inline price_data
            session = stripe.checkout.Session.create(
                payment_method_types=["card"],
                line_items=[{
                    "price_data": {
                        "currency": "usd",
                        "product_data": {
                            "name": f"AgentScrape {plan_info['name']} Plan",
                            "description": f"{plan_info['searches']} searches/month",
                        },
                        "unit_amount": plan_info["price"],
                    },
                    "quantity": 1,
                }],
                mode="subscription",
                customer_email=user_email,
                success_url=f"{os.getenv('NEXT_PUBLIC_API_BASE', 'http://localhost:3000')}/dashboard?payment=success",
                cancel_url=f"{os.getenv('NEXT_PUBLIC_API_BASE', 'http://localhost:3000')}/dashboard?payment=cancelled",
                metadata=metadata,
            )

        return {"success": True, "session_id": session.id, "url": session.get("url")}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/api/stripe/webhook")
async def stripe_webhook(request):
    """Handle Stripe webhook events"""
    try:
        payload = await request.body()
        sig_header = request.headers.get("stripe-signature")
        
        event = stripe.Webhook.construct_event(
            payload, sig_header, os.getenv("STRIPE_WEBHOOK_SECRET")
        )
        
        if event["type"] == "checkout.session.completed":
            session = event["data"]["object"]
            user_id = session["metadata"]["user_id"]
            plan = session["metadata"]["plan"]
            
            supabase = get_supabase()
            if not supabase:
                raise HTTPException(status_code=500, detail="Database not initialized")
            
            # Update user tier in Supabase
            supabase.table("user_profiles").update({
                "tier": plan
            }).eq("id", user_id).execute()
            
            return {"success": True}
        
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
