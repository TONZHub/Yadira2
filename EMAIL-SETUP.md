# Email Setup — the welcome email (Resend)

After a caregiver signs up (email/password, or a first-time Google
sign-in), the app sends them the "Welcome to Yadira" email. The template
lives in `src/server/email.ts`; sending goes through
[Resend](https://resend.com).

If `RESEND_API_KEY` is not set, signup works exactly as before and the
email is silently skipped — email can never break account creation.

## Step 1 — Create the Resend account

1. Sign up at <https://resend.com> (free tier: 100 emails/day, 3,000/month).
2. **Domains → Add domain** → `yadira.chat`.
3. Resend shows DNS records (SPF + DKIM). Add them wherever yadira.chat's
   DNS lives, then click Verify. This is what lets mail come *from*
   `welcome@yadira.chat` without landing in spam.

## Step 2 — Get the API key

Dashboard → **API Keys → Create API key** (`re_...`). Sending-only
permission is enough.

## Step 3 — Configure

- **Render**: service → Environment → add `RESEND_API_KEY` = `re_...`
- **Local dev**: add the same line to `.env`

Optional: `EMAIL_FROM` overrides the sender (defaults to
`Yadira <welcome@yadira.chat>`).

## Step 4 — Test

Sign up with a fresh account (or delete a test user in Firebase Console →
Authentication and sign up again — the welcome only goes to *new*
accounts). The email should arrive within seconds; Resend's dashboard
logs every send.

## How it works

1. Client signup succeeds → fire-and-forget `POST /api/email/welcome`
   with the new account's auth token.
2. The server sends the template to the **authenticated account's own
   address only** — the endpoint accepts no recipient from the request,
   so it can't be used to spam arbitrary inboxes.
3. Google sign-ins only trigger the email when Firebase reports the
   account is new (`isNewUser`), so returning users are never re-welcomed.
4. Local demo accounts (`*@yadira.local`) are skipped.

## Notes

- The logo is loaded from `https://yadira.chat/yadira-logo.png` (email
  clients need absolute image URLs), so the production site must be up
  for the image to render.
- The footer's "Email preferences / Unsubscribe" links are mailto links
  for now — fine for a transactional welcome; build real preference
  routes before any marketing/drip campaigns.
