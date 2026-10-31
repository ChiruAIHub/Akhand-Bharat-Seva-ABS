"""
Exhaustive Feature-by-Feature Verification & Diagnostics Suite
Tests every single micro-feature of both Akhand Bharat Seva Frontend (Angular 19)
and FastAPI Gemma 4 Civic & GIS Backend, capturing any flaws, console issues, or UI defects.
"""

import os
import sys
import time
import json
import base64
import asyncio
import subprocess
import urllib.request
import urllib.error
import websockets

try:
    from municipal_auth import generate_session_token
except ImportError:
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    from municipal_auth import generate_session_token

BASE_URL = "http://127.0.0.1:8000"
CDP_PORT = 9222
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIST_DIR = os.path.join(ROOT_DIR, "dist")
CHROME_PROFILE = os.path.join(DIST_DIR, "chrome_profile")
REPORT_FILE = os.path.join(DIST_DIR, "exhaustive_feature_test_report.json")

os.makedirs(DIST_DIR, exist_ok=True)
os.makedirs(CHROME_PROFILE, exist_ok=True)

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
if not os.path.exists(CHROME_PATH):
    CHROME_PATH = r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"

def safe_log(msg):
    ts = time.strftime("[%Y-%m-%d %H:%M:%S]")
    line = f"{ts} {msg}"
    enc = sys.stdout.encoding or "utf-8"
    try:
        print(line.encode(enc, errors="replace").decode(enc, errors="replace"))
    except Exception:
        print(line.encode("ascii", errors="replace").decode("ascii"))

def http_get(path):
    url = f"{BASE_URL}{path}"
    req = urllib.request.Request(url, headers={"User-Agent": "ExhaustiveFeatureTest/1.0"})
    with urllib.request.urlopen(req, timeout=15) as resp:
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
        headers={"Content-Type": "application/json", "User-Agent": "ExhaustiveFeatureTest/1.0"}
    )
    with urllib.request.urlopen(req, timeout=15) as resp:
        body = resp.read().decode("utf-8")
        try:
            return resp.status, json.loads(body)
        except Exception:
            return resp.status, body

class ChromeCDP:
    def __init__(self):
        self.proc = None
        self.ws = None
        self.msg_id = 0
        self.console_errors = []
        self.console_warnings = []
        self.js_exceptions = []

    def start(self):
        safe_log(f"[*] Starting Chrome for in-depth feature testing from: {CHROME_PATH}")
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
            safe_log("[*] Chrome closed.")

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
                level = msg.get("level")
                if level in ["error", "assert"]:
                    self.console_errors.append(msg.get("text"))
                elif level == "warning":
                    self.console_warnings.append(msg.get("text"))
            if data.get("id") == self.msg_id:
                return data.get("result", {})

    async def eval_js(self, expr):
        res = await self.send("Runtime.evaluate", {
            "expression": expr,
            "returnByValue": True,
            "awaitPromise": True
        })
        return res.get("result", {}).get("value")

    async def screenshot(self, filename):
        res = await self.send("Page.captureScreenshot", {"format": "png"})
        filepath = os.path.join(DIST_DIR, filename)
        if res.get("data"):
            with open(filepath, "wb") as f:
                f.write(base64.b64decode(res["data"]))
            safe_log(f"    [SCREENSHOT] -> {filename}")
        return filepath

