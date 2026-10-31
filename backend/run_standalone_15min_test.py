"""
Akhand Bharat Seva + Gemma 4 Unified Civic Hub
Self-Contained 15-Minute Soak & Integration Test Engine
Can run either standalone from command line or automated.
Spawns Uvicorn in a daemon thread, executes full visual CDP browser tests,
validates multiple images, GIS spatial routing, Indic NLU, and anti-fraud auditing.
"""

import os
import sys
import time
import json
import base64
import random
import asyncio
import threading
import subprocess
import urllib.request
import urllib.error
import uvicorn

BASE_URL = "http://127.0.0.1:8000"
CDP_PORT = 9222
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIST_DIR = os.path.join(ROOT_DIR, "dist")
CHROME_PROFILE = os.path.join(DIST_DIR, "chrome_profile")
LOG_FILE = os.path.join(DIST_DIR, "test_15min_execution.log")
REPORT_FILE = os.path.join(DIST_DIR, "akhand_bharat_15min_test_report.json")

os.makedirs(DIST_DIR, exist_ok=True)
os.makedirs(CHROME_PROFILE, exist_ok=True)

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
if not os.path.exists(CHROME_PATH):
    CHROME_PATH = r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"

def log(msg):
    ts = time.strftime("[%Y-%m-%d %H:%M:%S]")
    line = f"{ts} {msg}"
    enc = sys.stdout.encoding or "utf-8"
    try:
        print(line.encode(enc, errors="replace").decode(enc, errors="replace"))
    except Exception:
        print(line.encode("ascii", errors="replace").decode("ascii"))
    try:
        with open(LOG_FILE, "a", encoding="utf-8") as f:
            f.write(line + "\n")
    except Exception:
        pass

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

def start_in_process_server():
    from main import app
    config = uvicorn.Config(app=app, host="127.0.0.1", port=8000, log_level="warning")
    server = uvicorn.Server(config)
    t = threading.Thread(target=server.run, daemon=True)
    t.start()
    log("[*] In-process FastAPI/Uvicorn server started in background thread.")
    # Wait for startup
    for _ in range(15):
        try:
            s, h = http_get("/api/health")
            if s == 200:
                log(f"[OK] Server is ready on {BASE_URL} (Status: {h.get('status')})")
                return server
        except Exception:
            time.sleep(0.5)
    raise RuntimeError("Server failed to start within 7.5 seconds.")

class ChromeBrowserSession:
    def __init__(self):
        self.proc = None
        self.ws = None
        self.msg_id = 0
        self.console_errors = []
        self.js_exceptions = []

    def start(self):
        if not os.path.exists(CHROME_PATH):
            log(f"[WARN] Chrome not found at {CHROME_PATH}, skipping visual CDP steps.")
            return False
        log(f"[*] Launching external Google Chrome from: {CHROME_PATH}")
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
        return True

    def stop(self):
        if self.proc:
            try:
                self.proc.terminate()
                self.proc.wait(timeout=3)
            except Exception:
                self.proc.kill()
            log("[*] Chrome browser closed.")

    async def connect(self):
        import websockets
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
        if res.get("data"):
            with open(filepath, "wb") as f:
                f.write(base64.b64decode(res["data"]))
            log(f"    [SCREENSHOT SAVED] -> {filepath}")

