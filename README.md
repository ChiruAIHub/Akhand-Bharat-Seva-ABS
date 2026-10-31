# GitLaunch & Gemma Civic AI Hub

> **Hacktoberfest Hack Day 2026 @ Newton School of Technology (SMRU × MLH)**  
> **Unified Dual-Track Production Repository**  
> **Track 1:** Best Open-Source AI Product (GitLaunch Hub — OpenCode Nemotron 120B)  
> **Track 2:** Civic Complaint Triage & Municipal Routing with Google Gemma 4 (E4B / 12B Multimodal + EmbeddingGemma 2)  
> **License:** MIT License  

---

## 🌟 Executive Overview

This repository hosts a unified, full-stack, AI-powered system designed and built for **Hacktoberfest 2026**:

1. **Track 1 (GitLaunch AI Hub)**: An aggregator and intelligent matching engine across 70+ open-source AI projects (GitHub, Hugging Face, Ollama, vLLM, OpenRouter, ModelScope, Kaggle, Cerebras, Groq). Provides 1-click direct repository links and automated step-by-step contribution roadmaps powered by OpenCode Nemotron 120B.
2. **Track 2 (Gemma Civic Triage & Municipal Router)**: An end-to-end municipal grievance resolution engine built on **Google Gemma 4**. It classifies citizen grievances across the **15 official MoHUA urban sectors**, computes physical infrastructure damage severity using **Gemma 4 12B Vision (Level 1–5)**, executes **Google Maps GIS spatial routing** across 24 major Indian Municipal Corporations with **Anti-Ping-Pong joint dispatch** for border zones, clusters duplicate reports using **EmbeddingGemma 2**, and stops fraudulent closures with a **Gemma 4 Vision Proof-of-Resolution Auditor**.

---

## 🏛️ Track 2 Architecture: How Gemma Powers Civic Governance

Gemma 4 serves as the **unstructured reasoning and multimodal intelligence core**, while deterministic application logic manages databases, GIS geometry, and SLA countdown timers:

```
Citizen Grievance (Voice / Text / Hinglish + Photo + GPS)
                           │
                           ▼
  ┌────────────────────────────────────────────────────────┐
  │ 1. Gemma 4 E4B / 12B Instruct Multilingual NLU         │
  │    - Language Auto-Detection (Hindi, Marathi, Tamil)   │
  │    - 15-Sector All-India MoHUA Taxonomy Mapping       │
  │    - Extracted Street Entities & English Translation    │
  └────────────────────────┬───────────────────────────────┘
                           │
                           ▼
  ┌────────────────────────────────────────────────────────┐
  │ 2. Gemma 4 12B Multimodal Physical Severity Scoring   │
  │    - Visual Inspection: Cavity Depth, Area, Hazard     │
  │    - 5-Level Scale (Level 1 Minor to Level 5 Critical)  │
  │    - Actionable Field Crew Repair Instructions          │
  └────────────────────────┬───────────────────────────────┘
                           │
                           ▼
  ┌────────────────────────────────────────────────────────┐
  │ 3. Fatal Life-Safety Hazard Gatekeeper                 │
  │    - Missing Manholes, 11kV Fallen Wires, Gas Leaks    │
  │    - Immediate override -> P1_CRITICAL (4-Hour SLA)    │
  └────────────────────────┬───────────────────────────────┘
                           │
                           ▼
  ┌────────────────────────────────────────────────────────┐
  │ 4. Google Maps Spatial GIS & Border Intersection Scan │
  │    - Haversine Distance to 24 Major Indian Centroids   │
  │    - Border Buffer Detection (BMC/TMC, PMC/PCMC, MCD)  │
  │    - Anti-Ping-Pong Mode: Joint Cross-Border Dispatch  │
  │    - Direct Ward Junior Engineer Assignment            │
  └────────────────────────┬───────────────────────────────┘
                           │
                           ▼
  ┌────────────────────────────────────────────────────────┐
  │ 5. 5-Tier Priority Queue & Dynamic Monsoon Multiplier   │
  │    - P1 Critical (4h), P2 Urgent (24h), P3 (48h), etc. │
  │    - Citizen Charter vs Praja 10-Year Empirical Benchmark│
  │    - June–Sept Monsoon Surge: +1 Tier Auto-Escalation  │
  └────────────────────────┬───────────────────────────────┘
                           │
                           ▼
  ┌────────────────────────────────────────────────────────┐
  │ 6. EmbeddingGemma 2 Semantic Duplicate Clustering      │
  │    - Vectorizes complaint text & concept synsets       │
  │    - Merges neighbor reports within 2 km radius        │
  │    - Prevents redundant municipal field dispatches     │
  └────────────────────────┬───────────────────────────────┘
                           │
                           ▼
  ┌────────────────────────────────────────────────────────┐
  │ 7. Gemma 4 Vision Proof-of-Resolution Auditor          │
  │    - Compares Initial Damage Photo vs Field Work Photo  │
  │    - Genuine Repairs -> VERIFIED_RESOLVED              │
  │    - Blank/Desk Photos -> CLOSURE_REJECTED (Fraud Log) │
  └────────────────────────────────────────────────────────┘
```

