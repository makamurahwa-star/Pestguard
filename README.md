# PestGuard 🌱

**AI-powered pest monitoring for Zimbabwean farmers.**

Snap a photo of any insect → identify the pest → see treatments → report outbreaks on a live map → connect with emergency services.

Single-user web application (farmer role). Designed mobile-first but works equally well on a desktop browser.

---

## Quick start (one command)

### Windows

```cmd
start.bat
```

### Linux / macOS

```bash
./start.sh
```

The script installs everything on first run (Python venv + npm packages), then starts:

- **Backend** at `http://localhost:5000`
- **Frontend** at `http://localhost:5173`
- A **LAN URL** like `http://192.168.x.x:5173` so you can open it from your phone

Open the frontend URL in your browser. Create an account, sign in, and you're in.

---

## Use it from your phone (same Wi-Fi)

1. Run `start.bat` (or `start.sh`) on your dev machine.
2. The launcher prints a **LAN URL** like `http://192.168.1.42:5173`.
3. Connect your phone to the **same Wi-Fi network** as the dev machine.
4. Open that URL on your phone's browser.

The phone gets the **rear camera prompt** when you tap "Use Camera" on the Check Crops page, and the **gallery picker** when you tap "From Gallery".

> If the phone can't reach the URL, check your dev machine's firewall — Windows Defender often blocks inbound 5173/5000 the first time. Allow Python and Node through the firewall when prompted.

---

## Plugging in your YOLO model

The app ships with a deterministic **mock predictor** so the UI is fully usable while you wait to integrate your model. Once you have your trained YOLO model:

1. Drop your `.pt` file into:
   ```
   backend/ml_model/pestguard_model.pt
   ```
   (or set the `MODEL_PATH` environment variable to point elsewhere).

   Your model can be either a **detection** or **classification** YOLO model — Ultralytics handles both, and the backend reads the task type automatically.

2. Install Ultralytics:
   ```bash
   cd backend
   pip install -r requirements-ml.txt
   ```
   > Use Python **3.10**, **3.11** or **3.12** — Ultralytics and Torch don't yet support 3.13+. On unsupported versions the model gracefully falls back to the mock predictor.

3. Restart the backend. The log should show:
   ```
   [ML] Loaded YOLO model from .../pestguard_model.pt
   [ML] Task: detect, Classes: 102
   ```
   And the Check Crops page badge flips to "Powered by your YOLO model".

### Model contract

- A YOLOv8 detection or classification model (`.pt` file)
- Class names embedded in the model (Ultralytics saves them automatically during training)
- Detection confidence threshold: **0.25** (set in `ml_service.py`)
- Max detections per image: **10**

### What the detection model gives you

When a detection model is loaded, the Check Crops page does more than just classify:
- It draws **bounding boxes** over the detected pests in the photo
- If multiple pests are in one image, it lists them all
- The "not a pest" warning triggers when zero boxes pass the confidence threshold — much more reliable than for a classifier

---

## "Not a pest" detection

When the AI sees a photo that isn't actually a pest (a face, a chair, a landscape), it would normally guess something nonsensical. With the **YOLO detection model**, this is now very reliable: when zero bounding boxes pass the confidence threshold of 0.25, the scan is rejected with a friendly **"We couldn't find a pest in this image"** warning, and the user is prompted to upload a clearer photo. No noise is added to scan history.

This check only runs when the real model is loaded — the mock predictor returns a fake box by design so the UI flow can still be tested end-to-end.

---

## Project structure

