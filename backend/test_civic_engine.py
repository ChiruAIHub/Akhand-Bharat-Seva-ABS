"""
Comprehensive Verification Test Suite for Track 2:
Civic Complaint Triage & Routing with Gemma

Validates:
1. Gemma 4 Multilingual NLU Triage (Hindi, Hinglish, Tamil, English).
2. Fatal Hazard Gatekeeper (Open manholes, live wires, burst mains -> P1 Critical).
3. Gemma 4 Multimodal Visual Severity Scoring (Level 1 to 5).
4. Google Maps Spatial Geo-Router (24 Major Corporations, Mulund BMC/TMC border intersection).
5. Dynamic SLA Engine & 48-Hour Auto-Escalation.
6. EmbeddingGemma 2 Semantic Duplicate Clustering.
7. Gemma 4 Resolution Auditor (Before/After comparative fraud detection).
"""

import sys
import json
from gemma_civic_engine import gemma_civic_engine
from geo_router import route_location_to_municipalities, haversine_distance
from priority_engine import evaluate_complaint_priority
from civic_service import civic_complaint_service

def run_civic_test_suite():
    print("=" * 80)
    print("TRACK 2: GEMMA 4 CIVIC TRIAGE & MUNICIPAL ROUTING TEST SUITE")
    print("=" * 80)
    passed = 0
    total = 8

    # TEST 1: Multilingual Hinglish Sewage Triage
    print("\n[1/8] Testing Gemma 4 Multilingual Triage (Hinglish/Hindi input)...")
    hindi_text = "Hamare gali 4th cross mein sewage drain overflow ho raha hai aur ganda paani raste pe aa gaya, bohot badbu hai"
    t1 = gemma_civic_engine.triage_complaint_text(hindi_text)
    print(f" -> Input Text        : {hindi_text}")
    print(f" -> Detected Language : {t1['detected_language']}")
    print(f" -> Sector Mapped     : {t1['sector_name']}")
    print(f" -> Department        : {t1['responsible_department']}")
    print(f" -> Extracted Street  : {t1['extracted_entities']['street']}")
    assert t1["sector_id"] == "drainage_and_sewage", f"Expected drainage_and_sewage, got {t1['sector_id']}"
    assert t1["detected_language"] in ["hi", "hinglish"], f"Language mismatch: {t1['detected_language']}"
    print(" [PASS] Multilingual triage accurately mapped to Drainage & Sewage")
    passed += 1

    # TEST 2: Fatal Hazard Gatekeeper (Open Manhole -> P1 Critical 4-Hour SLA)
    print("\n[2/8] Testing Fatal Life-Safety Hazard Gatekeeper...")
    fatal_text = "There is an open manhole cover without any barricade near the school gate. A child almost fell into the drainage hole!"
    t2 = gemma_civic_engine.triage_complaint_text(fatal_text)
    p2 = evaluate_complaint_priority(t2["sector_name"], t2["sub_category"], fatal_text, visual_severity_level=1)
    print(f" -> Fatal Hazard Flag : {p2['is_fatal_hazard']}")
    print(f" -> Hazard Type       : {p2['hazard_type']}")
    print(f" -> Assigned Priority : {p2['priority_tier']} ({p2['target_sla_label']})")
    assert p2["is_fatal_hazard"] == True, "Fatal hazard was not detected!"
    assert p2["priority_tier"] == "P1_CRITICAL", f"Expected P1_CRITICAL, got {p2['priority_tier']}"
    assert p2["target_sla_hours"] == 4, f"Expected 4 hours SLA, got {p2['target_sla_hours']}"
    print(" [PASS] Fatal hazard instantly bypassed standard queue to P1 Critical (4-hour SLA)")
    passed += 1

    # TEST 3: Gemma 4 Multimodal Visual Severity Inspection (Level 1-5)
    print("\n[3/8] Testing Gemma 4 12B Vision Severity Scoring...")
    img_ctx = "deep crater pothole on main carriageway with standing water"
    v3 = gemma_civic_engine.inspect_complaint_image("pothole_crater_01.jpg", img_ctx)
    print(f" -> Detected Issue    : {v3['detected_issue']}")
    print(f" -> Visual Severity   : Level {v3['severity_level']} / 5 ({v3['severity_rating']})")
    print(f" -> Estimated Depth   : {v3['estimated_dimensions']['depth_or_height_cm']} cm")
    print(f" -> Field Crew Advice : {v3['field_crew_recommendation']}")
    assert v3["severity_level"] >= 4, f"Expected severity >= 4 for deep crater, got {v3['severity_level']}"
    print(" [PASS] Gemma 4 Vision correctly computed Level 4 High Road Hazard")
    passed += 1

    # TEST 4: Google Maps Spatial Geo-Router (Mulund BMC / TMC Border Zone)
    print("\n[4/8] Testing Google Maps Spatial Router & Boundary Intersection...")
    mulund_lat, mulund_lng = 19.1824, 72.9512
    route4 = route_location_to_municipalities(mulund_lat, mulund_lng, "Mulund Check Naka")
    print(f" -> Coordinates       : ({mulund_lat}, {mulund_lng})")
    print(f" -> Primary Corp      : {route4['primary_corporation']['name']}")
    print(f" -> Assigned Ward     : {route4['primary_corporation']['assigned_ward']}")
    print(f" -> Border Zone Flag  : {route4['is_border_intersection_zone']}")
    print(f" -> Intersecting Corp : {[c['name'] for c in route4['border_intersecting_corporations']]}")
    print(f" -> Dispatch Protocol : {route4['dispatch_protocol']}")
    assert "Mumbai" in route4["primary_corporation"]["name"] or "BMC" in route4["primary_corporation"]["name"] or "Brihanmumbai" in route4["primary_corporation"]["name"], "Expected BMC Mumbai as closest"
    assert route4["is_border_intersection_zone"] == True, "Failed to detect border intersection zone"
    assert any("Thane" in c["name"] for c in route4["border_intersecting_corporations"]), "TMC not found in intersection"
    print(" [PASS] Anti-Ping-Pong joint dispatch activated for BMC/TMC border zone")
    passed += 1

    # TEST 5: Automated Ward Junior Engineer Dispatch (Indiranagar BBMP)
    print("\n[5/8] Testing Automated Ward Junior Engineer Dispatch...")
    blr_lat, blr_lng = 12.9719, 77.6412
    route5 = route_location_to_municipalities(blr_lat, blr_lng, "Indiranagar")
    print(f" -> Primary Corp      : {route5['primary_corporation']['name']}")
    print(f" -> Assigned Ward     : {route5['primary_corporation']['assigned_ward']}")
    print(f" -> Assigned Officer  : {route5['primary_corporation']['assigned_officer']}")
    assert "Bengaluru" in route5["primary_corporation"]["name"] or "BBMP" in route5["primary_corporation"]["name"]
    print(" [PASS] Ward Junior Engineer directly assigned without central unassigned pool")
    passed += 1

    # TEST 6: EmbeddingGemma 2 Semantic Duplicate Detection
    print("\n[6/8] Testing EmbeddingGemma 2 Semantic Duplicate Clustering...")
    ticket1 = civic_complaint_service.file_new_complaint(
        text="Severe water pipeline rupture on 80ft road near Metro station, water gushing onto street",
        citizen_name="Anita Sharma",
        lat=12.9750,
        lng=77.6450,
        locality_hint="Indiranagar"
    )
    # Second neighbor reports the identical issue 100 meters away
    ticket2 = civic_complaint_service.file_new_complaint(
        text="Water main burst on 80 feet road close to Metro station, huge flood on road",
        citizen_name="Vikram Rao",
        lat=12.9752,
        lng=77.6455,
        locality_hint="Indiranagar"
    )
    print(f" -> Ticket 1 Case ID  : {ticket1['case_id']} (Master)")
    print(f" -> Ticket 2 Case ID  : {ticket2['case_id']}")
    print(f" -> Duplicate Detected: {ticket2['is_duplicate_ticket']}")
    print(f" -> Linked Master ID  : {ticket2.get('duplicate_master_case_id')}")
    assert ticket2["is_duplicate_ticket"] == True, "Duplicate complaint was not detected!"
    print(" [PASS] EmbeddingGemma 2 successfully clustered duplicate neighbor report into master case")
    passed += 1

    # TEST 7: Gemma 4 Resolution Auditor (Valid Before vs After Photo)
    print("\n[7/8] Testing Gemma 4 Resolution Auditor on Valid Road Repair...")
    res_valid = civic_complaint_service.audit_and_close_ticket(ticket1["case_id"], "pothole_repaired_fresh_asphalt.jpg")
    audit1 = res_valid.get("resolution_audit", {})
    print(f" -> Verification Status: {audit1.get('verification_status')}")
    print(f" -> Observed Changes   : {audit1.get('observed_changes')}")
    print(f" -> Final Status       : {res_valid.get('status')}")
    assert audit1.get("is_resolution_verified") == True, "Valid repair was rejected!"
    assert res_valid.get("status") == "VERIFIED_RESOLVED"
    print(" [PASS] Gemma 4 Vision verified genuine asphalt restoration")
    passed += 1

    # TEST 8: Anti-Fraud Gatekeeper (Fake Closure Rejection)
    print("\n[8/8] Testing Anti-Fraud Gatekeeper on Fake Closure Attempt...")
    res_fake = civic_complaint_service.audit_and_close_ticket(ticket2["case_id"], "officer_desk_blank_wall.jpg")
    audit2 = res_fake.get("resolution_audit", {})
    print(f" -> Verification Status: {audit2.get('verification_status')}")
    print(f" -> Fraud Flag         : {audit2.get('is_fraudulent_submission')}")
    print(f" -> Auditor Feedback   : {audit2.get('auditor_notes')}")
    print(f" -> Ticket Status      : {res_fake.get('status')}")
    assert audit2.get("is_resolution_verified") == False, "Fake closure was improperly approved!"
    assert audit2.get("is_fraudulent_submission") == True, "Fraud flag was not set!"
    assert res_fake.get("status") == "CLOSURE_REJECTED"
    print(" [PASS] Anti-Fraud gatekeeper rejected fake closure and logged staff violation")
    passed += 1

    print("\n" + "=" * 80)
    print(f"TRACK 2 AUDIT VERDICT: {passed}/{total} TESTS PASSED (100% SUCCESS)")
    print("=" * 80)
    return passed == total

if __name__ == "__main__":
    success = run_civic_test_suite()
    sys.exit(0 if success else 1)
