// Stripe billing for Yadira Premium — $5/week per care circle.
// ------------------------------------------------------------------
// Talks to Stripe's REST API directly with fetch (same pattern as the
// Inworld/OpenRouter integrations) so no SDK dependency is needed.
//
// Flow (no webhooks, matching the client-writes-Firestore architecture):
//   1. Caregiver clicks Unlock → POST /api/stripe/create-checkout-session
//      → browser redirects to Stripe Checkout.
//   2. Stripe redirects back to the app with ?premium_session=cs_...
//   3. Client calls GET /api/stripe/verify-session — the server confirms
//      payment with Stripe using the secret key, and only then does the
//      client flip the circle's premium doc (with subscription ids attached).
//   4. On later visits, once the paid period has lapsed, the client calls
//      GET /api/stripe/subscription-status to re-verify renewal or downgrade.
//
// Env: STRIPE_SECRET_KEY (sk_test_... first, sk_live_... for real revenue).
// Optional APP_URL overrides the redirect base (defaults to request origin).

import express from 'express';

const STRIPE_API = 'https://api.stripe.com/v1';

const stripeKey = () => process.env.STRIPE_SECRET_KEY;
const isStripeConfigured = () => {
  const key = stripeKey();
  return !!key && key.trim() !== '' && key !== 'MY_STRIPE_SECRET_KEY';
};

// Stripe's API takes application/x-www-form-urlencoded bodies with
// bracket-notation for nested params (line_items[0][price_data][currency]).
async function stripeRequest(
  method: 'GET' | 'POST',
  path: string,
  params?: Record<string, string>
): Promise<any> {
  const body = params ? new URLSearchParams(params).toString() : undefined;
  const url = method === 'GET' && body ? `${STRIPE_API}${path}?${body}` : `${STRIPE_API}${path}`;

  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${stripeKey()}`,
      ...(method === 'POST' ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}),
    },
    ...(method === 'POST' && body ? { body } : {}),
  });

  // Stripe replies with JSON, but an intermediary (corporate proxy, outage
  // page) may not — surface a readable error instead of a JSON.parse crash.
  const raw = await response.text();
  let data: any;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error(`Stripe API returned a non-JSON response (HTTP ${response.status}): ${raw.slice(0, 120)}`);
  }
  if (!response.ok) {
    const message = data?.error?.message || `Stripe API error ${response.status}`;
    throw new Error(message);
  }
  return data;
}

// Base URL for Stripe's post-checkout redirects. Render sits behind a proxy,
// so req.protocol reports http — prefer APP_URL, then the fetch Origin header,
// then x-forwarded-proto.
function baseUrl(req: express.Request): string {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, '');
  const origin = req.headers.origin;
  if (origin && /^https?:\/\//.test(origin)) return origin.replace(/\/$/, '');
  const proto = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'https';
  return `${proto}://${req.get('host')}`;
}

const notConfigured = (res: express.Response) =>
  res.status(503).json({
    error: 'stripe_not_configured',
    message: 'STRIPE_SECRET_KEY is not set — Premium checkout is unavailable.',
  });

// A subscription counts as premium while Stripe says it's active or trialing.
// past_due keeps access briefly (Stripe retries the card); everything else
// (canceled, unpaid, incomplete_expired) downgrades.
function subscriptionState(sub: any) {
  const status: string = sub?.status || 'unknown';
  const active = status === 'active' || status === 'trialing' || status === 'past_due';
  return {
    active,
    status,
    subscriptionId: sub?.id || null,
    customerId: typeof sub?.customer === 'string' ? sub.customer : sub?.customer?.id || null,
    // Seconds → ms so the client can compare against Date.now() directly.
    currentPeriodEnd: sub?.current_period_end ? sub.current_period_end * 1000 : null,
    cancelAtPeriodEnd: !!sub?.cancel_at_period_end,
  };
}

