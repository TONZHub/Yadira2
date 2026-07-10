# Yadira — Firebase Setup Guide

The app now runs in **two modes automatically**:

- **No Firebase config** → localStorage mode (exactly like before, nothing breaks)
- **Firebase config present** → real-time cloud sync across devices (caregiver phone + patient tablet)

## Step 0 — Protect your $300 credits FIRST

Before creating anything:

1. Go to Google Cloud Console → **Billing** → **Budgets & alerts**
2. Create a budget: **$25/month** with email alerts at 50% / 90% / 100%
3. This is a prototype — if you ever see more than a few dollars of spend, something is misconfigured

Firestore free tier alone covers a prototype easily: 50K reads + 20K writes **per day**, free. You will likely spend $0.

## Step 1 — Create the Firebase project

1. [console.firebase.google.com](https://console.firebase.google.com) → **Add project**
2. Name it `yadira` (link it to your existing Google Cloud billing account)
3. Skip Google Analytics (not needed)

## Step 2 — Add a Web App

1. Project Overview → **</>** (Web) icon → register app as `yadira-web`
2. It shows you a `firebaseConfig` object — keep that tab open

## Step 3 — Enable Firestore

1. Build → **Firestore Database** → Create database
2. Choose **Start in test mode** for now (we lock it down when Auth lands)
3. Region: `us-east1` or whatever is closest

## Step 4 — Wire the config into the app

Copy `.env.example` to `.env` and fill in from the config object:

```
VITE_FIREBASE_API_KEY="AIza..."
VITE_FIREBASE_AUTH_DOMAIN="yadira-xxxx.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="yadira-xxxx"
VITE_FIREBASE_STORAGE_BUCKET="yadira-xxxx.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="1234567890"
VITE_FIREBASE_APP_ID="1:1234567890:web:abc123"
```

Restart the dev server. Console will say:
`[Yadira] Firebase connected — cloud sync active.`

## Step 5 — Verify the magic

Open the app in **two different browsers** (or your phone + laptop). Add a memory in one — watch it appear in the other in real time. That's the caregiver-phone / patient-tablet story, live.

## What changed in the code

- `src/types.ts` — shared interfaces (extracted from App.tsx)
- `src/lib/firebase.ts` — Firebase init with graceful fallback
- `src/lib/useStore.ts` — `useStoreList` / `useStoreDoc` hooks (Firestore + localStorage mirror)
- `src/App.tsx` — four localStorage blocks replaced with hooks; **caregiver profile now persists** (it previously reset to Eleanor/Thomas on every refresh)

## Next up (not yet built)

- Firebase Auth for caregiver accounts (`circleId` per household instead of `default-circle`)
- Firestore security rules (currently test mode — fine for demo, not for real patient data)
- Google Calendar integration on the server layer
