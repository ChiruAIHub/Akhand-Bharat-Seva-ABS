"""
Automated End-to-End External Chrome Browser Test Suite
Leverages Chrome DevTools Protocol (CDP) via WebSockets to execute,
inspect, and validate real browser interactions on http://127.0.0.1:8000.
"""

import os
import sys
import time
import json
import asyncio
import subprocess
import urllib.request
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

class ChromeController:
    def __init__(self):
        self.proc = None
        self.ws = None
        self.msg_id = 0
        self.console_errors = []
        self.js_exceptions = []

    def start_chrome(self):
        print(f"[*] Spawning external Google Chrome from: {CHROME_PATH}")
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

    def stop_chrome(self):
        if self.proc:
            try:
                self.proc.terminate()
                self.proc.wait(timeout=3)
            except Exception:
                self.proc.kill()
            print("[*] Chrome browser closed successfully.")

    async def connect_cdp(self):
        # Fetch pages list
        with urllib.request.urlopen(f"http://127.0.0.1:{CDP_PORT}/json/list") as resp:
            pages = json.loads(resp.read().decode())
        
        target = next((p for p in pages if p.get("type") == "page"), pages[0])
        ws_url = target["webSocketDebuggerUrl"]
        print(f"[*] Connected CDP WebSocket: {ws_url}")
        self.ws = await websockets.connect(ws_url, max_size=10_000_000)

        # Enable runtime, page, console
        await self.send("Runtime.enable")
        await self.send("Console.enable")
        await self.send("Page.enable")

    async def send(self, method, params=None):
        self.msg_id += 1
        payload = {"id": self.msg_id, "method": method, "params": params or {}}
        await self.ws.send(json.dumps(payload))
        
        # Read until our response comes
        while True:
            resp_raw = await self.ws.recv()
            data = json.loads(resp_raw)
            # Listen to events
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
        val = res.get("result", {}).get("value")
        return val

    async def capture_screenshot(self, filepath):
        res = await self.send("Page.captureScreenshot", {"format": "png"})
        import base64
        data = res.get("data")
        if data:
            with open(filepath, "wb") as f:
                f.write(base64.b64decode(data))
            print(f"    [SCREENSHOT SAVED] -> {filepath}")