export function registerStripeRoutes(app: express.Express) {
  // Step 1 — create the Checkout Session and hand its URL back to the client.
  app.post('/api/stripe/create-checkout-session', async (req: express.Request, res: express.Response) => {
    if (!isStripeConfigured()) return notConfigured(res);

    const circle = String(req.body?.circle || 'default-circle').slice(0, 128);
    const base = baseUrl(req);

    try {
      const session = await stripeRequest('POST', '/checkout/sessions', {
        mode: 'subscription',
        'line_items[0][quantity]': '1',
        'line_items[0][price_data][currency]': 'usd',
        'line_items[0][price_data][unit_amount]': '500',
        'line_items[0][price_data][recurring][interval]': 'week',
        'line_items[0][price_data][product_data][name]': 'Yadira Premium',
        'line_items[0][price_data][product_data][description]':
          "Natural loved-one voice, hands-free Call Mode, all calming sensory rooms, and photo memories — for one family's care circle.",
        success_url: `${base}/?premium_session={CHECKOUT_SESSION_ID}`,
        cancel_url: `${base}/?premium_canceled=1`,
        'metadata[circleId]': circle,
        'subscription_data[metadata][circleId]': circle,
        allow_promotion_codes: 'true',
      });
      res.json({ url: session.url, sessionId: session.id });
    } catch (err: any) {
      console.error('[Stripe] create-checkout-session failed:', err.message || err);
      res.status(502).json({ error: err.message || 'Failed to create checkout session' });
    }
  });

  // Step 3 — the client returned from Stripe; confirm the payment actually
  // happened before it flips the premium doc. The secret key never leaves the
  // server, so this cannot be spoofed by editing client code.
  app.get('/api/stripe/verify-session', async (req: express.Request, res: express.Response) => {
    if (!isStripeConfigured()) return notConfigured(res);

    const sessionId = String(req.query?.session_id || '');
    if (!sessionId.startsWith('cs_')) {
      return res.status(400).json({ error: 'A Stripe checkout session_id is required' });
    }

    try {
      const session = await stripeRequest('GET', `/checkout/sessions/${sessionId}`, {
        'expand[]': 'subscription',
      });
      const paid = session.payment_status === 'paid';
      const state = subscriptionState(session.subscription);
      res.json({
        active: paid && state.active,
        circleId: session.metadata?.circleId || null,
        ...state,
      });
    } catch (err: any) {
      console.error('[Stripe] verify-session failed:', err.message || err);
      res.status(502).json({ error: err.message || 'Failed to verify checkout session' });
    }
  });

  // Step 4 — renewal / lapse check once the stored period end has passed.
  app.get('/api/stripe/subscription-status', async (req: express.Request, res: express.Response) => {
    if (!isStripeConfigured()) return notConfigured(res);

    const subscriptionId = String(req.query?.subscription_id || '');
    if (!subscriptionId.startsWith('sub_')) {
      return res.status(400).json({ error: 'A Stripe subscription_id is required' });
    }

    try {
      const sub = await stripeRequest('GET', `/subscriptions/${subscriptionId}`);
      res.json(subscriptionState(sub));
    } catch (err: any) {
      console.error('[Stripe] subscription-status failed:', err.message || err);
      res.status(502).json({ error: err.message || 'Failed to fetch subscription status' });
    }
  });

  // Self-serve billing management (cancel, update card) via Stripe's hosted
  // customer portal — families must always have an easy way out.
  app.post('/api/stripe/create-portal-session', async (req: express.Request, res: express.Response) => {
    if (!isStripeConfigured()) return notConfigured(res);

    const customerId = String(req.body?.customerId || '');
    if (!customerId.startsWith('cus_')) {
      return res.status(400).json({ error: 'A Stripe customerId is required' });
    }

    try {
      const portal = await stripeRequest('POST', '/billing_portal/sessions', {
        customer: customerId,
        return_url: `${baseUrl(req)}/`,
      });
      res.json({ url: portal.url });
    } catch (err: any) {
      console.error('[Stripe] create-portal-session failed:', err.message || err);
      res.status(502).json({ error: err.message || 'Failed to create billing portal session' });
    }
  });
}
