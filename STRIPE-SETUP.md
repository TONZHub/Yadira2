# Stripe Setup — Yadira Premium ($5/week)

Yadira Premium is billed as a **$5/week subscription** through Stripe Checkout.
The app creates prices on the fly (`price_data`), so you do **not** need to
create any Product or Price in the Stripe dashboard — the only thing the
server needs is your secret key.

## How the flow works

1. A caregiver clicks **Unlock Premium — $5/week** in the Caregiver Hub.
2. The server creates a Stripe Checkout Session and the browser is redirected
   to Stripe's hosted payment page (Yadira never touches card numbers).
3. Stripe redirects back to the app with `?premium_session=cs_...`.
4. The client asks the server to verify that session; the server confirms the
   payment with Stripe using the secret key, and only then is the family's
   `premium` doc flipped to unlocked (with the subscription id attached).
5. When the paid-through date (+3-day grace) passes, the app re-checks the
   subscription with Stripe and downgrades automatically if it was canceled.
6. **Manage subscription** opens Stripe's hosted billing portal so families
   can cancel or change cards themselves.

If `STRIPE_SECRET_KEY` is not set, the Unlock button falls back to the old
demo toggle so demos keep working.

## Step 1 — Create the Stripe account

1. Go to <https://dashboard.stripe.com/register> and sign up.
2. You can use **test mode immediately** — no business verification needed.
3. To accept real money you'll need to **activate the account** (Settings →
   Activate payments): business details, bank account for payouts. As a sole
   proprietor / individual this takes ~10 minutes; payouts start ~2 days
   after the first charge.

## Step 2 — Get your secret key

1. Dashboard → **Developers → API keys**.
2. In **test mode** (toggle top-right), copy the **Secret key** (`sk_test_...`).
3. Later, in **live mode**, copy the live key (`sk_live_...`).

Never put this key in client code or commit it — server env var only.

## Step 3 — Configure Render

1. Render dashboard → your `yadira` service → **Environment**.
2. Add `STRIPE_SECRET_KEY` = `sk_test_...` (test first).
3. (Optional) Add `APP_URL` = your public URL (e.g.
   `https://yadira.onrender.com`) if Stripe redirects ever land on the wrong
   host — normally the request origin is detected automatically.
4. Save → Render redeploys.

For local dev, add to `.env`:

```
STRIPE_SECRET_KEY=sk_test_...
```

## Step 4 — Test the whole loop (test mode)

1. Log in as a caregiver, open the Caregiver Hub, click
   **Unlock Premium — $5/week**.
2. On the Stripe page use test card **4242 4242 4242 4242**, any future
   expiry, any CVC, any ZIP.
3. You should land back in the app with a "Premium unlocked" toast, and the
   natural voice / Call Mode / all sensory rooms active.
4. Click **Manage subscription** → Stripe billing portal opens → cancel →
   after the period lapses the app downgrades on its own.

   > If the portal errors with "No configuration provided", enable it once:
   > Dashboard → Settings → **Billing → Customer portal** → Save (defaults
   > are fine).

## Step 5 — Go live

1. Activate the account (Step 1.3) and flip the dashboard to **live mode**.
2. Replace `STRIPE_SECRET_KEY` on Render with the `sk_live_...` key.
3. Make one real $5 purchase yourself end-to-end to verify the live pipeline,
   then refund it from the dashboard (Payments → ⋯ → Refund). One or two
   refunded pipeline tests are normal; keep real customer revenue clean —
   competition verification (XPRIZE / Hacker Fund) looks at **net** revenue
   and sees refunds line-by-line.

## Free tier vs Premium

| Feature | Free | Premium ($5/week) |
| --- | --- | --- |
| Chat companion (Yadira & Vivid persona) | ✓ | ✓ |
| Aurora calming screen & redirection cues | ✓ | ✓ |
| Voice | Device voice | Natural Inworld voice |
| Call Mode (hands-free) | — | ✓ |
| Sensory rooms | Aurora only | All rooms |
| Session Memory (persona remembers across visits) | — | ✓ |
| Memory bank | 5 memories | Unlimited |
| Photo memories (media upload) | — | ✓ |
| AI routine generation | 1 / week | Unlimited |
| AI clinical insights | 1 / week | Unlimited |

The calm-down and safety surfaces (Aurora, redirection) are deliberately
never paywalled. Existing Session Memory data is kept when a subscription
lapses and returns on re-subscribe.

Separately from the paywall, the server caps natural-voice synthesis at
30k characters/day per care circle and 100k/day per IP (the `/api/tts`
endpoint is auth-exempt, and Inworld bills per character) — hitting the cap
falls back to the device voice, never silence.

## Notes

- **Revenue evidence for the XPRIZE**: Dashboard → Reports. Gross volume,
  net volume, and subscriber counts are all exportable — this is exactly the
  artifact to attach to the Devpost submission.
- **Promo codes**: checkout has `allow_promotion_codes` on, so you can create
  coupons in the dashboard (e.g. `CAREGIVER50`) for outreach without touching
  code.
- **No webhooks (yet)**: state sync is done by server-verified polling, which
  matches the app's client-writes-Firestore architecture. If Premium ever
  gates server-side resources directly, add a `checkout.session.completed`
  webhook plus firebase-admin as a hardening pass.