```
pestguard/
├── start.bat / start.sh          ← one-command launcher
├── README.md                     ← you are here
│
├── backend/                      ← Flask API + SQLite
│   ├── app.py                    ← entry point (binds 0.0.0.0:5000)
│   ├── config.py
│   ├── models.py                 ← User, Scan, Report, EmergencyContact
│   ├── ml_service.py             ← TF model loader + "not a pest" detector
│   ├── routes_auth.py            ← /api/auth/*
│   ├── routes_scans.py           ← /api/scans/*
│   ├── routes_reports.py         ← /api/reports/* + /map + /stats
│   ├── routes_misc.py            ← /api/contacts/* + /api/pestdata/*
│   ├── requirements.txt
│   ├── requirements-ml.txt       ← optional, TensorFlow
│   ├── ml_model/                 ← drop your .h5 model here
│   └── pestdata/
│       └── ip102_pests.json      ← IP102 pest library (~100 species)
│
└── frontend/                     ← React + Vite + Tailwind
    ├── package.json
    ├── vite.config.js            ← binds 0.0.0.0:5173, proxies /api
    ├── tailwind.config.js
    └── src/
        ├── App.jsx               ← routes
        ├── main.jsx
        ├── components/
        │   ├── AppLayout.jsx     ← fading top nav bar
        │   └── Logo.jsx
        ├── context/
        │   ├── AuthContext.jsx
        │   └── PestDataContext.jsx
        ├── lib/api.js
        └── pages/
            ├── Login.jsx         ← field background + motivation quotes
            ├── Register.jsx
            ├── Dashboard.jsx     ← image-rich tip cards
            ├── CheckCrops.jsx    ← camera/gallery + "not a pest" warning
            ├── DetectionMap.jsx  ← Leaflet map of outbreaks
            ├── MyReports.jsx
            ├── NewReport.jsx
            ├── Learn.jsx         ← Pest Library + Reported Outbreaks tabs
            ├── ScanHistory.jsx
            ├── Emergency.jsx     ← hotlines, tel/wa.me links, add contacts
            └── Profile.jsx
```

---

## Sections

| Section          | What it does                                                                                              |
| ---------------- | --------------------------------------------------------------------------------------------------------- |
| **Login**        | Field-photo background + motivational quote cards.                                                        |
| **Dashboard**    | Greeting, your stats, image-rich management tips, quick links to every section.                           |
| **Check Crops**  | Camera (mobile rear cam) OR gallery picker → AI identifies pest → friendly name, treatment cards, severity. Warns if not a pest. Save as a report in one click. |
| **Detection Map** | Live Leaflet map of all active outbreaks across Zimbabwe with severity-colored pins.                     |
| **My Reports**   | Everything you've reported, filterable. Resolve or delete from a detail modal.                           |
| **Learn**        | Two tabs — **Pest Library** (all 100+ IP102 species with full details) and **Reported Outbreaks** (what other farmers near you are seeing). |
| **Scan History** | Grid of every AI scan you've run, with confidence percentages.                                           |
| **Emergency**    | Hotlines with tel:/wa.me/ links, nearest Agritex office, your own emergency contacts.                    |
| **Profile**      | Edit your name/region/farm details and change your password.                                              |

---

## Tech stack

**Backend**
- Flask 3 + SQLAlchemy + Flask-JWT-Extended
- SQLite (auto-creates `pestguard.db` on first run; ready to swap to MySQL — change `DATABASE_URL` in `backend/.env`)
- Ultralytics YOLO (optional, only when your `.pt` model is loaded)
- Pillow + NumPy for image preprocessing

**Frontend**
- React 18 + Vite
- Tailwind CSS with custom forest/earth/cream palette
- React Router v6
- Leaflet + react-leaflet for the Detection Map
- Recharts for stats charts
- Lucide React for icons
- react-hot-toast for notifications

---

## Switching SQLite → MySQL later

When you're ready to deploy:

1. Install the MySQL connector inside your venv:
   ```bash
   pip install pymysql cryptography
   ```

2. Create a `backend/.env` file with:
   ```
   DATABASE_URL=mysql+pymysql://user:password@host/pestguard
   SECRET_KEY=your-real-secret-here
   JWT_SECRET_KEY=another-real-secret
   ```

3. Restart. The app uses SQLAlchemy, so no code changes are needed.

---

## Manual run (without the launcher script)

```bash
# Terminal 1
cd backend
python -m venv venv
source venv/bin/activate           # or: venv\Scripts\activate on Windows
pip install -r requirements.txt
# optional:  pip install -r requirements-ml.txt
python app.py

# Terminal 2
cd frontend
npm install
npm run dev
```

Then open `http://localhost:5173`.

---

## Built by

**Tadiwanashe Murahwa** (R243464E) and **Emmanuel Mamvura** (245400N).
Based on the original PestGuard project specification.

---

## License

Coursework project — University use.
