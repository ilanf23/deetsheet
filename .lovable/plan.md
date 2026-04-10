

# Plan: Disable Email Verification for Signups

## What changes
Use the `configure_auth` tool to enable auto-confirm for email signups. This means new users will be immediately signed in after signing up without needing to click a verification link.

## Code changes

### `src/pages/SignUp.tsx`
- Remove the `checkInbox` state and the "Check Your Inbox" screen
- After successful signup, navigate directly to `/profile` instead of showing the verification message

