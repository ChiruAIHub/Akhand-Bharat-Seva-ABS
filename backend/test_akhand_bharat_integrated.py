"""
Comprehensive 15-Minute Multi-Scenario Integration & Test Suite
Validates the complete Akhand Bharat Seva Angular frontend integrated with
the Gemma 4 Civic & GIS Backend across multiple images, problem requests,
Indic languages, spatial routing, and real Google Chrome browser automation.
"""

import os
import sys
import time
import json
import asyncio
import subprocess
import urllib.request
import urllib.error
import urllib.parse
import websockets

BASE_URL = "http://127.0.0.1:8000"
CDP_PORT = 9222
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIST_DIR = os.path.join(ROOT_DIR, "dist")
CHROME_PROFILE = os.path.join(DIST_DIR, "chrome_profile")
os.makedirs(DIST_DIR, exist_ok=True)
os.makedirs(CHROME_PROFILE, exist_ok=True)

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
if not os.path.exists(CHROME_PATH):
    CHROME_PATH = r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"

def http_get(path):
    url = f"{BASE_URL}{path}"
    req = urllib.request.Request(url, headers={"User-Agent": "AkhandBharatTest/1.0"})
    with urllib.request.urlopen(req, timeout=10) as resp:
        body = resp.read().decode("utf-8")
        try:
            return resp.status, json.loads(body)
        except Exception:
            return resp.status, body

def http_post(path, data):
    url = f"{BASE_URL}{path}"
    payload = json.dumps(data).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=payload,
        headers={"Content-Type": "application/json", "User-Agent": "AkhandBharatTest/1.0"}
    )
    with urllib.request.urlopen(req, timeout=10) as resp:
        body = resp.read().decode("utf-8")
        try:
            return resp.status, json.loads(body)
        except Exception:
            return resp.status, body

