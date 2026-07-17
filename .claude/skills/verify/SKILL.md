# Verify: run and drive Yadira locally

## Launch

```bash
PORT=4300 DISABLE_HMR=true npm run dev > /tmp/dev.log 2>&1 &
# Vite serves the SPA on :4300; vite.config auto-starts the Express API on :4301
# and proxies /api to it. With no GEMINI/OPENROUTER keys the backend runs in
# Simulation Mode — chat still replies deterministically, no keys needed.
```

Wait ~6s, then `curl -s -o /dev/null -w "%{http_code}" http://localhost:4300/` → 200.

## Drive (Playwright, pre-installed Chromium)

```js
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
```

Fastest path to the patient chat (no login):
1. `goto('http://localhost:4300/')` → role-picker landing.
2. Click text "I'm a Patient" → Hattie camp check-in appears.
3. Click button /leave camp/i → main patient chat with Yadira.
4. Chat input is the first `input[type="text"]`; fill + Enter to send.

## Gotchas

- Simulation replies are keyword-routed (see `getSimulationReply` in
  `src/server/index.ts`). For a **deterministic multi-sentence reply**, send a
  message containing a demo memory title, e.g. `"Tell me about your dog, Barnaby"`
  (titles in `src/lib/demoData.ts`) — matching returns intro + 3-sentence
  description, which splits into 3 digestible bubbles.
- Model replies render via `DigestibleMessage` one bubble at a time (~1–3s
  apart). Count bubbles by filtering divs whose className includes both
  `max-w-[85%]` and `space-y-2`, then `children.length` of the last one.
  The timestamp + "Read to me" footer only renders once fully revealed.
- Don't use CSS selectors with `[85%]` in querySelectorAll — invalid; filter in JS.
- `pgrep -f vite` matches its own wrapper shell in this environment; trust
  the curl health check, and `pkill -f "vite --host"` to stop.