---

## 📊 Datasets & Research Foundations Integrated

All models, schemas, and engines in this codebase directly integrate the official research and benchmarks provided:

1. **15-Sector All-India Taxonomy (`data/civic_sectors_taxonomy.json`)**:
   - Official Ministry of Housing & Urban Affairs (MoHUA) classification: Water Supply, Roads & Traffic, Solid Waste Management, Drainage & Sewerage, Street Lighting, Public Health, Stormwater Drains, Encroachments, Building Sanctions, Parks & Gardens, Animal Control, Vector Control, Revenue, Slum Rehabilitation, and Disaster Management.
2. **24 Major Municipal Corporations GIS (`data/municipal_corporations_gis.json`)**:
   - Geographic centroids, administrative areas, radius buffer bands (5 km, 10 km, 25 km, 50 km), Local Government Directory (LGD) codes, administrative wards, and identified border intersection pairs (e.g. BMC Mumbai & TMC Thane; PMC Pune & PCMC Pimpri; MCD Delhi & GMC Ghaziabad; BBMP Bangalore).
3. **Citizen Charters & Praja 10-Year Empirical Benchmarks (`data/civic_sla_benchmarks.json`)**:
   - Compares theoretical Citizen Charter SLAs (e.g. 48 hours for potholes) against real-world 10-year CCRS audit averages (Mumbai: 64 days; Mohali: 13 days; Chennai: 28 days).
   - Dynamic Monsoon Rule: Auto-escalates waterlogging, drainage chokes, and potholes by +1 priority tier during June–September.

---

## 🚀 Quickstart & Demo Execution

### 1. Requirements & Setup
```bash
# Clone or navigate to the repository
cd C:\Users\Techcho\.gemini\antigravity\scratch\gitlaunch-contribution-finder

# Install dependencies
pip install -r requirements.txt
```

### 2. Run the Verification Test Suites
```bash
# Run Track 2 Gemma Civic Engine Test Suite (8/8 automated test cases)
python backend/test_civic_engine.py
```
Expected output:
```text
================================================================================
TRACK 2 AUDIT VERDICT: 8/8 TESTS PASSED (100% SUCCESS)
================================================================================
```