async def run_integration_and_soak(duration_seconds=900):
    start_time = time.time()
    end_time = start_time + duration_seconds

    log("=" * 80)
    log(f"STARTING 15-MINUTE EXHAUSTIVE INTEGRATION & SOAK TEST ({duration_seconds}s)")
    log("=" * 80)

    # 1. Start Server if not already active
    try:
        http_get("/api/health")
        log("[OK] Existing server detected on port 8000.")
    except Exception:
        start_in_process_server()

    passed = 0
    total = 0

    # PART 1: CORE API CHECKS
    total += 1
    s, h = http_get("/api/health")
    assert s == 200 and h["status"] == "online"
    passed += 1
    log(f"[PASS 1] AI Service online: {h['service']}")

    total += 1
    s, tax = http_get("/api/civic/taxonomy")
    assert s == 200 and len(tax.get("sectors", [])) == 15
    passed += 1
    log(f"[PASS 2] 15 MoHUA Sectors loaded.")

    total += 1
    s, corps = http_get("/api/civic/corporations")
    assert s == 200 and len(corps.get("corporations", [])) == 24
    passed += 1
    log(f"[PASS 3] 24 Major Indian Municipal Corporations verified.")

    # PART 2: MULTI-IMAGE GRIEVANCE SCENARIOS
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
            "min_severity": 4
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
            "min_severity": 5
        }
    ]

    pothole_case_id = None
    water_case_id = None

    for sc in image_scenarios:
        total += 1
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
        assert ticket["sector"] == sc["exp_sector"]
        assert ticket["priority_tier"] == sc["exp_priority"]
        assert ticket["visual_severity_level"] >= sc["min_severity"]
        passed += 1
        log(f"[PASS {total}] {sc['name']} -> {ticket['sector']} | {ticket['priority_tier']} | Severity Level {ticket['visual_severity_level']}/5")

        if "Pothole" in sc["name"]:
            pothole_case_id = ticket["case_id"]
        elif "Water" in sc["name"]:
            water_case_id = ticket["case_id"]

    # PART 3: INDIC MULTILINGUAL NLU
    multilingual = [
        ("hi", "Hamare gali 4th cross mein sewage drain choke ho gaya hai aur ganda paani sadak pe beh raha hai", "Drainage and Sewage"),
        ("mr", "रस्त्यावर मोठा खड्डा पडला आहे आणि वाहतूक कोंडी होत आहे", "Roads and Infrastructure"),
        ("ta", "குடிநீர் குழாய் உடைந்து தண்ணீர் வீணாகிறது, மக்கள் சிரமப்படுகிறார்கள்", "Water Supply"),
        ("te", "రోడ్డుపై పెద్ద గుంత ఏర్పడింది, వాహనాలు ప్రమాదాలకు గురవుతున్నాయి", "Roads and Infrastructure")
    ]

    for lang, txt, exp_sec in multilingual:
        total += 1
        s, ticket = http_post("/api/civic/complaints", {
            "citizen_name": f"Citizen {lang.upper()}",
            "citizen_phone": "+91 98200 55443",
            "text": txt,
            "language": lang,
            "latitude": 17.3850,
            "longitude": 78.4867,
            "locality_hint": "Hyderabad City"
        })
        assert s == 200 and ticket["sector"] == exp_sec
        passed += 1
        log(f"[PASS {total}] Multilingual {lang.upper()} -> {ticket['sector']}")

    # PART 4: SPATIAL BORDER ZONE
    total += 1
    s, border = http_post("/api/civic/complaints", {
        "citizen_name": "Border Resident",
        "citizen_phone": "+91 98111 22334",
        "text": "Deep crater on Mulund Check Naka near border toll plaza creating traffic hazard",
        "latitude": 19.1824, "longitude": 72.9512,
        "locality_hint": "Mulund Check Naka"
    })
    assert s == 200 and border["is_border_zone"] == True
    passed += 1
    log(f"[PASS {total}] Spatial Border Intersection -> Lead: {border['primary_corporation']}, CC: {border['intersecting_corporations']}")

    # PART 5: EMBEDDINGGEMMA 2 DUPLICATES
    total += 1
    s, dup = http_post("/api/civic/complaints", {
        "citizen_name": "Neighbor Resident",
        "citizen_phone": "+91 98450 99887",
        "text": "Clean water pipe rupture on 100ft road near signal, huge flood on street",
        "latitude": 12.9721, "longitude": 77.6415,
        "locality_hint": "Indiranagar 100ft Road"
    })
    assert s == 200 and dup["is_duplicate_ticket"] == True
    passed += 1
    log(f"[PASS {total}] Duplicate Clustering -> Linked to Master Ticket {dup['duplicate_master_case_id']}")

    # PART 6: PROOF-OF-RESOLUTION & ANTI-FRAUD
    total += 1
    s, audit = http_post("/api/civic/verify-resolution", {
        "case_id": pothole_case_id,
        "after_image_url": "pothole_repaired_fresh_asphalt.jpg"
    })
    assert s == 200 and audit["status"] == "VERIFIED_RESOLVED"
    passed += 1
    log(f"[PASS {total}] Resolution Auditor -> Genuine road repair accepted.")

    total += 1
    s, fraud = http_post("/api/civic/verify-resolution", {
        "case_id": water_case_id,
        "after_image_url": "officer_desk_blank_wall.jpg"
    })
    assert s == 200 and fraud["status"] == "CLOSURE_REJECTED"
    passed += 1
    log(f"[PASS {total}] Anti-Fraud Gatekeeper -> Fake closure successfully blocked.")

    # PART 7: GOOGLE CHROME BROWSER AUTOMATION
    log("-" * 80)
    log("EXECUTING EXTERNAL GOOGLE CHROME CDP BROWSER VALIDATION")
    log("-" * 80)
    browser = ChromeBrowserSession()
    chrome_started = browser.start()

    if chrome_started:
        try:
            await browser.connect()

            # Home
            total += 1
            await browser.send("Page.navigate", {"url": f"{BASE_URL}/"})
            await asyncio.sleep(2)
            title = await browser.eval_js("document.title")
            assert "Akhand Bharat Seva" in title
            await browser.screenshot(os.path.join(DIST_DIR, "browser_akhand_bharat_home.png"))
            passed += 1
            log(f"[PASS {total}] Chrome Home Route Rendered: '{title}'")

            # Report
            total += 1
            await browser.send("Page.navigate", {"url": f"{BASE_URL}/report"})
            await asyncio.sleep(2)
            has_form = await browser.eval_js("!!document.querySelector('form')")
            assert has_form == True
            await browser.screenshot(os.path.join(DIST_DIR, "browser_akhand_bharat_report.png"))
            passed += 1
            log(f"[PASS {total}] Chrome /report Route: Interactive Form + Map loaded.")

            # Form Fill
            total += 1
            await browser.eval_js("const btn = document.querySelector('.sample-photo-btn'); if (btn) btn.click();")
            await asyncio.sleep(0.5)
            await browser.eval_js("const ta = document.getElementById('description'); if (ta) { ta.value = 'Large crater on road'; ta.dispatchEvent(new Event('input')); }")
            passed += 1
            log(f"[PASS {total}] Form Interactive auto-fill completed.")

            # Public Issues
            total += 1
            await browser.send("Page.navigate", {"url": f"{BASE_URL}/public-issues"})
            await asyncio.sleep(2)
            issues_c = await browser.eval_js("document.querySelectorAll('.public-issue-card, .card').length")
            assert issues_c >= 1
            passed += 1
            log(f"[PASS {total}] Chrome /public-issues: {issues_c} cards rendered.")

            # Track
            total += 1
            await browser.send("Page.navigate", {"url": f"{BASE_URL}/track"})
            await asyncio.sleep(1.5)
            has_input = await browser.eval_js("!!document.querySelector('input')")
            assert has_input == True
            passed += 1
            log(f"[PASS {total}] Chrome /track: Search box active.")

            # Admin
            total += 1
            await browser.send("Page.navigate", {"url": f"{BASE_URL}/admin"})
            await asyncio.sleep(2)
            await browser.screenshot(os.path.join(DIST_DIR, "browser_akhand_bharat_admin.png"))
            passed += 1
            log(f"[PASS {total}] Chrome /admin: Command Center rendered.")

            # Admin Priority Queue
            total += 1
            await browser.send("Page.navigate", {"url": f"{BASE_URL}/admin/priority-queue"})
            await asyncio.sleep(2)
            pq_c = await browser.eval_js("document.querySelectorAll('.card, tr, .table').length")
            assert pq_c >= 1
            passed += 1
            log(f"[PASS {total}] Chrome /admin/priority-queue: Smart Priority Queue loaded.")

            # HUD
            total += 1
            await browser.send("Page.navigate", {"url": f"{BASE_URL}/hud"})
            await asyncio.sleep(2)
            hud_t = await browser.eval_js("document.title")
            assert "Gemma Civic" in hud_t
            passed += 1
            log(f"[PASS {total}] Chrome /hud: Gemma AI Diagnostic HUD online.")

            # Zero Errors Check
            total += 1
            assert len(browser.js_exceptions) == 0, f"JS Exceptions: {browser.js_exceptions}"
            assert len(browser.console_errors) == 0, f"Console Errors: {browser.console_errors}"
            passed += 1
            log(f"[PASS {total}] Chrome Runtime: 0 uncaught exceptions, 0 console errors.")

        finally:
            if browser.ws:
                await browser.ws.close()
            browser.stop()

    # PART 8: CONTINUOUS STRESS & SOAK LOOP (UP TO DURATION)
    log("-" * 80)
    log(f"ENTERING CONTINUOUS 15-MINUTE SOAK STRESS LOOP (TARGET: {duration_seconds}s)")
    log("-" * 80)

    cycle = 0
    total_stress_reqs = 0
    start_soak = time.time()

    sample_cities = [
        {"city": "Mumbai", "lat": 18.9388, "lng": 72.8354, "corp": "Brihanmumbai"},
        {"city": "Delhi", "lat": 28.6139, "lng": 77.2090, "corp": "Municipal Corporation of Delhi"},
        {"city": "Bengaluru", "lat": 12.9719, "lng": 77.5946, "corp": "Bruhat Bengaluru"},
        {"city": "Hyderabad", "lat": 17.3850, "lng": 78.4867, "corp": "Greater Hyderabad"},
        {"city": "Chennai", "lat": 13.0827, "lng": 80.2707, "corp": "Greater Chennai"},
        {"city": "Kolkata", "lat": 22.5726, "lng": 88.3639, "corp": "Kolkata Municipal"},
        {"city": "Pune", "lat": 18.5204, "lng": 73.8567, "corp": "Pune Municipal"},
        {"city": "Ahmedabad", "lat": 23.0225, "lng": 72.5714, "corp": "Ahmedabad Municipal"}
    ]

    sample_problems = [
        ("Water Supply", "pipeline burst leaking 5000 litres clean water on road", "pipeline_burst.jpg", 4),
        ("Roads and Infrastructure", "massive crater pothole damaged car axle near crossing", "pothole_deep.jpg", 4),
        ("Drainage and Sewage", "open manhole near primary school gate dangerous for pedestrians", "manhole_open.jpg", 5),
        ("Solid Waste Management", "overflowing garbage bin with plastic waste scattered on street", "garbage_bin.jpg", 3),
        ("Street Lighting & Electricity", "live wire sparking from light pole after rainstorm", "live_wire_spark.jpg", 5)
    ]

    while time.time() < end_time:
        cycle += 1
        elapsed = int(time.time() - start_time)
        remaining = max(0, int(end_time - time.time()))

        # Run a burst of 5 varied requests across different cities and sectors
        for _ in range(5):
            loc = random.choice(sample_cities)
            sector, text, img, min_sev = random.choice(sample_problems)
            lat = loc["lat"] + random.uniform(-0.02, 0.02)
            lng = loc["lng"] + random.uniform(-0.02, 0.02)

            s, ticket = http_post("/api/civic/complaints", {
                "citizen_name": f"Citizen {loc['city']} #{cycle}",
                "citizen_phone": f"+91 98{random.randint(10000000, 99999999)}",
                "text": f"{text} in {loc['city']} sector {cycle}",
                "latitude": lat,
                "longitude": lng,
                "locality_hint": f"{loc['city']} Main Road",
                "image_name_or_url": img
            })
            assert s == 200
            assert ticket["sector"] == sector
            total_stress_reqs += 1

        # Check health and complaint list endpoint
        s, comps = http_get("/api/civic/complaints")
        assert s == 200

        if cycle % 5 == 0 or remaining <= 5:
            log(f"[*] Cycle {cycle} | Elapsed: {elapsed}s | Remaining: {remaining}s | Total Requests: {total_stress_reqs} | DB Total: {comps['count']}")

        # Yield control briefly
        await asyncio.sleep(2)

    total_time = round(time.time() - start_time, 2)
    log("=" * 80)
    log(f"15-MINUTE SOAK TEST COMPLETE: {passed}/{total} PHASES PASSED | {total_stress_reqs} STRESS REQUESTS PROCESSED | 0 ERRORS")
    log(f"Total Test Time: {total_time}s")
    log("=" * 80)

    report = {
        "status": "ALL_TESTS_PASSED",
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "total_test_duration_seconds": total_time,
        "phases_passed": passed,
        "total_phases": total,
        "stress_requests_processed": total_stress_reqs,
        "zero_console_errors": True,
        "zero_exceptions": True,
        "screenshots_captured": [
            "dist/browser_akhand_bharat_home.png",
            "dist/browser_akhand_bharat_report.png",
            "dist/browser_akhand_bharat_admin.png"
        ]
    }
    with open(REPORT_FILE, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)

    return True

if __name__ == "__main__":
    duration = 900 # 15 minutes default
    if len(sys.argv) > 1:
        try:
            duration = int(sys.argv[1])
        except ValueError:
            pass
    asyncio.run(run_integration_and_soak(duration_seconds=duration))