async def run_exhaustive_tests():
    safe_log("=" * 80)
    safe_log("STARTING EXHAUSTIVE SYSTEM & FEATURE AUDIT")
    safe_log("=" * 80)

    feature_results = {}
    flaws_found = []

    # -------------------------------------------------------------
    # SECTION 1: BACKEND REST API ENDPOINTS AUDIT
    # -------------------------------------------------------------
    safe_log("\n--- SECTION 1: BACKEND REST API DEEP AUDIT ---")

    # 1.1 /api/health
    s, h = http_get("/api/health")
    feature_results["api_health"] = (s == 200 and h.get("status") == "online")
    safe_log(f"[1.1] GET /api/health: Status {s} | Unified Service: {h.get('service')}")

    # 1.2 /api/civic/taxonomy
    s, tax = http_get("/api/civic/taxonomy")
    feature_results["api_civic_taxonomy"] = (s == 200 and len(tax.get("sectors", [])) == 15)
    safe_log(f"[1.2] GET /api/civic/taxonomy: Status {s} | Sectors Count: {len(tax.get('sectors', []))}")

    # 1.3 /api/civic/corporations
    s, corps = http_get("/api/civic/corporations")
    feature_results["api_civic_corporations"] = (s == 200 and len(corps.get("corporations", [])) == 24)
    safe_log(f"[1.3] GET /api/civic/corporations: Status {s} | Corporations Count: {len(corps.get('corporations', []))}")

    # 1.4 /api/civic/complaints (POST)
    s, ticket = http_post("/api/civic/complaints", {
        "citizen_name": "Rajesh Sharma",
        "citizen_phone": "+91 98480 99112",
        "text": "Deep hazardous pothole on Begumpet flyover exit causing motorcycle accidents",
        "latitude": 17.4447,
        "longitude": 78.4664,
        "locality_hint": "Begumpet Flyover, Hyderabad",
        "image_name_or_url": "pothole_crater_deep.jpg"
    })
    feature_results["api_civic_file_complaint"] = (s == 200 and ticket.get("case_id") is not None)
    case_id = ticket.get("case_id")
    safe_log(f"[1.4] POST /api/civic/complaints: Status {s} | Created Case ID: {case_id} | Priority: {ticket.get('priority_tier')}")

    # 1.5 /api/civic/complaints/{case_id} (GET single)
    s, single_ticket = http_get(f"/api/civic/complaints/{case_id}")
    feature_results["api_civic_get_single"] = (s == 200 and single_ticket.get("case_id") == case_id)
    safe_log(f"[1.5] GET /api/civic/complaints/{case_id}: Status {s} | Fetched: {single_ticket.get('case_id')}")

    # 1.6 /api/civic/verify-resolution (POST)
    s, res_audit = http_post("/api/civic/verify-resolution", {
        "case_id": case_id,
        "after_image_url": "pothole_repaired_fresh_asphalt.jpg"
    })
    feature_results["api_civic_verify_resolution"] = (s == 200 and res_audit.get("status") == "VERIFIED_RESOLVED")
    safe_log(f"[1.6] POST /api/civic/verify-resolution: Status {s} | Resolution Audit: {res_audit.get('status')}")

    # 1.7 /api/repos (GET Track 1 Hub)
    s, repos = http_get("/api/repos")
    feature_results["api_repos"] = (s == 200 and repos.get("count", 0) > 0)
    safe_log(f"[1.7] GET /api/repos: Status {s} | Repositories Indexed: {repos.get('count')}")

    # 1.8 /api/issues/analyze (POST)
    s, analysis = http_post("/api/issues/analyze", {"issue_id": "fw-dify-1"})
    feature_results["api_issues_analyze"] = (s == 200 and "summary_bullets" in analysis)
    safe_log(f"[1.8] POST /api/issues/analyze: Status {s} | Difficulty: {analysis.get('difficulty_score')}")

    # 1.9 /api/issues/pr-roadmap (POST)
    s, roadmap = http_post("/api/issues/pr-roadmap", {"issue_id": "fw-dify-1"})
    steps_list = roadmap.get("steps") or roadmap.get("step_by_step_checklist") or []
    feature_results["api_issues_roadmap"] = (s == 200 and len(steps_list) >= 1)
    safe_log(f"[1.9] POST /api/issues/pr-roadmap: Status {s} | Checklist Steps: {len(steps_list)}")

    # 1.10 /api/ecosystem (GET)
    s, eco = http_get("/api/ecosystem")
    feature_results["api_ecosystem"] = (s == 200 and "categories" in eco)
    safe_log(f"[1.10] GET /api/ecosystem: Status {s} | Providers Count: {len(eco.get('categories', []))}")

    # 1.11 /api/civic/auth/me (Unauthenticated)
    s, auth_unauth = http_get("/api/civic/auth/me")
    feature_results["api_civic_auth_me_unauth"] = (s == 200 and auth_unauth.get("authenticated") is False)
    safe_log(f"[1.11] GET /api/civic/auth/me (Unauthenticated): Status {s} | Authenticated: {auth_unauth.get('authenticated')}")

    # -------------------------------------------------------------
    # SECTION 2: FRONTEND ANGULAR FEATURE & INTERACTION AUDIT
    # -------------------------------------------------------------
    safe_log("\n--- SECTION 2: FRONTEND ANGULAR INTERACTION & FEATURE AUDIT ---")
    browser = ChromeCDP()
    browser.start()

    try:
        await browser.connect()

        # 2.1 Landing Page (/)
        safe_log("\n[2.1] Testing Landing Page (/) Features...")
        await browser.send("Page.navigate", {"url": f"{BASE_URL}/"})
        await asyncio.sleep(2)
        title = await browser.eval_js("document.title")
        nav_brand = await browser.eval_js("document.querySelector('.brand-name, .logo-title, .brand-text')?.textContent")
        hero_heading = await browser.eval_js("document.querySelector('.hero-title, h1')?.textContent")
        cta_buttons = await browser.eval_js("document.querySelectorAll('.btn-cta, .hero-cta a, .btn-primary').length")
        safe_log(f" -> Title: {title}")
        safe_log(f" -> Brand: {nav_brand} | Hero: {hero_heading}")
        safe_log(f" -> CTA Buttons Count: {cta_buttons}")
        feature_results["ui_home_render"] = ("Akhand Bharat Seva" in title and cta_buttons >= 1)

        # 2.2 Language Selector (22 Languages)
        safe_log("\n[2.2] Testing Language Selector Dropdown...")
        lang_count = await browser.eval_js("document.querySelectorAll('.lang-select option, .lang-dropdown option, select option').length")
        safe_log(f" -> Available language options: {lang_count}")
        # Test selecting Telugu
        await browser.eval_js("const sel = document.querySelector('select.lang-select, select'); if (sel) { sel.value = 'te'; sel.dispatchEvent(new Event('change')); }")
        await asyncio.sleep(1)
        te_title = await browser.eval_js("document.title")
        safe_log(f" -> Page title after switching to Telugu: {te_title}")
        feature_results["ui_language_selector"] = (lang_count >= 5)

        # 2.3 Report Grievance Page (/report)
        safe_log("\n[2.3] Testing Grievance Lodging Form (/report)...")
        await browser.send("Page.navigate", {"url": f"{BASE_URL}/report"})
        await asyncio.sleep(2)

        # Verify Form Elements
        has_title_input = await browser.eval_js("!!document.getElementById('title')")
        has_desc_input = await browser.eval_js("!!document.getElementById('description')")
        has_cat_select = await browser.eval_js("!!document.getElementById('category')")
        has_name_input = await browser.eval_js("!!document.getElementById('citizenName')")
        has_phone_input = await browser.eval_js("!!document.getElementById('citizenPhone')")
        has_map = await browser.eval_js("!!document.getElementById('map') || !!document.querySelector('.leaflet-container')")
        has_sample_photos = await browser.eval_js("document.querySelectorAll('.sample-photo-btn').length")

        safe_log(f" -> Inputs present: Title={has_title_input}, Desc={has_desc_input}, Cat={has_cat_select}, Name={has_name_input}, Phone={has_phone_input}")
        safe_log(f" -> Leaflet Map Container: {has_map} | Sample Photos buttons: {has_sample_photos}")

        # Fill and Submit the Form
        safe_log(" -> Interactively filling form fields and clicking Sample Photo...")
        await browser.eval_js("const sample = document.querySelector('.sample-photo-btn'); if (sample) sample.click();")
        await asyncio.sleep(0.5)

        # Step 1: select category by index
        await browser.eval_js("""
            const cat = document.getElementById('category');
            if (cat) {
                cat.selectedIndex = 1;
                cat.dispatchEvent(new Event('change'));
            }
        """)
        await asyncio.sleep(0.5)

        # Step 2: select subcategory by index and fill other fields
        await browser.eval_js("""
            const sub = document.getElementById('subcategory');
            if (sub && sub.options.length > 1) {
                sub.selectedIndex = 1;
                sub.dispatchEvent(new Event('change'));
            }
            const t = document.getElementById('title');
            if (t) {
                t.value = 'Massive Dangerous Crater Outside Begumpet Hospital';
                t.dispatchEvent(new Event('input'));
            }
            const d = document.getElementById('description');
            if (d) {
                d.value = 'Extremely deep 20cm crater pothole causing serious motorcycle falls and severe ambulance transit delays daily.';
                d.dispatchEvent(new Event('input'));
            }
            const cn = document.getElementById('citizenName');
            if (cn) {
                cn.value = 'Suresh Kumar';
                cn.dispatchEvent(new Event('input'));
            }
            const cp = document.getElementById('citizenPhone');
            if (cp) {
                cp.value = '9876543210';
                cp.dispatchEvent(new Event('input'));
            }
        """)
        await asyncio.sleep(0.5)

        # Check form validation state
        inv_fields = await browser.eval_js("""
            Array.from(document.querySelectorAll('.report-form .ng-invalid')).map(el => el.getAttribute('formcontrolname') || el.id || el.tagName)
        """)
        safe_log(f" -> Form Invalid Fields Check: {inv_fields}")

        # Trigger Review Modal
        safe_log(" -> Submitting form to open Smart Priority Review Modal...")
        await browser.eval_js("""
            const submitBtn = document.querySelector('button[type="submit"], .btn-submit, .form-actions button');
            if (submitBtn) {
                submitBtn.click();
            } else {
                const form = document.querySelector('form');
                if (form) form.dispatchEvent(new Event('submit'));
            }
        """)
        await asyncio.sleep(1.5)

        # Confirm and Lodge in modal
        safe_log(" -> Confirming in modal to dispatch complaint...")
        has_modal = await browser.eval_js("!!document.querySelector('.modal-backdrop, .modal, .review-modal-footer')")
        safe_log(f" -> Review Modal Opened: {has_modal}")
        await browser.eval_js("""
            const confirmBtn = document.getElementById('confirmLodgeBtn') || document.querySelector('.review-modal-footer button.btn-saffron, button.btn-saffron');
            if (confirmBtn) confirmBtn.click();
        """)
        await asyncio.sleep(2)

        # Check for success confirmation or generated ID
        submitted_id = await browser.eval_js("document.querySelector('.id-code, .confirmation-card')?.textContent")
        safe_log(f" -> Post-submission confirmed ID / Card: {submitted_id is not None}")
        feature_results["ui_report_submission"] = (has_title_input and has_map and (bool(submitted_id) or has_modal))

        # 2.4 Citizen Tracking (/track)
        safe_log("\n[2.4] Testing Citizen Tracking (/track)...")
        await browser.send("Page.navigate", {"url": f"{BASE_URL}/track"})
        await asyncio.sleep(2)

        # Query complaint ABS-2026-0001 or click Quick Demo chip
        await browser.eval_js("""
            const chip = document.querySelector('.chip-p0, .chip');
            if (chip) {
                chip.click();
            } else {
                const inp = document.querySelector('input[type="text"], .search-input');
                if (inp) {
                    inp.value = 'ABS-2026-0001';
                    inp.dispatchEvent(new Event('input'));
                }
                const btn = document.querySelector('button.search-btn, button.btn-saffron, button.btn-primary');
                if (btn) btn.click();
            }
        """)
        await asyncio.sleep(1.5)

        tracked_item = await browser.eval_js("document.querySelector('.timeline-card, .complaint-tracking-view, .card')?.textContent")
        has_timeline = await browser.eval_js("document.querySelectorAll('.step-node, .timeline-stepper, .step-item').length")
        safe_log(f" -> Found Complaint tracking card: {bool(tracked_item)} | Timeline steps: {has_timeline}")
        feature_results["ui_tracking"] = (bool(tracked_item) and has_timeline >= 1)

        # 2.5 Public Issues Board (/public-issues)
        safe_log("\n[2.5] Testing Public Transparency Board (/public-issues)...")
        await browser.send("Page.navigate", {"url": f"{BASE_URL}/public-issues"})
        await asyncio.sleep(2)

        card_count = await browser.eval_js("document.querySelectorAll('.public-issue-card, .card').length")
        safe_log(f" -> Grid View: Rendered {card_count} complaint cards")

        # Test switching to Interactive Map View
        safe_log(" -> Toggling View Mode to Interactive Map...")
        await browser.eval_js("const mapBtn = document.querySelectorAll('.view-btn')[1]; if (mapBtn) mapBtn.click();")
        await asyncio.sleep(2)
        has_public_map = await browser.eval_js("!!document.querySelector('.leaflet-public-map .leaflet-container, .leaflet-container')")
        safe_log(f" -> Leaflet Public Map initialized: {has_public_map}")

        # Switch back to Grid View
        await browser.eval_js("const gridBtn = document.querySelectorAll('.view-btn')[0]; if (gridBtn) gridBtn.click();")
        await asyncio.sleep(1)

        # Test search filter
        await browser.eval_js("""
            const search = document.querySelector('.search-box input');
            if (search) {
                search.value = 'pothole';
                search.dispatchEvent(new Event('input'));
            }
        """)
        await asyncio.sleep(1)
        filtered_count = await browser.eval_js("document.querySelectorAll('.public-issue-card').length")
        safe_log(f" -> Search filter ('pothole'): {filtered_count} matching cards")
        feature_results["ui_public_issues"] = (card_count >= 1 and has_public_map)

        # 2.6 Help & FAQ (/help)
        safe_log("\n[2.6] Testing Help & FAQ (/help)...")
        await browser.send("Page.navigate", {"url": f"{BASE_URL}/help"})
        await asyncio.sleep(1.5)
        help_heading = await browser.eval_js("document.querySelector('h1, h2, .help-title')?.textContent")
        accordions = await browser.eval_js("document.querySelectorAll('.accordion, .faq-item, .card, .help-topic').length")
        safe_log(f" -> Help Heading: {help_heading} | Topics count: {accordions}")
        feature_results["ui_help"] = (accordions >= 1)

        # 2.6.1 Municipal Login Gateway & Access Protection
        safe_log("\n[2.6.1] Testing Municipal Officer Authentication Gateway...")
        await browser.send("Page.navigate", {"url": f"{BASE_URL}/admin/overview"})
        await asyncio.sleep(2)
        current_url = await browser.eval_js("window.location.href")
        safe_log(f" -> Unauthenticated redirect destination: {current_url}")
        has_login_fields = await browser.eval_js("!!document.getElementById('email') && !!document.getElementById('access_code')")
        safe_log(f" -> Login form fields detected: {has_login_fields}")
        feature_results["ui_municipal_login_gateway"] = ("login" in current_url and has_login_fields)

        # Authenticate via official municipal login form (K. Rajeshwar Rao, IAS)
        safe_log(" -> Submitting Municipal Officer login credentials...")
        submit_js = """
        const emailInput = document.getElementById('email');
        const codeInput = document.getElementById('access_code');
        if (emailInput && codeInput) {
            emailInput.value = 'rajeshwar.ias@hyderabad.gov.in';
            codeInput.value = 'GHMC-IAS-9081';
            document.querySelector('form').submit();
        }
        """
        await browser.eval_js(submit_js)
        await asyncio.sleep(3)
        post_login_url = await browser.eval_js("window.location.href")
        safe_log(f" -> Post-login destination: {post_login_url}")

        # 2.7 Admin Overview (/admin/overview)
        safe_log("\n[2.7] Testing Admin Overview (/admin/overview)...")
        await browser.send("Page.navigate", {"url": f"{BASE_URL}/admin/overview"})
        await asyncio.sleep(2)
        kpi_count = await browser.eval_js("document.querySelectorAll('.kpi-card, .stat-card, .metric-card').length")
        has_chart = await browser.eval_js("!!document.querySelector('canvas, svg, .chart-container, .analytics-chart')")
        officer_badge = await browser.eval_js("document.body.innerText.includes('Rajeshwar')")
        safe_log(f" -> Admin KPI Cards: {kpi_count} | Visual Chart: {has_chart} | Officer Profile Badge: {officer_badge}")
        feature_results["ui_admin_overview"] = (kpi_count >= 1)

        # 2.8 Admin Smart Priority Queue (/admin/priority-queue)
        safe_log("\n[2.8] Testing Admin Smart Priority Queue (/admin/priority-queue)...")
        await browser.send("Page.navigate", {"url": f"{BASE_URL}/admin/priority-queue"})
        await asyncio.sleep(2)

        # Check ranking banner & queue rows
        has_engine_rule = await browser.eval_js("!!document.querySelector('.engine-rule-card, .engine-badge-tag')")
        queue_rows = await browser.eval_js("document.querySelectorAll('.priority-item, .queue-row, .card, tr').length")
        top_complaint_id = await browser.eval_js("document.querySelector('.complaint-id, strong, .badge')?.textContent")
        safe_log(f" -> Engine Rule Banner Present: {has_engine_rule} | Queue Rows: {queue_rows} | Top Complaint: {top_complaint_id}")
        feature_results["ui_admin_priority_queue"] = (has_engine_rule and queue_rows >= 1)

        # 2.9 Admin All Complaints (/admin/all-complaints)
        safe_log("\n[2.9] Testing Admin All Complaints (/admin/all-complaints)...")
        await browser.send("Page.navigate", {"url": f"{BASE_URL}/admin/all-complaints"})
        await asyncio.sleep(2)
        all_rows = await browser.eval_js("document.querySelectorAll('.table tbody tr, .complaint-row, .card').length")
        safe_log(f" -> All Complaints Table Rows: {all_rows}")
        feature_results["ui_admin_all_complaints"] = (all_rows >= 1)

        # 2.10 Admin Map (/admin/map)
        safe_log("\n[2.10] Testing Admin GIS Map (/admin/map)...")
        await browser.send("Page.navigate", {"url": f"{BASE_URL}/admin/map"})
        await asyncio.sleep(2)
        admin_map = await browser.eval_js("!!document.querySelector('.leaflet-container, #adminMap, .map-container')")
        safe_log(f" -> Admin GIS Map loaded: {admin_map}")
        feature_results["ui_admin_map"] = admin_map

        # 2.11 Admin Departments (/admin/departments)
        safe_log("\n[2.11] Testing Admin Departments (/admin/departments)...")
        await browser.send("Page.navigate", {"url": f"{BASE_URL}/admin/departments"})
        await asyncio.sleep(2)
        dept_cards = await browser.eval_js("document.querySelectorAll('.dept-card, .department-card, .card').length")
        safe_log(f" -> Department Performance Cards: {dept_cards}")
        feature_results["ui_admin_departments"] = (dept_cards >= 1)

        # 2.12 Admin Analytics (/admin/analytics)
        safe_log("\n[2.12] Testing Admin Analytics (/admin/analytics)...")
        await browser.send("Page.navigate", {"url": f"{BASE_URL}/admin/analytics"})
        await asyncio.sleep(2)
        analytics_sections = await browser.eval_js("document.querySelectorAll('.analytics-card, .chart-box, .card').length")
        safe_log(f" -> Analytics Sections: {analytics_sections}")
        feature_results["ui_admin_analytics"] = (analytics_sections >= 1)

        # 2.13 Admin Settings (/admin/settings)
        safe_log("\n[2.13] Testing Admin Settings (/admin/settings)...")
        await browser.send("Page.navigate", {"url": f"{BASE_URL}/admin/settings"})
        await asyncio.sleep(2)
        switches = await browser.eval_js("document.querySelectorAll('input[type=\"checkbox\"], .form-switch, .toggle, .card').length")
        safe_log(f" -> Settings Configuration Elements: {switches}")
        feature_results["ui_admin_settings"] = (switches >= 1)

        # 2.14 Gemma 4 Civic AI HUD (/hud)
        safe_log("\n[2.14] Testing Dual-Track Gemma HUD (/hud)...")
        await browser.send("Page.navigate", {"url": f"{BASE_URL}/hud"})
        await asyncio.sleep(2)
        hud_title = await browser.eval_js("document.title")
        has_triage_feed = await browser.eval_js("!!document.querySelector('#triageFeed, .triage-feed, .terminal')")
        safe_log(f" -> HUD Title: {hud_title} | Triage Feed Element: {has_triage_feed}")
        feature_results["ui_gemma_hud"] = ("Gemma" in hud_title or has_triage_feed)

        # 2.15 Console & Exception Audit
        safe_log("\n[2.15] Auditing Browser Console Errors & Exceptions...")
        safe_log(f" -> JS Exceptions: {len(browser.js_exceptions)}")
        safe_log(f" -> Console Errors: {len(browser.console_errors)}")
        safe_log(f" -> Console Warnings: {len(browser.console_warnings)}")
        if browser.console_errors:
            safe_log(f"    Errors: {browser.console_errors}")
        if browser.js_exceptions:
            safe_log(f"    Exceptions: {browser.js_exceptions}")

        feature_results["browser_clean_runtime"] = (len(browser.js_exceptions) == 0 and len(browser.console_errors) == 0)

    finally:
        if browser.ws:
            await browser.ws.close()
        browser.stop()

    # -------------------------------------------------------------
    # SECTION 3: FLUSTERING / FLAWS CHECK & SUMMARY
    # -------------------------------------------------------------
    safe_log("\n" + "=" * 80)
    safe_log("EXHAUSTIVE TEST AUDIT SUMMARY")
    safe_log("=" * 80)

    total_checks = len(feature_results)
    passed_checks = sum(1 for v in feature_results.values() if v)

    for feat, status in feature_results.items():
        status_text = "[PASS]" if status else "[FAIL]"
        safe_log(f" {status_text} {feat}")
        if not status:
            flaws_found.append(feat)

    safe_log("\n" + "=" * 80)
    safe_log(f"TOTAL FEATURES TESTED: {total_checks} | PASSED: {passed_checks} | FAILED: {len(flaws_found)}")
    safe_log("=" * 80)

    report_data = {
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "total_checks": total_checks,
        "passed_checks": passed_checks,
        "failed_checks": len(flaws_found),
        "results": feature_results,
        "flaws_detected": flaws_found,
        "console_errors_count": len(browser.console_errors),
        "console_warnings_count": len(browser.console_warnings),
        "js_exceptions_count": len(browser.js_exceptions)
    }

    with open(REPORT_FILE, "w", encoding="utf-8") as f:
        json.dump(report_data, f, indent=2)

    safe_log(f"Report saved to: {REPORT_FILE}")
    return len(flaws_found) == 0

if __name__ == "__main__":
    success = asyncio.run(run_exhaustive_tests())
    sys.exit(0 if success else 1)