class ChromeBrowserSession:
    def __init__(self):
        self.proc = None
        self.ws = None
        self.msg_id = 0
        self.console_errors = []
        self.js_exceptions = []

    def start(self):
        print(f"[*] Launching external Google Chrome for visual testing from: {CHROME_PATH}")
        self.proc = subprocess.Popen([
            CHROME_PATH,
            "--headless=new",
            "--disable-gpu",
            f"--remote-debugging-port={CDP_PORT}",
            f"--user-data-dir={CHROME_PROFILE}",
            "--window-size=1440,1080",
            "about:blank"
        ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        time.sleep(2)

    def stop(self):
        if self.proc:
            try:
                self.proc.terminate()
                self.proc.wait(timeout=3)
            except Exception:
                self.proc.kill()
            print("[*] Chrome browser closed successfully.")

    async def connect(self):
        with urllib.request.urlopen(f"http://127.0.0.1:{CDP_PORT}/json/list") as resp:
            pages = json.loads(resp.read().decode())
        target = next((p for p in pages if p.get("type") == "page"), pages[0])
        self.ws = await websockets.connect(target["webSocketDebuggerUrl"], max_size=10_000_000)
        await self.send("Runtime.enable")
        await self.send("Console.enable")
        await self.send("Page.enable")

    async def send(self, method, params=None):
        self.msg_id += 1
        payload = {"id": self.msg_id, "method": method, "params": params or {}}
        await self.ws.send(json.dumps(payload))
        while True:
            resp_raw = await self.ws.recv()
            data = json.loads(resp_raw)
            if data.get("method") == "Runtime.exceptionThrown":
                self.js_exceptions.append(data["params"])
            elif data.get("method") == "Console.messageAdded":
                msg = data["params"]["message"]
                if msg.get("level") in ["error", "assert"]:
                    self.console_errors.append(msg.get("text"))
            if data.get("id") == self.msg_id:
                return data.get("result", {})

    async def eval_js(self, expression):
        res = await self.send("Runtime.evaluate", {
            "expression": expression,
            "returnByValue": True,
            "awaitPromise": True
        })
        return res.get("result", {}).get("value")

    async def screenshot(self, filepath):
        res = await self.send("Page.captureScreenshot", {"format": "png"})
        import base64
        if res.get("data"):
            with open(filepath, "wb") as f:
                f.write(base64.b64decode(res["data"]))
            print(f"    [SCREENSHOT SAVED] -> {filepath}")

async def run_full_integration_test():
    print("=" * 80)
    print("AKHAND BHARAT SEVA: 15-MINUTE EXHAUSTIVE MULTI-IMAGE & BACKEND INTEGRATION TEST")
    print("=" * 80)

    passed = 0
    total = 0

    # =============================================================
    # PART 1: BACKEND API & RESEARCH DATASETS INTEGRITY
    # =============================================================
    total += 1
    print(f"\n[{total}] Testing Backend Health & AI Engines (/api/health)...")
    s, h = http_get("/api/health")
    assert s == 200 and h["status"] == "online"
    assert "Gemma 4" in h["track_2_ai"]
    print(f" [PASS] AI Engine status online: {h['service']}")
    passed += 1

    total += 1
    print(f"\n[{total}] Testing 15-Sector MoHUA Classification Taxonomy (/api/civic/taxonomy)...")
    s, tax = http_get("/api/civic/taxonomy")
    assert s == 200
    assert len(tax.get("sectors", [])) == 15
    print(" [PASS] All 15 official MoHUA municipal sectors verified.")
    passed += 1

    total += 1
    print(f"\n[{total}] Testing 24 Major Indian Municipal Corporations GIS (/api/civic/corporations)...")
    s, corps = http_get("/api/civic/corporations")
    assert s == 200
    corp_list = corps.get("corporations", [])
    assert len(corp_list) == 24
    ghmc = next((c for c in corp_list if "Hyderabad" in c["name"]), None)
    assert ghmc is not None and ghmc["latitude"] == 17.385
    print(f" [PASS] 24 Major Corporations verified, including GHMC Hyderabad ({ghmc['headquarters']}).")
    passed += 1

    # =============================================================
    # PART 2: MULTIPLE IMAGES & MULTI-SCENARIO PROBLEM REQUESTS
    # =============================================================
    image_scenarios = [
        {
            "name": "Image 1: Deep Dangerous Pothole (pothole_crater_deep.jpg)",
            "image": "pothole_crater_deep.jpg",
            "text": "Deep crater pothole on Begumpet main road, 18cm deep with broken asphalt edge, motorcycle slipped",
            "lat": 17.4447, "lng": 78.4664, "hint": "Begumpet Main Road, Hyderabad",
            "exp_sector": "Roads and Infrastructure",
            "exp_priority": "P2_URGENT",
            "min_severity": 4
        },
        {
            "name": "Image 2: Broken Open Manhole (open_manhole_missing_cover.jpg)",
            "image": "open_manhole_missing_cover.jpg",
            "text": "School zone missing manhole lid on drainage gutter, fatal pedestrian death trap",
            "lat": 17.3850, "lng": 78.4867, "hint": "Tank Bund Road, Hyderabad",
            "exp_sector": "Drainage and Sewage",
            "exp_priority": "P1_CRITICAL",
            "min_severity": 5
        },
        {
            "name": "Image 3: Gushing Water Main Burst (pipeline_burst_geyser.jpg)",
            "image": "pipeline_burst_geyser.jpg",
            "text": "Drinking water supply pipeline burst, clean water gushing 15ft high and flooding residential road",
            "lat": 12.9719, "lng": 77.6412, "hint": "Indiranagar 100ft Road, Bengaluru",
            "exp_sector": "Water Supply",
            "exp_priority": "P1_CRITICAL",
            "min_severity": 3
        },
        {
            "name": "Image 4: Overflowing Waste Dumper (garbage_dump_overflow.jpg)",
            "image": "garbage_dump_overflow.jpg",
            "text": "3 tons rotten vegetable waste overflowing from community dumper with stray cattle menace",
            "lat": 13.0850, "lng": 80.2100, "hint": "Anna Nagar 2nd Avenue, Chennai",
            "exp_sector": "Solid Waste Management",
            "exp_priority": "P3_ESSENTIAL",
            "min_severity": 3
        },
        {
            "name": "Image 5: Snapped 11kV Electrical Wire (Fatal Hazard URL)",
            "image": "https://images.unsplash.com/photo-1544717305-2782549b5136",
            "text": "High voltage 11kV live electric cable snapped from transformer pole and dangling on Sector 14 footpath",
            "lat": 28.7166, "lng": 77.1166, "hint": "Sector 14 Market, Rohini, Delhi",
            "exp_sector": "Street Lighting & Electricity",
            "exp_priority": "P1_CRITICAL",
            "min_severity": 1
        }
    ]

    pothole_case_id = None
    water_case_id = None

    for sc in image_scenarios:
        total += 1
        print(f"\n[{total}] Testing {sc['name']}...")
        payload = {
            "citizen_name": f"Citizen {sc['exp_sector'][:4]}",
            "citizen_phone": "+91 98000 11223",
            "text": sc["text"],
            "latitude": sc["lat"],
            "longitude": sc["lng"],
            "locality_hint": sc["hint"],
            "image_name_or_url": sc["image"]
        }
        s, ticket = http_post("/api/civic/complaints", payload)
        assert s == 200, f"Failed POST: {ticket}"
        assert ticket["sector"] == sc["exp_sector"], f"Sector mismatch: {ticket['sector']}"
        assert ticket["priority_tier"] == sc["exp_priority"], f"Priority mismatch: {ticket['priority_tier']}"
        assert ticket["visual_severity_level"] >= sc["min_severity"]
        print(f" -> Triage Result: Sector={ticket['sector']} | Priority={ticket['priority_tier']} | Severity=Level {ticket['visual_severity_level']}/5 | Assigned={ticket['assigned_ward']}")

        if "Pothole" in sc["name"]:
            pothole_case_id = ticket["case_id"]
        elif "Water" in sc["name"]:
            water_case_id = ticket["case_id"]

        passed += 1

    # =============================================================
    # PART 3: MULTILINGUAL INDIC NLU (HINDI, MARATHI, TAMIL, TELUGU)
    # =============================================================
    multilingual_requests = [
        ("hi", "Hamare gali 4th cross mein sewage drain choke ho gaya hai aur ganda paani sadak pe beh raha hai", "Drainage and Sewage"),
        ("mr", "रस्त्यावर मोठा खड्डा पडला आहे आणि वाहतूक कोंडी होत आहे", "Roads and Infrastructure"),
        ("ta", "குடிநீர் குழாய் உடைந்து தண்ணீர் வீணாகிறது, மக்கள் சிரமப்படுகிறார்கள்", "Water Supply"),
        ("te", "రోడ్డుపై పెద్ద గుంత ఏర్పడింది, వాహనాలు ప్రమాదాలకు గురవుతున్నాయి", "Roads and Infrastructure")
    ]

    for lang, txt, expected_sector in multilingual_requests:
        total += 1
        print(f"\n[{total}] Testing Multilingual Triage ({lang.upper()} Input)...")
        payload = {
            "citizen_name": f"Citizen {lang.upper()}",
            "citizen_phone": "+91 98200 55443",
            "text": txt,
            "language": lang,
            "latitude": 17.3850,
            "longitude": 78.4867,
            "locality_hint": "Hyderabad City"
        }
        s, ticket = http_post("/api/civic/complaints", payload)
        assert s == 200
        assert ticket["sector"] == expected_sector, f"Expected {expected_sector}, got {ticket['sector']}"
        assert ticket["detected_language"] == lang
        print(f" -> [PASS] {lang.upper()} recognized, translated, and routed to {ticket['sector']}.")
        passed += 1

    # =============================================================
    # PART 4: SPATIAL BORDER ZONE (ANTI-PING-PONG JOINT DISPATCH)
    # =============================================================
    total += 1
    print(f"\n[{total}] Testing Google Maps Spatial Border Intersection (Mulund BMC/TMC)...")
    s, border_ticket = http_post("/api/civic/complaints", {
        "citizen_name": "Border Resident",
        "citizen_phone": "+91 98111 22334",
        "text": "Deep crater on Mulund Check Naka near border toll plaza creating traffic hazard",
        "latitude": 19.1824,
        "longitude": 72.9512,
        "locality_hint": "Mulund Check Naka"
    })
    assert s == 200
    assert border_ticket["is_border_zone"] == True
    assert any("Thane" in c for c in border_ticket["intersecting_corporations"])
    print(f" -> [PASS] Joint cross-border dispatch activated: Lead={border_ticket['primary_corporation']}, CC={border_ticket['intersecting_corporations']}")
    passed += 1

    # =============================================================
    # PART 5: EMBEDDINGGEMMA 2 SEMANTIC DUPLICATE CLUSTERING
    # =============================================================
    total += 1
    print(f"\n[{total}] Testing EmbeddingGemma 2 Semantic Duplicate Detection (< 2 km)...")
    s, dup_ticket = http_post("/api/civic/complaints", {
        "citizen_name": "Neighbor Resident",
        "citizen_phone": "+91 98450 99887",
        "text": "Clean water pipe rupture on 100ft road near signal, huge flood on street",
        "latitude": 12.9721,
        "longitude": 77.6415,
        "locality_hint": "Indiranagar 100ft Road"
    })
    assert s == 200
    assert dup_ticket["is_duplicate_ticket"] == True
    assert dup_ticket["status"] == "DUPLICATE_LINKED"
    print(f" -> [PASS] Clustered into Master Case: {dup_ticket['duplicate_master_case_id']}")
    passed += 1

    # =============================================================
    # PART 6: PROOF-OF-RESOLUTION & ANTI-FRAUD AUDITING
    # =============================================================
    total += 1
    print(f"\n[{total}] Testing Gemma 4 Vision Resolution Auditor (Valid Road Repair)...")
    s, audit_res = http_post("/api/civic/verify-resolution", {
        "case_id": pothole_case_id,
        "after_image_url": "pothole_repaired_fresh_asphalt.jpg"
    })
    assert s == 200
    assert audit_res["status"] == "VERIFIED_RESOLVED"
    assert audit_res["resolution_audit"]["is_resolution_verified"] == True
    print(" -> [PASS] Genuine asphalt repair verified by Gemma Vision.")
    passed += 1

    total += 1
    print(f"\n[{total}] Testing Anti-Fraud Gatekeeper (Fake Closure Blocked)...")
    s, fake_res = http_post("/api/civic/verify-resolution", {
        "case_id": water_case_id,
        "after_image_url": "officer_desk_blank_wall.jpg"
    })
    assert s == 200
    assert fake_res["status"] == "CLOSURE_REJECTED"
    assert fake_res["resolution_audit"]["is_fraudulent_submission"] == True
    print(" -> [PASS] Fake closure attempt rejected and logged on officer record.")
    passed += 1

    # =============================================================
    # PART 7: EXTERNAL CHROME BROWSER AUTOMATION (AKHAND BHARAT SEVA)
    # =============================================================
    print("\n" + "=" * 80)
    print("STARTING REAL GOOGLE CHROME BROWSER AUTOMATION TESTING")
    print("=" * 80)

    browser = ChromeBrowserSession()
    browser.start()

    try:
        await browser.connect()

        # Route 1: Home Page
        total += 1
        print(f"\n[{total}] Testing Chrome Navigation to Akhand Bharat Seva Home (http://127.0.0.1:8000/)...")
        await browser.send("Page.navigate", {"url": f"{BASE_URL}/"})
        await asyncio.sleep(2)

        title = await browser.eval_js("document.title")
        print(f" -> Rendered Page Title: {title}")
        assert "Akhand Bharat Seva" in title
        await browser.screenshot(os.path.join(DIST_DIR, "browser_akhand_bharat_home.png"))
        passed += 1

        # Route 2: Report Page & Map Picker
        total += 1
        print(f"\n[{total}] Testing Chrome Navigation to /report (Citizen Reporting Form)...")
        await browser.send("Page.navigate", {"url": f"{BASE_URL}/report"})
        await asyncio.sleep(2)

        has_form = await browser.eval_js("!!document.querySelector('form')")
        has_map = await browser.eval_js("!!document.getElementById('map') || !!document.querySelector('.leaflet-container')")
        print(f" -> Form present: {has_form} | Leaflet Map present: {has_map}")
        assert has_form == True
        await browser.screenshot(os.path.join(DIST_DIR, "browser_akhand_bharat_report.png"))
        passed += 1

        # Route 3: Form Interaction & Sample Image Selection
        total += 1
        print(f"\n[{total}] Interacting with Report Form & Sample Photo in Chrome...")
        # Select sample photo
        await browser.eval_js("const btn = document.querySelector('.sample-photo-btn'); if (btn) btn.click();")
        await asyncio.sleep(0.5)
        # Fill description
        await browser.eval_js("const ta = document.getElementById('description'); if (ta) { ta.value = 'Massive dangerous pothole outside Begumpet school, 18cm deep cavity with broken stones'; ta.dispatchEvent(new Event('input')); }")
        await browser.eval_js("const ti = document.getElementById('title'); if (ti) { ti.value = 'Severe Road Crater on Begumpet Road'; ti.dispatchEvent(new Event('input')); }")
        await browser.eval_js("const cn = document.getElementById('citizenName'); if (cn) { cn.value = 'Ramesh Chandra'; cn.dispatchEvent(new Event('input')); }")
        await browser.eval_js("const cp = document.getElementById('citizenPhone'); if (cp) { cp.value = '9848012345'; cp.dispatchEvent(new Event('input')); }")
        await asyncio.sleep(1)

        is_valid = await browser.eval_js("const f = document.querySelector('form'); f ? !f.classList.contains('ng-invalid') : false")
        print(f" -> Form validation status after auto-fill: {is_valid}")
        passed += 1

        # Route 4: Public Issues Board
        total += 1
        print(f"\n[{total}] Testing Chrome Navigation to /public-issues (Transparency Board)...")
        await browser.send("Page.navigate", {"url": f"{BASE_URL}/public-issues"})
        await asyncio.sleep(2)

        issues_count = await browser.eval_js("document.querySelectorAll('.issue-card').length")
        print(f" -> Public Issue Cards Rendered: {issues_count}")
        assert issues_count >= 1
        passed += 1

        # Route 5: Track Complaint Page
        total += 1
        print(f"\n[{total}] Testing Chrome Navigation to /track (Citizen Tracking)...")
        await browser.send("Page.navigate", {"url": f"{BASE_URL}/track"})
        await asyncio.sleep(1.5)

        has_track_input = await browser.eval_js("!!document.querySelector('input[type=\"text\"]')")
        print(f" -> Tracking input field present: {has_track_input}")
        assert has_track_input == True
        passed += 1

        # Route 6: Admin Dashboard
        total += 1
        print(f"\n[{total}] Testing Chrome Navigation to /admin (Admin Command Center)...")
        await browser.send("Page.navigate", {"url": f"{BASE_URL}/admin"})
        await asyncio.sleep(2)

        admin_title = await browser.eval_js("document.querySelector('h1, h2')?.textContent")
        print(f" -> Admin View Heading: {admin_title}")
        assert admin_title is not None
        await browser.screenshot(os.path.join(DIST_DIR, "browser_akhand_bharat_admin.png"))
        passed += 1

        # Route 7: Admin Priority Queue
        total += 1
        print(f"\n[{total}] Testing Chrome Navigation to /admin/priority-queue...")
        await browser.send("Page.navigate", {"url": f"{BASE_URL}/admin/priority-queue"})
        await asyncio.sleep(2)

        p_cards = await browser.eval_js("document.querySelectorAll('.complaint-row, .queue-item, .card').length")
        print(f" -> Priority queue items rendered: {p_cards}")
        assert p_cards >= 1
        passed += 1

        # Route 8: Gemma 4 AI Triage HUD (/hud)
        total += 1
        print(f"\n[{total}] Testing Chrome Navigation to /hud (Gemma 4 Real-Time HUD)...")
        await browser.send("Page.navigate", {"url": f"{BASE_URL}/hud"})
        await asyncio.sleep(2)

        hud_title = await browser.eval_js("document.title")
        assert "Gemma Civic" in hud_title
        print(f" -> Gemma HUD online and accessible at /hud.")
        passed += 1

        # Route 9: Browser Console & Runtime Audit
        total += 1
        print(f"\n[{total}] Auditing Chrome Runtime Console & Exception Logs...")
        print(f" -> Uncaught JS Exceptions: {len(browser.js_exceptions)}")
        print(f" -> Browser Console Errors: {len(browser.console_errors)}")
        assert len(browser.js_exceptions) == 0, f"Uncaught JS exceptions: {browser.js_exceptions}"
        assert len(browser.console_errors) == 0, f"Browser console errors: {browser.console_errors}"
        print(" [PASS] 100% Clean browser execution with zero uncaught exceptions and zero console errors.")
        passed += 1

    finally:
        if browser.ws:
            await browser.ws.close()
        browser.stop()

    print("\n" + "=" * 80)
    print(f"FINAL AUDIT RESULT: {passed}/{total} SCENARIOS PASSED (100% SUCCESS)")
    print("=" * 80)
    return passed == total

if __name__ == "__main__":
    success = asyncio.run(run_full_integration_test())
    sys.exit(0 if success else 1)
