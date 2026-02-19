# Authentication & Payment System Setup

## Overview
Complete Supabase auth with free trial (1 search) and tiered payment system.

## Architecture

### User Flow
1. **Landing Page** → Sign Up / Login
2. **Free Trial** → 1 free search per user
3. **Trial Expired** → Redirect to upgrade page
4. **Payment** → Stripe integration (TODO)
5. **Dashboard** → Full access

### Tiers
- **Free**: 1 search, 100MB storage
- **Pro**: Unlimited searches, 5GB storage, $29/month
- **Enterprise**: Unlimited everything, custom pricing

## Files Created

### Frontend
1. **`components/auth-provider.tsx`** - Supabase auth context
2. **`app/auth/signup/page.tsx`** - Sign up page
3. **`app/auth/login/page.tsx`** - Login page
4. **`app/upgrade/page.tsx`** - Pricing/upgrade page
5. **`middleware.ts`** - Route protection

### Backend
1. **`backend/usage_api.py`** - Usage tracking API
   - `GET /api/usage/searches` - Get search count
   - `POST /api/usage/check-free-trial` - Check trial status
   - `POST /api/upgrade-tier` - Upgrade user tier

## Setup Steps

### 1. Add Supabase to Frontend
```bash
npm install @supabase/supabase-js
```

### 2. Update `.env.local`
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 3. Update Root Layout
Already done - `AuthProvider` wraps app

### 4. Database Schema
Already updated with `tier` and `storage_limit_bytes` columns

## How It Works

### Sign Up Flow
```
User → /auth/signup → Create account → Supabase creates user_profile with tier='free'
```

### Free Trial Check
```
User searches → Backend checks usage → If count >= 1 and tier='free' → Redirect to /upgrade
```

### Usage Tracking
```
GET /api/usage/searches?X-User-ID=user-123
Returns: {
  count: 1,
  limit: 1,
  tier: "free",
  can_search: false
}
```

### Upgrade Flow
```
User clicks "Upgrade" → POST /api/upgrade-tier → Update tier in DB → Redirect to dashboard
```

## Integration Points

### In Dashboard (people search)
```typescript
// Before running search
const response = await fetch('http://localhost:8000/api/usage/check-free-trial', {
  method: 'POST',
  headers: { 'X-User-ID': user.id }
})

const { trial_expired } = await response.json()
if (trial_expired) {
  router.push('/upgrade')
  return
}

// Run search...
```

### In Chat Panel
```typescript
// Same check before allowing search
```

## Next Steps (Payment Integration)

### Phase 1: Stripe Setup
1. Create Stripe account
2. Add Stripe keys to `.env`
3. Install `@stripe/stripe-js`

### Phase 2: Payment Flow
1. Create checkout session on backend
2. Redirect to Stripe checkout
3. Webhook to update tier after payment

### Phase 3: Subscription Management
1. Customer portal
2. Cancel/pause subscription
3. Invoice history

## Testing

### Test Free Trial
1. Sign up at `/auth/signup`
2. Go to `/dashboard`
3. Run 1 people search (succeeds)
4. Try 2nd search (redirects to `/upgrade`)

### Test Upgrade
1. Click "Upgrade to Pro"
2. Check database - tier should be "pro"
3. Can now run unlimited searches

## Security Notes

- Auth tokens stored in httpOnly cookies (Supabase handles)
- Middleware protects `/dashboard` and `/upgrade` routes
- RLS policies enforce per-user data access
- Backend validates user_id from auth token

## Environment Variables

```
# Frontend (.env.local)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Backend (.env)
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
# Optional: pre-created Stripe price IDs for subscription plans (recommended)
STRIPE_PRICE_PRO_ID=price_xxx
STRIPE_PRICE_ENTERPRISE_ID=price_xxx
# Optional: Stripe product IDs (if you only have product IDs, backend will create a Price on-the-fly)
STRIPE_PRO_PRODUCT_ID=prod_U0ccioBcpVi6DL  # Pro product id (you provided)
STRIPE_ENTERPRISE_PRODUCT_ID=prod_U0cdTpv4RroGFK  # Enterprise product id (you provided)
```

## API Endpoints

### Check Usage
```bash
curl -X GET http://localhost:8000/api/usage/searches \
  -H "X-User-ID: user-123"
```

### Check Free Trial
```bash
curl -X POST http://localhost:8000/api/usage/check-free-trial \
  -H "X-User-ID: user-123"
```

### Upgrade Tier
```bash
curl -X POST http://localhost:8000/api/upgrade-tier \
  -H "X-User-ID: user-123" \
  -H "Content-Type: application/json" \
  -d '{"tier": "pro"}'
```

## Current Status

✅ Auth pages (signup/login)
✅ Auth provider with Supabase
✅ Free trial tracking (1 search limit)
✅ Usage API endpoints
✅ Upgrade page with pricing
✅ Route protection middleware
⏳ Stripe payment integration (TODO)
⏳ Webhook handling (TODO)
⏳ Subscription management (TODO)

## Notes

- Free trial is 1 search per user (enforced in backend)
- After upgrade, limit is removed
- Storage limits also enforced per tier
- All data is per-user with RLS policies
