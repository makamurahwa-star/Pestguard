# PestGuard Deployment Guide

Get your app on the internet so anyone can use it on their phone.

## What you'll end up with
- Backend API at `https://pestguard-api.onrender.com`
- Frontend at `https://pestguard.vercel.app`
- Installable as a PWA on any phone

## Files in this folder

Copy these into your existing `C:\dev\pestguard` project, replacing the matching files:

```
backend/
├── requirements.txt          ← adds gunicorn
├── Procfile                   ← tells Render how to start
└── config.py                  ← reads env vars for production

frontend/
├── index.html                 ← adds PWA tags + service worker registration
├── public/
│   ├── manifest.webmanifest   ← PWA manifest
│   ├── sw.js                  ← service worker
│   ├── icon-192.png           ← app icon (Android)
│   ├── icon-512.png           ← app icon (Android splash)
│   └── apple-touch-icon.png   ← app icon (iOS)
└── src/lib/api.js             ← reads VITE_API_URL in production

render.yaml                    ← Render deployment config
vercel.json                    ← Vercel deployment config
```

## Step 1: Push these new files to GitHub

After copying the files in, from `C:\dev\pestguard`:

```powershell
git add .
git commit -m "Production deployment config + PWA"
git push
```

## Step 2: Deploy backend to Render

1. Go to https://render.com and sign in with GitHub
2. Click **New** → **Web Service**
3. Connect your `pestguard` repository
4. Render reads `render.yaml` automatically — most settings are pre-filled
5. Click **Create Web Service**
6. Wait 5–15 minutes for the first build (Torch + Ultralytics are heavy)
7. When done, copy the URL — looks like `https://pestguard-api.onrender.com`
8. Test by visiting `https://pestguard-api.onrender.com/api/health` — should return JSON

## Step 3: Deploy frontend to Vercel

1. Go to https://vercel.com and sign in with GitHub
2. Click **Add New** → **Project**
3. Import your `pestguard` repository
4. In **Environment Variables**, add:
   - Name: `VITE_API_URL`
   - Value: your Render backend URL (e.g. `https://pestguard-api.onrender.com`)
5. Click **Deploy**
6. Wait 1–2 minutes
7. Copy the URL — looks like `https://pestguard.vercel.app`

## Step 4: Lock down CORS

Back in Render dashboard for the API service:

1. Go to **Environment**
2. Find `CORS_ORIGINS` (you set this as "Sync: No" in render.yaml)
3. Set its value to your Vercel URL: `https://pestguard.vercel.app`
4. Save — Render redeploys automatically

## Step 5: Install on your phone

1. Open your Vercel URL in Chrome on your phone
2. **Android**: tap the ⋮ menu → "Install app" or "Add to Home screen"
3. **iPhone**: tap the share button → "Add to Home Screen"
4. The PestGuard icon appears on your home screen
5. Tap it — opens fullscreen, no browser bar, looks like a real app

## Free tier limits

- **Render**: backend sleeps after 15 min of inactivity. First request after sleep takes ~30s to wake up. 750 hrs/month free.
- **Vercel**: never sleeps. Generous free tier.
- **YOLO inference**: ~3–10 seconds per scan on Render's free CPU.

## To remove the sleep behaviour

Upgrade Render to "Starter" plan ($7/month) — keeps the backend awake 24/7
and gives more RAM for faster inference.

## Troubleshooting

**"Application failed to respond" on first visit**
→ Render is waking up. Wait 30 seconds and refresh.

**Frontend loads but Check Crops fails**
→ Check the browser console for CORS errors. Make sure `CORS_ORIGINS` on Render
  matches your Vercel URL exactly (no trailing slash).

**Backend build fails on Render with "torch not found"**
→ Check that `requirements-ml.txt` got pushed to GitHub. The build command in
  `render.yaml` installs both requirements files.

**PWA install prompt doesn't appear**
→ PWAs need HTTPS to install. Both Render and Vercel give you HTTPS automatically,
  so this should "just work" — but only AFTER you visit through the Vercel URL,
  not localhost.
