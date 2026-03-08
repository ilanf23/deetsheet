

## Authentication Plan for DeetSheet

### Important Limitation

**Facebook sign-in is not supported** on Lovable Cloud. The supported OAuth providers are **Google** and **Apple**. I can implement Google sign-in and offer Apple as an alternative to Facebook.

### What will be built

1. **Email/password signup** (`/signup`) -- connects to the backend auth system with email verification required. After signup, user sees a "check your inbox" message. The confirmation link redirects to `/auth/callback`.

2. **Login page** (`/login`) -- email/password login form with a "Forgot password?" link.

3. **Google sign-in** -- on both signup and login pages, using the managed Google OAuth integration.

4. **Auth callback page** (`/auth/callback`) -- handles email verification redirects and OAuth callbacks, then routes to `/profile`.

5. **Forgot/reset password flow** -- `/forgot-password` page sends reset email; `/reset-password` page lets users set a new password.

6. **Auth context** -- a shared `AuthProvider` wrapping the app to track session state, expose `user`, `signOut`, and protect routes like `/profile`.

7. **Header updates** -- show username + "Sign Out" when logged in instead of "Sign Up / Log In".

### Files to create/modify

- `src/contexts/AuthContext.tsx` -- AuthProvider with `onAuthStateChange`
- `src/pages/SignUp.tsx` -- wire to `supabase.auth.signUp` with username in metadata, add Google button
- `src/pages/Login.tsx` -- new page
- `src/pages/AuthCallback.tsx` -- handles redirects
- `src/pages/ForgotPassword.tsx` -- sends reset email
- `src/pages/ResetPassword.tsx` -- sets new password
- `src/components/DeetHeader.tsx` -- conditional auth UI
- `src/App.tsx` -- add routes, wrap in AuthProvider

### Database

No schema changes needed -- the `profiles` table and `handle_new_user` trigger already exist. The trigger creates a profile row with the username from signup metadata.

### Auth configuration

Will use the Configure Social Login tool to set up Google OAuth with the managed credentials.

