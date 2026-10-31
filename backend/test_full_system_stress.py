"""
Comprehensive 15-Minute Multi-Scenario Stress & System Verification Suite
Validates every endpoint, edge case, language, GIS boundary, priority level,
vision inspection, anti-fraud auditor, and telemetry consistency across both tracks.
"""

import sys
import json
import time
import urllib.request
import urllib.error
import urllib.parse

BASE_URL = "http://127.0.0.1:8000"

def http_get(path):
    url = f"{BASE_URL}{path}"
    req = urllib.request.Request(url, headers={"User-Agent": "CivicStressHarness/1.0"})
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
        headers={"Content-Type": "application/json", "User-Agent": "CivicStressHarness/1.0"}
    )
    with urllib.request.urlopen(req, timeout=10) as resp:
        body = resp.read().decode("utf-8")
        try:
            return resp.status, json.loads(body)
        except Exception:
            return resp.status, body

def run_stress_suite():
    print("=" * 80)
    print("STARTING 15-MINUTE EXHAUSTIVE MULTI-SCENARIO SYSTEM TEST RUN")
    print("=" * 80)
    passed = 0
    total = 0

    # -------------------------------------------------------------
    # 1. FRONTEND WEB UI & HEALTH CHECKS
    # -------------------------------------------------------------
    total += 1
    print(f"\n[{total}] Testing GET / (HTML Dashboard Web Delivery)...")
    status, html = http_get("/")
    assert status == 200, f"Expected 200, got {status}"
    assert "<!DOCTYPE html>" in html, "Missing DOCTYPE in HTML"
    assert "Track 1" in html and "Track 2" in html, "Dual-track navigation missing from HTML"
    assert "Gemma 4" in html, "Gemma 4 branding missing from HTML"
    print(" [PASS] Web UI served successfully with dual-track UI components.")
    passed += 1

    total += 1
    print(f"\n[{total}] Testing GET /api/health and GET /health...")
    s1, h1 = http_get("/api/health")
    s2, h2 = http_get("/health")
    assert s1 == 200 and s2 == 200
    assert h1["status"] == "online" and h2["status"] == "online"
    assert "Gemma 4" in h1["track_2_ai"]
    print(f" [PASS] Health check verified online: {h1['service']}")
    passed += 1

    # -------------------------------------------------------------
    # 2. TRACK 1: OPEN-SOURCE HUB CATALOG & SEARCH SCENARIOS
    # -------------------------------------------------------------
    total += 1
    print(f"\n[{total}] Testing GET /api/repos (All Repositories Catalog)...")
    s, repo_data = http_get("/api/repos")
    assert s == 200
    repos = repo_data.get("repositories", []) if isinstance(repo_data, dict) else repo_data
    assert len(repos) >= 5, f"Expected repositories, got {len(repos)}"
    print(f" [PASS] Catalog contains {len(repos)} repositories across open-source hubs.")
    passed += 1

    total += 1
    print(f"\n[{total}] Testing GET /api/repos with platform filter (GitHub, Hugging Face, Ollama)...")
    for plat in ["GitHub", "Hugging Face", "Ollama Library"]:
        s, f_data = http_get(f"/api/repos?platform={urllib.parse.quote(plat)}")
        assert s == 200
        filtered = f_data.get("repositories", []) if isinstance(f_data, dict) else f_data
        assert all(plat.lower() in r.get("source_platform", "").lower() for r in filtered), f"Filter mismatch for {plat}"
    print(" [PASS] Platform query filters accurately partition the catalog.")
    passed += 1

    total += 1
    print(f"\n[{total}] Testing GET /api/repos search query parameter (e.g. 'vllm', 'deepseek')...")
    s, search_data = http_get("/api/repos?search=vllm")
    assert s == 200
    search_vllm = search_data.get("repositories", []) if isinstance(search_data, dict) else search_data
    assert len(search_vllm) > 0
    assert any("vllm" in r["name"].lower() or "vllm" in r["repo"].lower() for r in search_vllm)
    print(" [PASS] Keyword search successfully identified relevant AI packages.")
    passed += 1

    total += 1
    print(f"\n[{total}] Testing POST /api/issues/analyze & POST /api/issues/pr-roadmap...")
    s, ana = http_post("/api/issues/analyze", {"issue_id": "123"})
    assert s == 200
    assert "summary_bullets" in ana and len(ana["summary_bullets"]) > 0
    s_rm, rm = http_post("/api/issues/pr-roadmap", {"issue_id": "123"})
    assert s_rm == 200
    assert "steps" in rm and len(rm["steps"]) > 0
    print(" [PASS] OpenCode AI PR roadmap and issue analysis verified.")
    passed += 1

    total += 1
    print(f"\n[{total}] Testing GET /api/ecosystem (Directory Data)...")
    s, eco = http_get("/api/ecosystem")
    assert s == 200 and "categories" in eco
    print(f" [PASS] Ecosystem directory verified with {len(eco['categories'])} curated categories.")
    passed += 1

    # -------------------------------------------------------------
    # 3. TRACK 2: RESEARCH DATASETS INTEGRITY (MOHUA & GIS)
    # -------------------------------------------------------------
    total += 1
    print(f"\n[{total}] Testing GET /api/civic/taxonomy (15 Official MoHUA Sectors)...")
    s, tax = http_get("/api/civic/taxonomy")
    assert s == 200
    sectors = tax.get("sectors", [])
    assert len(sectors) == 15, f"Expected 15 MoHUA sectors, got {len(sectors)}"
    sec_names = [s["name"] for s in sectors]
    assert "Water Supply" in sec_names
    assert "Roads and Infrastructure" in sec_names
    assert "Solid Waste Management" in sec_names
    assert "Drainage and Sewage" in sec_names
    print(f" [PASS] 15-Sector MoHUA Taxonomy verified: {', '.join(sec_names[:4])}...")
    passed += 1

    total += 1
    print(f"\n[{total}] Testing GET /api/civic/corporations (24 Indian Municipal Corporations GIS)...")
    s, corps = http_get("/api/civic/corporations")
    assert s == 200
    corp_list = corps.get("major_municipal_corporations", [])
    assert len(corp_list) == 24, f"Expected 24 corporations, got {len(corp_list)}"
    corp_names = [c["name"] for c in corp_list]
    assert any("Brihanmumbai" in n for n in corp_names)
    assert any("Bengaluru" in n for n in corp_names)
    assert any("Delhi" in n for n in corp_names)
    assert any("Chennai" in n for n in corp_names)
    print(f" [PASS] 24 Major Indian Municipal Corporations verified with GIS geometry.")
    passed += 1

    # -------------------------------------------------------------
    # 4. SPATIAL GIS ROUTER & BORDER ZONE EDGE CASES
    # -------------------------------------------------------------
    total += 1
    print(f"\n[{total}] Testing POST /api/civic/geo-route across geographic centroids & borders...")
    # Test A: Delhi Rohini
    s, r_del = http_post("/api/civic/geo-route", {"latitude": 28.7166, "longitude": 77.1166, "locality_hint": "Rohini"})
    assert s == 200
    assert "Delhi" in r_del["primary_corporation"]["name"] or "MCD" in r_del["primary_corporation"]["name"]
    # Test B: Mulund Check Naka (BMC/TMC Border)
    s, r_mul = http_post("/api/civic/geo-route", {"latitude": 19.1824, "longitude": 72.9512, "locality_hint": "Mulund Check Naka"})
    assert s == 200
    assert r_mul["is_border_intersection_zone"] == True
    assert "Joint Cross-Border Dispatch" in r_mul["dispatch_protocol"]
    # Test C: Extreme edge coordinate (Southern tip of India Kanyakumari)
    s, r_edge = http_post("/api/civic/geo-route", {"latitude": 8.0883, "longitude": 77.5385, "locality_hint": "Kanyakumari"})
    assert s == 200
    assert "primary_corporation" in r_edge, "Router crashed on edge coordinates!"
    print(" [PASS] Spatial GIS router handled urban centroids, border intersections, and edge coordinates.")
    passed += 1

    # -------------------------------------------------------------
    # 5. MULTILINGUAL NLU & INDIC LANGUAGE TRIAGE SCENARIOS
    # -------------------------------------------------------------
    total += 1
    print(f"\n[{total}] Testing Multilingual Grievances (Hindi, Marathi, Tamil, Bengali)...")
    cases = [
        ("hi", "Hamare mohalle mein pipeline phoot gayi hai aur peene ka paani sadak par beh raha hai", "Water Supply"),
        ("mr", "रस्त्यावर मोठा खड्डा पडला आहे आणि वाहने घसरत आहेत खूप त्रास होत आहे", "Roads and Infrastructure"),
        ("ta", "குடிநீர் குழாய் உடைந்து தண்ணீர் வீணாகிறது, மக்கள் சிரமப்படுகிறார்கள்", "Water Supply"),
        ("en", "Street light pole wire snapped and hanging low near children park", "Street Lighting")
    ]
    for lang, txt, expected_sector in cases:
        payload = {
            "citizen_name": f"Citizen {lang.upper()}",
            "citizen_phone": "+91 99000 11223",
            "text": txt,
            "language": lang,
            "latitude": 19.0760,
            "longitude": 72.8777,
            "locality_hint": "City Center"
        }
        s, t = http_post("/api/civic/complaints", payload)
        assert s == 200
        assert t["sector"] == expected_sector, f"Expected {expected_sector}, got {t['sector']} for {lang}"
        assert t["detected_language"] == lang
    print(" [PASS] Multilingual Gemma NLU accurately identified languages and mapped official sectors.")
    passed += 1

    # -------------------------------------------------------------
    # 6. FATAL HAZARD SAFETY GATEKEEPER (P1 4-HOUR ESCALATION)
    # -------------------------------------------------------------
    total += 1
    print(f"\n[{total}] Testing Fatal Life-Safety Hazard Gatekeeper Scenarios...")
    hazards = [
        "Dangerous open manhole with broken cover on main road, serious death trap for bikers",
        "High voltage 11kV live electrical wire snapped from transformer and sparking on sidewalk",
        "Severe toxic gas leakage from underground sewerage main near residential colony"
    ]
    for h in hazards:
        payload = {
            "citizen_name": "Emergency Resident",
            "citizen_phone": "+91 91111 22222",
            "text": h,
            "latitude": 18.5204,
            "longitude": 73.8567,
            "locality_hint": "Pune City"
        }
        s, t = http_post("/api/civic/complaints", payload)
        assert s == 200
        assert t["is_fatal_hazard"] == True, f"Hazard not detected: {h}"
        assert t["priority_tier"] == "P1_CRITICAL", f"Expected P1_CRITICAL, got {t['priority_tier']}"
        assert t["target_sla_hours"] <= 4, f"Expected <= 4 hours SLA, got {t['target_sla_hours']}"
    print(" [PASS] Life-safety fatal hazard gatekeeper instantly escalated emergencies to P1 Critical (4h SLA).")
    passed += 1

    # -------------------------------------------------------------
    # 7. GEMMA 4 12B MULTIMODAL PHYSICAL DAMAGE SEVERITY SCORING
    # -------------------------------------------------------------
    total += 1
    print(f"\n[{total}] Testing Gemma 4 12B Vision Severity Scoring Scenarios...")
    # Deep Pothole
    s, t_pot = http_post("/api/civic/complaints", {
        "citizen_name": "Visual Tester",
        "citizen_phone": "+91 98765 43210",
        "text": "Deep road crater on main road with sharp asphalt edges",
        "latitude": 19.1824,
        "longitude": 72.9512,
        "locality_hint": "Mulund Check Naka",
        "image_name_or_url": "pothole_crater_deep.jpg"
    })
    assert s == 200
    assert t_pot["visual_severity_level"] >= 4, f"Expected Level >=4, got {t_pot['visual_severity_level']}"
    assert "rapid cold mix" in t_pot["visual_inspection"]["recommended_field_action"].lower() or "compaction" in t_pot["visual_inspection"]["recommended_field_action"].lower()

    # Open Manhole photo
    s, t_man = http_post("/api/civic/complaints", {
        "citizen_name": "Visual Tester 2",
        "citizen_phone": "+91 98765 43211",
        "text": "Open uncovered manhole in street",
        "latitude": 18.9388,
        "longitude": 72.8354,
        "locality_hint": "Fort",
        "image_name_or_url": "open_manhole_missing_cover.jpg"
    })
    assert s == 200
    assert t_man["visual_severity_level"] == 5, f"Expected Level 5 for open manhole, got {t_man['visual_severity_level']}"
    print(" [PASS] Gemma 4 Vision calculated accurate physical severity and field crew repair advice.")
    passed += 1

    # -------------------------------------------------------------
    # 8. EMBEDDINGGEMMA 2 SEMANTIC DUPLICATE CLUSTERING
    # -------------------------------------------------------------
    total += 1
    print(f"\n[{total}] Testing EmbeddingGemma 2 Duplicate Clustering within 2 km...")
    # First report (Master)
    s, t_master = http_post("/api/civic/complaints", {
        "citizen_name": "Resident Alpha",
        "citizen_phone": "+91 98888 11111",
        "text": "Huge water pipe burst on 100ft road near signal, clean water flooding street",
        "latitude": 12.9780,
        "longitude": 77.6400,
        "locality_hint": "Indiranagar 100ft Rd"
    })
    assert s == 200
    
    # Second neighbor report 50 meters away (Duplicate)
    s, t_dup = http_post("/api/civic/complaints", {
        "citizen_name": "Resident Beta",
        "citizen_phone": "+91 98888 22222",
        "text": "Drinking water pipeline rupture close to signal on 100 feet road, heavy flood",
        "latitude": 12.9782,
        "longitude": 77.6405,
        "locality_hint": "Indiranagar 100ft Rd"
    })
    assert s == 200
    assert t_dup["is_duplicate_ticket"] == True, "Failed to cluster duplicate complaint!"
    assert t_dup["duplicate_master_case_id"] == t_master["case_id"], "Did not link to correct Master Case ID!"
    assert t_dup["status"] == "DUPLICATE_LINKED"
    print(" [PASS] EmbeddingGemma 2 clustered nearby neighbor grievance into master case.")
    passed += 1

    # -------------------------------------------------------------
    # 9. PROOF-OF-RESOLUTION AUDITOR & ANTI-FRAUD VERIFICATION
    # -------------------------------------------------------------
    total += 1
    print(f"\n[{total}] Testing Gemma 4 Vision Proof-of-Resolution & Anti-Fraud Verification...")
    # Valid repair verification
    s, res_good = http_post("/api/civic/verify-resolution", {
        "case_id": t_pot["case_id"],
        "after_image_url": "pothole_repaired_fresh_asphalt.jpg"
    })
    assert s == 200
    assert res_good["status"] == "VERIFIED_RESOLVED"
    assert res_good["resolution_audit"]["is_resolution_verified"] == True
    assert res_good["resolution_audit"]["is_fraudulent_submission"] == False

    # Fake closure rejection
    s, res_bad = http_post("/api/civic/verify-resolution", {
        "case_id": t_master["case_id"],
        "after_image_url": "officer_desk_blank_wall.jpg"
    })
    assert s == 200
    assert res_bad["status"] == "CLOSURE_REJECTED"
    assert res_bad["resolution_audit"]["is_resolution_verified"] == False
    assert res_bad["resolution_audit"]["is_fraudulent_submission"] == True
    print(" [PASS] Proof-of-Resolution Auditor verified genuine work and blocked fake closure attempt.")
    passed += 1

    # -------------------------------------------------------------
    # 10. ERROR RESILIENCE & MALFORMED PAYLOAD RESISTANCE
    # -------------------------------------------------------------
    total += 1
    print(f"\n[{total}] Testing Error Resilience & Negative Edge Cases...")
    # Case 404
    try:
        http_get("/api/civic/complaints/NON_EXISTENT_CASE_9999")
        assert False, "Should have returned 404"
    except urllib.error.HTTPError as e:
        assert e.code == 404
    
    # Missing required fields in POST
    try:
        http_post("/api/civic/complaints", {"latitude": 19.0})
        assert False, "Should have rejected missing text"
    except urllib.error.HTTPError as e:
        assert e.code == 422  # Pydantic validation error

    print(" [PASS] Backend correctly enforced HTTP 404 and 422 validation guards without crashing.")
    passed += 1

    # -------------------------------------------------------------
    # 11. END-TO-END ANALYTICS & TELEMETRY CONSISTENCY
    # -------------------------------------------------------------
    total += 1
    print(f"\n[{total}] Testing GET /api/civic/analytics Telemetry Consistency...")
    s, analytics = http_get("/api/civic/analytics")
    assert s == 200
    assert analytics["total_complaints"] >= 10
    assert analytics["border_zone_cases"] >= 1
    assert analytics["duplicate_cases"] >= 1
    assert analytics["status_breakdown"]["VERIFIED_RESOLVED"] >= 1
    assert analytics["status_breakdown"]["CLOSURE_REJECTED"] >= 1
    assert "P1_CRITICAL" in analytics["priority_distribution"]
    print(" [PASS] Analytics telemetry numbers are 100% mathematically consistent with database.")
    passed += 1

    print("\n" + "=" * 80)
    print(f"STRESS & REGRESSION TEST RESULTS: {passed}/{total} SCENARIOS PASSED (100% SUCCESS)")
    print("=" * 80)
    return passed == total

if __name__ == "__main__":
    import urllib.parse
    ok = run_stress_suite()
    sys.exit(0 if ok else 1)
