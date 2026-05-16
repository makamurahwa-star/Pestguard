# Deploy PestGuard to Hugging Face Spaces (combined frontend + backend)

One container. One URL. No CORS. No two-platform juggling.

## What this gives you

- **One URL** like `https://YOUR_USERNAME-pestguard.hf.space`
- Open it on any phone → use directly OR install as a PWA via "Add to Home screen"
- 16 GB RAM, 50 GB persistent disk, free, no card required, no expiry

---

## Step 1: Apply the patch files to your project

Download `hf-combined.zip`, extract it, and overlay onto your existing project:

```powershell
cd C:\dev\pestguard

Expand-Archive -Path "$env:USERPROFILE\Downloads\hf-combined.zip" -DestinationPath "$env:TEMP\hfc" -Force
Copy-Item -Path "$env:TEMP\hfc\hf-combined\*" -Destination "C:\dev\pestguard\" -Recurse -Force
Remove-Item -Recurse -Force "$env:TEMP\hfc"
```

This adds/replaces:
- `Dockerfile` — multi-stage build (Node builds frontend, Python serves it)
- `README.md` — HF Spaces config in YAML frontmatter
- `backend/app.py` — serves frontend static files + API
- `backend/config.py` — production env vars
- `backend/models.py` — image_data field
- `backend/routes_scans.py`, `routes_reports.py` — in-DB image fallback
- `backend/requirements.txt`, `requirements-ml.txt` — gunicorn + CPU-only torch
- `frontend/src/lib/api.js` — uses relative paths (no API URL needed)

## Step 2: Push to GitHub

```powershell
git add .
git commit -m "Combined deployment for Hugging Face Spaces"
git push
```

## Step 3: Create your Hugging Face account

Go to https://huggingface.co/join — 30 seconds, free, no card.

## Step 4: Create a new Space

Go to https://huggingface.co/new-space and fill in:

| Field | Value |
|---|---|
| **Owner** | (your username, auto-filled) |
| **Space name** | `pestguard` |
| **License** | MIT |
| **Space SDK** | **Docker** ← important, NOT Streamlit or Gradio |
| **Docker template** | Blank |
| **Space hardware** | **CPU basic** (free, 16 GB RAM) |
| **Visibility** | Public |

Click **Create Space**.

## Step 5: Get a write token

Hugging Face needs an access token to let you push code:

1. Go to https://huggingface.co/settings/tokens
2. Click **+ Create new token**
3. **Token name**: `vscode` (anything)
4. **Token type**: select **Write**
5. Click **Create token**
6. **Copy the token** (starts with `hf_...`) — you'll see it ONLY ONCE

## Step 6: Push your code to the Space

Back in your VS Code terminal:

```powershell
# Add HF as a second git remote (REPLACE "YOUR_USERNAME" with your HF username)
git remote add huggingface https://huggingface.co/spaces/YOUR_USERNAME/pestguard

# Push to it
git push huggingface main
```

When prompted:
- **Username:** your HF username
- **Password:** paste the `hf_...` token (not your HF login password)

This uploads everything including your 36 MB YOLO model. Takes 2-5 minutes.

## Step 7: Watch the build

Open your Space page in the browser. You'll see "Building..." at the top with
live Docker build logs streaming. **Expect 5-10 minutes** on first build because
Docker has to:

1. Pull `node:20-slim` and `python:3.11-slim` images
2. Install npm packages and build the frontend
3. Install Python deps (torch CPU-only is ~150 MB)
4. Copy in your code + model

When you see **"Running"** at the top — you're live.

## Step 8: Test it

Open your Space URL in a browser:
```
https://YOUR_USERNAME-pestguard.hf.space
```

You should see the PestGuard login page. Register a farmer account, sign in,
and try the Check Crops page.

For a quick health check, visit:
```
https://YOUR_USERNAME-pestguard.hf.space/api/health
```

Should show:
```json
{
  "status": "ok",
  "ml_model": {"loaded": true, "task": "detect", "classes": 102},
  "serving_frontend": true
}
```

If `loaded: true` and `serving_frontend: true` — it all worked. 🌱

## Step 9: Install on your phone

1. Open the Space URL on your phone (same Wi-Fi as your laptop NOT required —
   this is the internet now)
2. **Android Chrome**: ⋮ menu → "Install app" or "Add to Home screen"
3. **iPhone Safari**: Share → "Add to Home Screen"
4. The PestGuard icon appears on your home screen, opens fullscreen.

## Troubleshooting

**Build fails at "npm ci":**
Check `frontend/package-lock.json` exists in your repo and is committed.

**Build fails at "downloading torch":**
HF sometimes rate-limits PyPI. Retry the build (your Space → Settings → Factory rebuild).

**Page loads but API calls fail with 404:**
Check `frontend/src/lib/api.js` — should use relative paths:
```js
const API_BASE = (import.meta.env.VITE_API_URL || '') + '/api'
```
If `VITE_API_URL` is unset, that becomes `/api` (relative) which is correct.

**"loaded": false on /api/health:**
Your `.pt` model didn't get pushed. Check:
```powershell
git ls-files | Select-String "pestguard_model.pt"
```
If empty, your model is in `.gitignore` or was never committed.

**Space went to sleep (50s+ first request):**
That's expected on free tier after 48 hours of no traffic. Hit the URL once
to wake it up before any demo. Stays awake for 48 hours after each visit.

## Going forward

Any push to GitHub `main` does NOT auto-deploy to HF — HF pulls from its own
git remote. To update production, run:

```powershell
git push huggingface main
```

(or just `git push huggingface` for short)

You can script this so `git push` pushes to both at once if you like —
ask me if you want that set up.
