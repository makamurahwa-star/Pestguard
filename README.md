---
title: PestGuard
emoji: 🌱
colorFrom: green
colorTo: yellow
sdk: docker
app_port: 7860
pinned: false
license: mit
short_description: AI-powered pest monitoring for Zimbabwean farmers
---

# PestGuard 🌱

AI-powered pest monitoring web app for Zimbabwean farmers.

Snap a photo of any insect on your crops, get instant pest identification and
treatment guidance, report outbreaks on a live community map, and connect with
emergency agricultural services.

## Features

- 📷 **AI pest identification** — YOLO model trained on the IP102 dataset (102 species)
- 🗺️ **Live outbreak map** — see what's happening on neighbouring farms in real time
- 📚 **Pest library** — 100+ pests with treatment guidance (organic, chemical, prevention)
- 📞 **Emergency contacts** — direct tap-to-call and WhatsApp links
- 📱 **Mobile-friendly + installable as a PWA**

## Architecture

This Space serves both the backend API and the React frontend from one container:

- Backend: Flask + SQLAlchemy + Ultralytics YOLO
- Frontend: React + Vite + Tailwind, prebuilt and served as static files
- Storage: SQLite + uploads on persistent disk at `/data`
- Port: 7860 (HF Spaces standard)

## Built by

Tadiwanashe Murahwa & Emmanuel Mamvura — University coursework project