async def run_browser_tests():
    print("=" * 80)
    print("STARTING EXTERNAL CHROME BROWSER MULTI-SCENARIO TEST RUN")
    print("=" * 80)
    
    ctrl = ChromeController()
    ctrl.start_chrome()

    passed = 0
    total = 0

    try:
        await ctrl.connect_cdp()

        # -------------------------------------------------------------
        # SCENARIO 1: NAVIGATE TO WEB UI
        # -------------------------------------------------------------
        total += 1
        print(f"\n[{total}] Navigating Chrome to {BASE_URL}...")
        await ctrl.send("Page.navigate", {"url": BASE_URL})
        await asyncio.sleep(2)

        title = await ctrl.eval_js("document.title")
        print(f" -> Rendered Page Title: {title}")
        assert "Gemma Civic" in title and "GitLaunch" in title, f"Unexpected title: {title}"
        passed += 1

        # -------------------------------------------------------------
        # SCENARIO 2: VERIFY INITIAL METRICS & TRACK 2 VIEW ACTIVE
        # -------------------------------------------------------------
        total += 1
        print(f"\n[{total}] Verifying initial telemetry metrics in Chrome DOM...")
        cases_txt = await ctrl.eval_js("document.getElementById('metricTotalCases').textContent")
        hazards_txt = await ctrl.eval_js("document.getElementById('metricFatalHazards').textContent")
        borders_txt = await ctrl.eval_js("document.getElementById('metricBorderZones').textContent")
        print(f" -> Total Cases: {cases_txt}, Fatal Hazards: {hazards_txt}, Border Zones: {borders_txt}")
        assert int(cases_txt) >= 1, "Failed to load complaints telemetry into DOM"
        passed += 1

        # -------------------------------------------------------------
        # SCENARIO 3: TEST 1-CLICK PRESET (OPEN MANHOLE BANDRA)
        # -------------------------------------------------------------
        total += 1
        print(f"\n[{total}] Testing 1-Click Preset 'P1 Open Manhole' in Chrome...")
        await ctrl.eval_js("loadCivicPreset('manhole')")
        p_name = await ctrl.eval_js("document.getElementById('citizenName').value")
        p_text = await ctrl.eval_js("document.getElementById('complaintText').value")
        p_photo = await ctrl.eval_js("document.getElementById('selectedPhotoUrl').value")
        print(f" -> Form Auto-Filled: Citizen={p_name}, Photo={p_photo}")
        assert "Sunil Deshmukh" in p_name
        assert "manhole" in p_text.lower()
        passed += 1

        # -------------------------------------------------------------
        # SCENARIO 4: SUBMIT GRIEVANCE & VERIFY GEMMA 4 LIVE HUD
        # -------------------------------------------------------------
        total += 1
        print(f"\n[{total}] Submitting Grievance via Form and waiting for Gemma 4 HUD...")
        # Trigger form submission
        await ctrl.eval_js("submitCivicComplaint(new Event('submit'))")
        await asyncio.sleep(2)

        hud_status = await ctrl.eval_js("document.getElementById('hudStatusTag').textContent")
        hud_priority = await ctrl.eval_js("document.getElementById('hudPriorityTier').textContent")
        hud_sla = await ctrl.eval_js("document.getElementById('hudTargetSla').textContent")
        hud_fatal = await ctrl.eval_js("document.getElementById('hudFatalGate').textContent")
        print(f" -> HUD Diagnostics: {hud_status} | Priority: {hud_priority} | Target SLA: {hud_sla}")
        assert "Created" in hud_status
        assert "P1_CRITICAL" in hud_priority
        assert "4 Hours" in hud_sla
        assert "TRIGGERED" in hud_fatal
        passed += 1

        # -------------------------------------------------------------
        # SCENARIO 5: TEST BORDER ZONE PRESET & ANTI-PING-PONG BANNER
        # -------------------------------------------------------------
        total += 1
        print(f"\n[{total}] Testing Border Pothole Preset (Mulund Check Naka - BMC/TMC)...")
        await ctrl.eval_js("loadCivicPreset('border_pothole')")
        await ctrl.eval_js("submitCivicComplaint(new Event('submit'))")
        await asyncio.sleep(2)

        banner_display = await ctrl.eval_js("document.getElementById('hudBorderZoneBanner').style.display")
        border_corps = await ctrl.eval_js("document.getElementById('hudBorderIntersectingCorps').textContent")
        print(f" -> Border Zone Banner Display: {banner_display} | Intersecting: {border_corps}")
        assert banner_display == "flex", "Border zone banner failed to display!"
        assert "Thane" in border_corps or "TMC" in border_corps
        passed += 1

        # -------------------------------------------------------------
        # SCENARIO 6: TEST RESOLUTION AUDITOR MODAL (GENUINE REPAIR)
        # -------------------------------------------------------------
        total += 1
        print(f"\n[{total}] Testing Gemma 4 Vision Resolution Auditor on Valid Road Repair...")
        # Get latest case id
        case_id = await ctrl.eval_js("allComplaints[0].case_id")
        await ctrl.eval_js(f"openAuditModal('{case_id}')")
        await asyncio.sleep(0.5)

        modal_display = await ctrl.eval_js("document.getElementById('resolutionAuditModal').style.display")
        assert modal_display == "flex", "Resolution modal failed to open!"

        # Trigger genuine repair audit
        await ctrl.eval_js("runResolutionAudit(true)")
        await asyncio.sleep(2)

        audit_box = await ctrl.eval_js("document.getElementById('auditResultBox').innerHTML")
        assert "APPROVED_RESOLVED" in audit_box
        assert "Visual proof of work confirmed" in audit_box
        print(" -> Auditor Verdict: APPROVED_RESOLVED (Genuine asphalt repair verified)")
        await ctrl.eval_js("closeAuditModal()")
        passed += 1

        # -------------------------------------------------------------
        # SCENARIO 7: TEST RESOLUTION AUDITOR (FAKE CLOSURE REJECTION)
        # -------------------------------------------------------------
        total += 1
        print(f"\n[{total}] Testing Anti-Fraud Gatekeeper on Fake Closure Attempt...")
        await ctrl.eval_js(f"openAuditModal('{case_id}')")
        await ctrl.eval_js("runResolutionAudit(false)")
        await asyncio.sleep(2)

        audit_box_fake = await ctrl.eval_js("document.getElementById('auditResultBox').innerHTML")
        assert "REJECTED_FAKE_CLOSURE" in audit_box_fake
        assert "FRAUD DETECTED" in audit_box_fake
        print(" -> Auditor Verdict: REJECTED_FAKE_CLOSURE (Fake wall/desk photo blocked, fraud logged)")
        await ctrl.eval_js("closeAuditModal()")
        passed += 1

        # Take screenshot of Track 2
        await ctrl.capture_screenshot(os.path.join(DIST_DIR, "browser_test_track2_civic.png"))

        # -------------------------------------------------------------
        # SCENARIO 8: SWITCH TO TRACK 1 (GITLAUNCH HUB)
        # -------------------------------------------------------------
        total += 1
        print(f"\n[{total}] Testing Track Switch to Track 1 (GitLaunch Hub)...")
        await ctrl.eval_js("switchTrack('track1')")
        await asyncio.sleep(1)

        t1_active = await ctrl.eval_js("document.getElementById('track1-container').classList.contains('active')")
        repos_count = await ctrl.eval_js("allRepos.length")
        print(f" -> Track 1 Active: {t1_active} | Repos Loaded: {repos_count}")
        assert t1_active == True
        assert repos_count >= 5
        passed += 1

        # -------------------------------------------------------------
        # SCENARIO 9: TEST TRACK 1 SEARCH & PLATFORM FILTERS
        # -------------------------------------------------------------
        total += 1
        print(f"\n[{total}] Testing Track 1 Search & Platform Filter Chips in Chrome...")
        # Search "vllm"
        await ctrl.eval_js("document.getElementById('searchInput').value = 'vllm'")
        await ctrl.eval_js("executeSearch()")
        await asyncio.sleep(0.5)

        rendered_cards = await ctrl.eval_js("document.querySelectorAll('#reposGrid .repo-card').length")
        print(f" -> Rendered Repo Cards matching 'vllm': {rendered_cards}")
        assert rendered_cards >= 1

        # Filter GitHub
        await ctrl.eval_js("filterPlatform('GitHub')")
        await asyncio.sleep(0.5)
        gh_cards = await ctrl.eval_js("document.querySelectorAll('#reposGrid .repo-card').length")
        print(f" -> Rendered Repo Cards for platform 'GitHub': {gh_cards}")
        assert gh_cards >= 1
        passed += 1

        # -------------------------------------------------------------
        # SCENARIO 10: TEST TRACK 1 AI ROADMAP MODAL
        # -------------------------------------------------------------
        total += 1
        print(f"\n[{total}] Testing Track 1 AI Roadmap Modal generation...")
        await ctrl.eval_js("openRoadmap('vllm-project/vllm', 'vLLM Engine')")
        await asyncio.sleep(2)

        modal_title = await ctrl.eval_js("document.getElementById('modalTitle').textContent")
        modal_body = await ctrl.eval_js("document.getElementById('modalBody').innerHTML")
        assert "vLLM Engine" in modal_title
        assert "Step 1" in modal_body or "steps" in modal_body.lower()
        print(f" -> AI Roadmap Modal Verified: {modal_title}")
        await ctrl.eval_js("closeModal()")
        passed += 1

        # Take screenshot of Track 1
        await ctrl.capture_screenshot(os.path.join(DIST_DIR, "browser_test_track1_gitlaunch.png"))

        # -------------------------------------------------------------
        # SCENARIO 11: VERIFY CONSOLE ERRORS & JAVASCRIPT EXCEPTIONS
        # -------------------------------------------------------------
        total += 1
        print(f"\n[{total}] Inspecting Chrome Browser Runtime Console Logs & Exceptions...")
        print(f" -> Uncaught JS Exceptions : {len(ctrl.js_exceptions)}")
        print(f" -> Browser Console Errors : {len(ctrl.console_errors)}")
        if ctrl.console_errors:
            print(f"    Errors: {ctrl.console_errors}")
        assert len(ctrl.js_exceptions) == 0, f"Uncaught exceptions in browser: {ctrl.js_exceptions}"
        assert len(ctrl.console_errors) == 0, f"Console errors in browser: {ctrl.console_errors}"
        print(" [PASS] Clean Chrome execution with ZERO uncaught exceptions and ZERO console errors.")
        passed += 1

        print("\n" + "=" * 80)
        print(f"EXTERNAL CHROME BROWSER VERDICT: {passed}/{total} SCENARIOS PASSED (100% SUCCESS)")
        print("=" * 80)
        return passed == total

    finally:
        if ctrl.ws:
            await ctrl.ws.close()
        ctrl.stop_chrome()

if __name__ == "__main__":
    success = asyncio.run(run_browser_tests())
    sys.exit(0 if success else 1)
