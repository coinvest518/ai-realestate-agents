# Password-Based Authentication Complete Guide

## Overview
Complete email/password authentication with sign up, login, logout, and password reset.

## Features Implemented

### 1. Sign Up (`/auth/signup`)
- Email and password registration
- Auto-creates user profile with tier='free'
- 1 free search included

### 2. Login (`/auth/login`)
- Email and password sign in
- Forgot password link
- Redirects to dashboard on success

### 3. Forgot Password (`/auth/forgot-password`)
- Email-based password reset
- Sends reset link via email
- Redirects to update password page

### 4. Update Password (`/auth/update-password`)
- Set new password after reset
- Password confirmation validation
- Minimum 6 characters required

### 5. Logout
- User menu in dashboard header
- Sign out button with confirmation
- Clears session and redirects to home

### 6. User Menu
- Avatar with user initials
- Settings link
- Sign out button
- Dropdown in dashboard header

## Auth Flow Diagram

```
Landing Page
    ↓
Sign Up / Login
    ↓
Email Verification (optional)
    ↓
Dashboard (authenticated)
    ↓
User Menu → Sign Out → Home
    ↓
Forgot Password → Reset Email → Update Password → Login
```

## Files Created

### Frontend Pages
- `app/auth/signup/page.tsx` - Sign up form
- `app/auth/login/page.tsx` - Login form with forgot password link
- `app/auth/forgot-password/page.tsx` - Password reset request
- `app/auth/update-password/page.tsx` - New password form

### Components
- `components/auth-provider.tsx` - Auth context with all methods
- `components/user-menu.tsx` - User dropdown menu with logout

### Configuration
- `middleware.ts` - Route protection
- `app/layout.tsx` - AuthProvider wrapper

## API Methods

### Sign Up
```typescript
const { signUp } = useAuth()
await signUp(email, password)
```

### Sign In
```typescript
const { signIn } = useAuth()
await signIn(email, password)
```

### Sign Out
```typescript
const { signOut } = useAuth()
await signOut()
```

### Reset Password
```typescript
const { resetPassword } = useAuth()
await resetPassword(email)
// Sends email with reset link
```

### Update Password
```typescript
const { updatePassword } = useAuth()
await updatePassword(newPassword)
// Called after clicking reset link
```

## Supabase Configuration

### Email Verification
By default on hosted Supabase:
- Email verification is **enabled**
- Users must confirm email before signing in
- Confirmation link sent automatically

To disable (development only):
1. Go to Supabase Dashboard
2. Auth → Providers → Email
3. Toggle "Confirm email" OFF

### Email Templates
Customize in Supabase Dashboard:
- Auth → Email Templates
- Modify confirmation, reset, and invite emails

### SMTP Configuration
For production, configure custom SMTP:
1. Auth → Email Templates → SMTP Settings
2. Add your email provider (SendGrid, Mailgun, etc.)
3. Default rate limit: 2 emails/hour

## Testing Locally

### With Email Verification Disabled
1. Sign up at `/auth/signup`
2. Immediately redirected to login
3. Sign in with credentials
4. Access dashboard

### With Email Verification Enabled
1. Sign up at `/auth/signup`
2. Check email for confirmation link
3. Click link to verify
4. Sign in with credentials
5. Access dashboard

### Password Reset Flow
1. Go to `/auth/login`
2. Click "Forgot password?"
3. Enter email
4. Check email for reset link
5. Click link → redirects to `/auth/update-password`
6. Enter new password
7. Redirected to dashboard

## Security Best Practices

✅ Passwords hashed with bcrypt (Supabase handles)
✅ HTTPS only (enforced by Supabase)
✅ Secure session tokens (httpOnly cookies)
✅ CSRF protection (Supabase built-in)
✅ Rate limiting on auth endpoints
✅ Email verification for new accounts
✅ Password reset tokens expire in 1 hour
✅ RLS policies enforce per-user data access

## Environment Setup

### Frontend (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
```

### Backend (.env)
```
SUPABASE_URL=your_url
SUPABASE_ANON_KEY=your_key
SUPABASE_SERVICE_ROLE_KEY=your_key
```

## Redirect URLs

Configure in Supabase Dashboard:
- Auth → URL Configuration → Redirect URLs

Add these URLs:
```
http://localhost:3000/auth/update-password
http://localhost:3000/dashboard
https://yourdomain.com/auth/update-password
https://yourdomain.com/dashboard
```

## User Session Management

### Get Current User
```typescript
const { user, session, loading } = useAuth()
```

### Check Authentication
```typescript
if (!user) {
  router.push("/auth/login")
}
```

### Sign Out Scopes
Supabase supports 3 sign out scopes:
- `global` (default) - Sign out from all devices
- `local` - Sign out from current device only
- `others` - Sign out from other devices

```typescript
await supabase.auth.signOut({ scope: 'local' })
```

## Error Handling

Common errors:
- `Invalid login credentials` - Wrong email/password
- `Email not confirmed` - User hasn't verified email
- `Password should be at least 6 characters` - Too short
- `User already registered` - Email exists

All handled with toast notifications.

## Next Steps

### Phase 1: Current ✅
- [x] Email/password auth
- [x] Sign up/login/logout
- [x] Password reset
- [x] User menu
- [x] Route protection

### Phase 2: Enhanced
- [ ] Email verification customization
- [ ] Two-factor authentication (2FA)
- [ ] Social login (Google, GitHub)
- [ ] Account deletion
- [ ] Email change

### Phase 3: Advanced
- [ ] Magic link authentication
- [ ] Phone number auth
- [ ] Passwordless auth
- [ ] Session management UI
- [ ] Login history

## Testing Checklist

- [ ] Sign up with new email
- [ ] Verify email (if enabled)
- [ ] Sign in with credentials
- [ ] Access dashboard
- [ ] Click user menu
- [ ] Sign out
- [ ] Redirected to home
- [ ] Try forgot password
- [ ] Receive reset email
- [ ] Update password
- [ ] Sign in with new password
- [ ] Try wrong password (error)
- [ ] Try short password (error)

## Troubleshooting

### Email not received
- Check spam folder
- Verify email in Supabase dashboard
- Check SMTP configuration
- Rate limit: 2 emails/hour (development)

### Can't sign in after reset
- Ensure email is verified
- Check password length (min 6 chars)
- Clear browser cookies
- Try incognito mode

### Redirect URL not working
- Add URL to Supabase redirect list
- Check exact URL format
- Ensure HTTPS in production
- Clear browser cache

## Production Checklist

- [ ] Configure custom SMTP
- [ ] Add all redirect URLs
- [ ] Enable email verification
- [ ] Set up 2FA (optional)
- [ ] Configure rate limits
- [ ] Test email templates
- [ ] Monitor auth logs
- [ ] Set up error tracking