### 3. Launch the Unified Web Dashboard
```bash
cd backend
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
Open **[http://127.0.0.1:8000](http://127.0.0.1:8000)** in any web browser.

---

## 🖥️ Live UI Demo Features

Use the header navigation tab to toggle between Track 1 and Track 2:

### Track 2: Civic Triage & Municipal Router
- **1-Click Test Presets**:
  - `🚨 P1 Open Manhole (Bandra BMC)`: Triggers life-safety bypass to P1 Critical (4-hour SLA).
  - `💧 P2 Water Main Burst (BBMP Indiranagar)`: Triggers major supply disruption SLA (24h).
  - `🛣️ Border Pothole (Mulund BMC/TMC)`: Demonstrates Google Maps spatial border intersection detection and Anti-Ping-Pong Joint Cross-Border Dispatch!
  - `⚡ P1 Live Wire Hazard (MCD Rohini)`: Snapped 11kV cable safety override.
  - `🗣️ Hinglish Gali Sewage (PMC Shivajinagar)`: Shows Gemma multilingual NLU translating Hinglish into standard MoHUA drainage dispatch.
  - `🗑️ P3 Waste Dump Overflow (GCC Anna Nagar)`: Solid waste community dumper triage.
- **Multimodal Visual Severity**: Toggle between sample photos (Deep Crater, Open Manhole, Live Wire, Waste Dump) to watch Gemma 4 12B Vision score physical damage on a 1–5 scale.
- **Google Maps Spatial GIS**: Select any city from the dropdown or adjust coordinates to see live Haversine distance, assigned ward, and officer routing.
- **EmbeddingGemma 2 Deduplication**: Submitting a nearby complaint clusters into the master ticket.
- **Gemma Vision Proof-of-Resolution Auditor**: Click "Audit & Verify" on any ticket to test valid repair verification vs fake closure fraud detection!

### Track 1: GitLaunch Open-Source AI Hub
- **70+ Curated Repositories**: Filter across GitHub, Hugging Face, Ollama, vLLM, OpenRouter, and ModelScope.
- **1-Click Direct Repo Links**: Instantly jump to any upstream repository.
- **AI Contribution Roadmap**: Generates git clone/branch commands and a pre-filled PR template via OpenCode Nemotron 120B.

---

## 🔄 Multi-Laptop Team Synchronization

- **Sync to External Hard Drive (Drive D:)**:
  ```bash
  # Double-click scripts/sync-to-drive-d.bat OR run in PowerShell:
  powershell -ExecutionPolicy Bypass -File scripts/sync-to-drive-d.ps1
  ```
- **Pull Latest Code on Second Laptop**:
  ```bash
  # Connect Drive D: to the second laptop and run:
  powershell -ExecutionPolicy Bypass -File scripts/pull-from-drive-d.ps1
  ```
- **Offline Self-Contained Bundle**:
  A complete zip snapshot is packaged at `dist/Hacktoberfest2026_Full_Track1_Track2_Latest.zip` for instant sharing via USB, Wi-Fi, or Google Drive.

---

## 🌐 Live Cloudflare Deployment & Access Points

The application is published to the public internet using **Cloudflare Tunnel** (`cloudflared`):

- **Live Public URL**: [https://layer-latino-release-decrease.trycloudflare.com](https://layer-latino-release-decrease.trycloudflare.com)
- **Local Dev Server**: [http://127.0.0.1:8000/](http://127.0.0.1:8000/)
- **Municipal Officer Login**: [http://127.0.0.1:8000/admin/login](http://127.0.0.1:8000/admin/login) *(or [Cloudflare Admin Login](https://layer-latino-release-decrease.trycloudflare.com/admin/login))*
- **Admin GIS Command Map**: [http://127.0.0.1:8000/admin/map](http://127.0.0.1:8000/admin/map) *(or [Cloudflare Admin Map](https://layer-latino-release-decrease.trycloudflare.com/admin/map))*
- **Quick Launch Bar**: Embedded directly on the main site `http://127.0.0.1:8000/` for instant 1-click access to all portals.

To launch the tunnel anytime, double-click `START_CLOUDFLARE_TUNNEL.bat`.

---

## 🔐 Municipal Officer Authentication Gateway

Access to administrative features (`/admin/*`) is strictly guarded by the Municipal Officer Gateway:

- **Login Portal**: `http://127.0.0.1:8000/admin/login`
- **Security Mechanism**: Cryptographic HMAC-SHA256 session tokens with tamper-proof signature validation.
- **Roster of Authorized Municipal Personnel**:

| Officer Name | Department | Official Email | Access Code | Role |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | Zonal Administration (AD) | `rajeshwar.ias@hyderabad.gov.in` | `GHMC-IAS-9081` | Full Command & Control |
| **Control Room Commander** | Central Command (CR) | `admin.command@hyderabad.gov.in` | `GHMC-HQ-4421` | Emergency Dispatch |
| **V. Ramesh** | Executive Engineer, HMWSSB (VR) | `water.dept@hyderabad.gov.in` | `GHMC-HMWSSB-1032` | Water Supply & Drainage |
| **A. Radhika** | Superintending Engineer, R&B (AR) | `roads.dept@hyderabad.gov.in` | `GHMC-RND-5541` | Roads, Potholes & Bridges |

---

## 🏆 Hackathon Submission Highlights

1. **Deep Gemma 4 Integration**: Demonstrates Gemma across text (NLU), vision (12B multimodal physical inspection), and vector embeddings (EmbeddingGemma 2 semantic deduplication).
2. **Empirical Indian Urban Governance**: Rooted in actual MoHUA Swachhata taxonomies and Praja Foundation 10-year CCRS audit datasets.
3. **Solves the "Municipal Ping-Pong" Problem**: The Google Maps border intersection engine issues joint cross-border dispatches so border residents are never bounced between rival corporations.
4. **Anti-Fraud Work Verification**: First civic platform to use vision AI to verify genuine physical road restoration before marking complaints resolved.
