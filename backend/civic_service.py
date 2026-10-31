"""
Civic Complaint Lifecycle & Database Service
Coordinates:
1. Gemma 4 NLU Triage (indic language, 15 sectors, entities)
2. Gemma 4 Vision Severity (Level 1-5 damage scoring)
3. Google Maps GIS Geo-Router (24 major corporations, boundary intersections)
4. 5-Tier Priority Queue & Dynamic Monsoon SLA
5. EmbeddingGemma 2 Duplicate Clustering
6. Resolution Verification Auditor
"""

import os
import json
import uuid
from datetime import datetime, timezone
from typing import Dict, List, Any, Optional

from gemma_civic_engine import gemma_civic_engine
from geo_router import route_location_to_municipalities, haversine_distance
from priority_engine import evaluate_complaint_priority

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")
COMPLAINTS_FILE = os.path.join(DATA_DIR, "civic_complaints.json")

def load_complaints() -> List[Dict[str, Any]]:
    if os.path.exists(COMPLAINTS_FILE):
        with open(COMPLAINTS_FILE, "r", encoding="utf-8") as f:
            try:
                return json.load(f)
            except Exception:
                return []
    return []

def save_complaints(complaints: List[Dict[str, Any]]):
    with open(COMPLAINTS_FILE, "w", encoding="utf-8") as f:
        json.dump(complaints, f, indent=2)

class CivicComplaintService:
    def __init__(self):
        if not os.path.exists(COMPLAINTS_FILE):
            self.seed_initial_complaints()

    def seed_initial_complaints(self):
        """Seeds realistic historical complaints from Mumbai, Bangalore, Delhi for instant demonstration."""
        sample_data = [
            {
                "case_id": "CIV-2026-MUM-1001",
                "citizen_name": "Rohan Deshmukh",
                "citizen_phone": "+91 98201 44521",
                "original_text": "There is a dangerous open manhole cover near Mulund Check Naka on LBS Marg. Two bikes almost fell in yesterday evening during rain.",
                "language": "en",
                "status": "IN_PROGRESS",
                "created_at": "2026-10-30T14:20:00Z",
                "sector": "Drainage and Sewage",
                "responsible_dept": "Drainage & Sewerage Operations",
                "priority_tier": "P1_CRITICAL",
                "target_sla": "4 Hours",
                "is_fatal_hazard": True,
                "hazard_type": "broken_or_missing_manhole",
                "coordinates": {"lat": 19.1824, "lng": 72.9512},
                "primary_corporation": "Brihanmumbai Municipal Corporation (BMC)",
                "assigned_ward": "Ward T (Mulund)",
                "assigned_officer": "Ward Junior Engineer - Drainage (Ward T)",
                "is_border_zone": True,
                "intersecting_corporations": ["Thane Municipal Corporation (TMC)"],
                "visual_severity_level": 5,
                "staff_summary": "Open manhole on LBS Marg near Mulund Check Naka creating fatal accident hazard.",
                "timeline": [
                    {"time": "2026-10-30T14:20:00Z", "event": "Ticket created via Mobile Web Portal"},
                    {"time": "2026-10-30T14:20:02Z", "event": "Gemma 4 NLU assigned P1_CRITICAL (Fatal Manhole Hazard)"},
                    {"time": "2026-10-30T14:20:05Z", "event": "Dispatched to BMC Ward T Junior Engineer; CC sent to TMC Control Room"}
                ]
            },
            {
                "case_id": "CIV-2026-BLR-2042",
                "citizen_name": "Kavitha Sundaram",
                "citizen_phone": "+91 98450 11920",
                "original_text": "Huge garbage dumper is overflowing near 100ft road Indiranagar, foul smell and street dogs gathering.",
                "language": "en",
                "status": "ASSIGNED",
                "created_at": "2026-10-30T18:15:00Z",
                "sector": "Solid Waste Management",
                "responsible_dept": "Solid Waste Management (SWM) / Health",
                "priority_tier": "P3_ESSENTIAL",
                "target_sla": "48 Hours",
                "is_fatal_hazard": False,
                "coordinates": {"lat": 12.9719, "lng": 77.6412},
                "primary_corporation": "Bruhat Bengaluru Mahanagara Palike (BBMP)",
                "assigned_ward": "East Zone (Indiranagar)",
                "assigned_officer": "Ward Junior Engineer - SWM (Indiranagar)",
                "is_border_zone": False,
                "visual_severity_level": 3,
                "staff_summary": "Overflowing community waste dumper with animal menace near 100ft Road.",
                "timeline": [
                    {"time": "2026-10-30T18:15:00Z", "event": "Complaint logged via WhatsApp Bot"},
                    {"time": "2026-10-30T18:15:03Z", "event": "Gemma 4 assigned Solid Waste Management"}
                ]
            }
        ]
        save_complaints(sample_data)

    def file_new_complaint(
        self,
        text: str,
        citizen_name: str = "Anonymous Resident",
        citizen_phone: str = "+91 98000 00000",
        lat: float = 18.9388,
        lng: float = 72.8354,
        locality_hint: Optional[str] = None,
        language: Optional[str] = None,
        image_name_or_url: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Complete end-to-end civic complaint processing powered by Gemma:
        1. Gemma 4 NLU text triage
        2. Gemma 4 Vision severity analysis (if image attached)
        3. Google Maps GIS spatial geo-routing
        4. 5-Tier Priority & Dynamic Monsoon SLA
        5. EmbeddingGemma 2 semantic duplicate check
        """
        now = datetime.now(timezone.utc)
        clean_text = text.strip()

        # Step 1: Gemma 4 NLU Triage
        gemma_triage = gemma_civic_engine.triage_complaint_text(clean_text, language)

        # Step 2: Gemma 4 Vision Severity (if image supplied)
        visual_analysis = None
        severity_level = 1
        if image_name_or_url:
            visual_analysis = gemma_civic_engine.inspect_complaint_image(image_name_or_url, clean_text)
            severity_level = visual_analysis.get("severity_level", 1)

        # Step 3: Google Maps Spatial Geo-Routing
        spatial_route = route_location_to_municipalities(lat, lng, locality_hint or gemma_triage["extracted_entities"].get("neighborhood"))

        # Step 4: 5-Tier Priority Queue & SLA Evaluation
        priority_eval = evaluate_complaint_priority(
            sector=gemma_triage["sector_name"],
            sub_category=gemma_triage["sub_category"],
            text=clean_text,
            visual_severity_level=severity_level,
            submission_time=now
        )

        # Step 5: EmbeddingGemma 2 Duplicate Check
        existing_complaints = load_complaints()
        new_embedding = gemma_civic_engine.compute_embedding(clean_text)
        is_duplicate = False
        duplicate_parent_id = None

        for existing in existing_complaints:
            # Check within 2 km of same coordinates
            e_coords = existing.get("coordinates", {})
            if e_coords:
                dist = haversine_distance(lat, lng, e_coords.get("lat", 0), e_coords.get("lng", 0))
                if dist <= 2.0:
                    e_emb = existing.get("embedding")
                    if e_emb:
                        # Cosine similarity
                        dot = sum(a * b for a, b in zip(new_embedding, e_emb))
                        if dot > 0.80:
                            is_duplicate = True
                            duplicate_parent_id = existing.get("case_id")
                            break

        # Generate unique case ID
        city_prefix = spatial_route["primary_corporation"]["name"][:3].upper()
        case_id = f"CIV-2026-{city_prefix}-{uuid.uuid4().hex[:6].upper()}"

        primary_corp = spatial_route["primary_corporation"]["name"]
        assigned_ward = spatial_route["primary_corporation"]["assigned_ward"]
        assigned_officer = spatial_route["primary_corporation"]["assigned_officer"]

        ticket = {
            "case_id": case_id,
            "citizen_name": citizen_name,
            "citizen_phone": citizen_phone,
            "original_text": clean_text,
            "detected_language": gemma_triage["detected_language"],
            "translated_english_report": gemma_triage["translated_english_report"],
            "status": "DUPLICATE_LINKED" if is_duplicate else "ASSIGNED",
            "is_duplicate_ticket": is_duplicate,
            "duplicate_master_case_id": duplicate_parent_id,
            "created_at": now.isoformat(),
            "sector": gemma_triage["sector_name"],
            "responsible_dept": gemma_triage["responsible_department"],
            "sub_category": gemma_triage["sub_category"],
            "staff_summary": gemma_triage["staff_summary"],
            "missing_details_flag": gemma_triage["missing_details_flag"],
            "priority_tier": priority_eval["priority_tier"],
            "priority_label": priority_eval["priority_label"],
            "target_sla": priority_eval["target_sla_label"],
            "target_sla_hours": priority_eval["target_sla_hours"],
            "historical_benchmark_avg": priority_eval["historical_benchmark_reference"],
            "is_fatal_hazard": priority_eval["is_fatal_hazard"],
            "hazard_type": priority_eval["hazard_type"],
            "monsoon_surge_escalated": priority_eval["monsoon_surge_escalated"],
            "resolution_deadline_iso": priority_eval["resolution_deadline_iso"],
            "auto_escalate_deadline_iso": priority_eval["auto_escalate_deadline_iso"],
            "coordinates": {"lat": lat, "lng": lng},
            "locality_hint": locality_hint or gemma_triage["extracted_entities"].get("neighborhood"),
            "primary_corporation": primary_corp,
            "assigned_ward": assigned_ward,
            "assigned_officer": assigned_officer,
            "is_border_zone": spatial_route["is_border_intersection_zone"],
            "intersecting_corporations": [c["name"] for c in spatial_route["border_intersecting_corporations"]],
            "dispatch_protocol": spatial_route["dispatch_protocol"],
            "has_image": bool(image_name_or_url),
            "image_url": image_name_or_url,
            "visual_severity_level": severity_level,
            "visual_inspection": visual_analysis,
            "embedding": new_embedding,
            "timeline": [
                {"time": now.isoformat(), "event": f"Grievance registered and assigned Case ID {case_id}"},
                {"time": now.isoformat(), "event": f"Gemma 4 NLU classified into {gemma_triage['sector_name']}"},
                {"time": now.isoformat(), "event": f"Assigned to {assigned_officer} ({primary_corp}) with SLA {priority_eval['target_sla_label']}"}
            ]
        }

        # If duplicate, note on timeline
        if is_duplicate:
            ticket["timeline"].append({
                "time": now.isoformat(),
                "event": f"EmbeddingGemma 2 detected duplicate report within 2 km. Linked to Master Case {duplicate_parent_id}."
            })

        # Save to database
        existing_complaints.append(ticket)
        save_complaints(existing_complaints)
        return ticket

    def list_all_complaints(
        self,
        status: Optional[str] = None,
        sector: Optional[str] = None,
        priority: Optional[str] = None,
        corporation: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        all_c = load_complaints()
        filtered = []
        for c in all_c:
            if status and status.lower() != "all" and c.get("status", "").lower() != status.lower():
                continue
            if sector and sector.lower() != "all" and sector.lower() not in c.get("sector", "").lower():
                continue
            if priority and priority.lower() != "all" and priority.lower() not in c.get("priority_tier", "").lower():
                continue
            if corporation and corporation.lower() != "all" and corporation.lower() not in c.get("primary_corporation", "").lower():
                continue
            filtered.append(c)
        return filtered

    def get_complaint_by_id(self, case_id: str) -> Optional[Dict[str, Any]]:
        all_c = load_complaints()
        clean = case_id.strip().upper()
        for c in all_c:
            if c.get("case_id", "").upper() == clean or clean in c.get("case_id", "").upper():
                return c
        return None

    def update_complaint_status(
        self,
        case_id: str,
        new_status: str,
        remarks: Optional[str] = "Status updated by Ward Administrator",
        officer_name: Optional[str] = "Ward Admin"
    ) -> Optional[Dict[str, Any]]:
        all_c = load_complaints()
        clean = case_id.strip().upper()
        now = datetime.now(timezone.utc).isoformat()
        target = None

        for idx, c in enumerate(all_c):
            if c.get("case_id", "").upper() == clean or clean in c.get("case_id", "").upper():
                all_c[idx]["status"] = new_status
                all_c[idx]["updated_at"] = now
                if "timeline" not in all_c[idx]:
                    all_c[idx]["timeline"] = []
                all_c[idx]["timeline"].append({
                    "time": now,
                    "event": f"Status updated to {new_status} - {remarks} (by {officer_name})"
                })
                target = all_c[idx]
                break

        if target:
            save_complaints(all_c)
        return target

    def audit_and_close_ticket(self, case_id: str, after_image_url: str) -> Dict[str, Any]:
        """
        Applies Gemma 4 Vision Resolution Auditor to verify before vs after photo
        prior to closing ticket. Prevents fake closures!
        """
        complaint = self.get_complaint_by_id(case_id)
        if not complaint:
            return {"status": "error", "message": f"Case ID {case_id} not found"}

        before_url = complaint.get("image_url") or "sample_before_pothole.jpg"
        audit = gemma_civic_engine.audit_resolution_photos(before_url, after_image_url, complaint.get("sector", ""))

        all_c = load_complaints()
        for idx, c in enumerate(all_c):
            if c.get("case_id", "").upper() == complaint.get("case_id", "").upper():
                if audit["is_resolution_verified"]:
                    all_c[idx]["status"] = "VERIFIED_RESOLVED"
                    all_c[idx]["closed_at"] = datetime.now(timezone.utc).isoformat()
                    all_c[idx]["resolution_audit"] = audit
                    all_c[idx]["timeline"].append({
                        "time": datetime.now(timezone.utc).isoformat(),
                        "event": "Gemma 4 Vision verified field repair. Ticket marked VERIFIED_RESOLVED."
                    })
                else:
                    all_c[idx]["status"] = "CLOSURE_REJECTED"
                    all_c[idx]["resolution_audit"] = audit
                    all_c[idx]["timeline"].append({
                        "time": datetime.now(timezone.utc).isoformat(),
                        "event": "Gemma 4 Vision REJECTED closure attempt: Fake closure / unverified photo. Penalty logged on staff record."
                    })
                save_complaints(all_c)
                return all_c[idx]

        return {"status": "error", "message": "Failed to update complaint"}

    def get_analytics(self) -> Dict[str, Any]:
        """Calculates multi-tiered telemetry and macro volume statistics."""
        complaints = load_complaints()
        total = len(complaints)
        resolved = sum(1 for c in complaints if c.get("status") in ["RESOLVED", "VERIFIED_RESOLVED"])
        active = total - resolved
        p1_count = sum(1 for c in complaints if "P1" in c.get("priority_tier", ""))
        border_count = sum(1 for c in complaints if c.get("is_border_zone"))
        duplicate_count = sum(1 for c in complaints if c.get("is_duplicate_ticket"))

        # Sector breakdown
        sectors = {}
        priority_dist = {}
        status_dist = {}
        for c in complaints:
            sec = c.get("sector", "General")
            sectors[sec] = sectors.get(sec, 0) + 1
            pt = c.get("priority_tier", "P3_ESSENTIAL")
            priority_dist[pt] = priority_dist.get(pt, 0) + 1
            st = c.get("status", "ASSIGNED")
            status_dist[st] = status_dist.get(st, 0) + 1

        return {
            "total_complaints": total,
            "border_zone_cases": border_count,
            "duplicate_cases": duplicate_count,
            "priority_distribution": priority_dist,
            "status_breakdown": status_dist,
            "macro_national_baseline": {
                "source": "MoHUA Swachhata National Dashboard",
                "cumulative_grievances_registered": "2.55 Crore (25.5M)",
                "national_resolution_rate": ">94%"
            },
            "active_portal_telemetry": {
                "total_complaints_registered": total,
                "active_under_investigation": active,
                "verified_resolved": resolved,
                "critical_p1_safety_hazards": p1_count,
                "border_zone_joint_dispatches": border_count,
                "duplicate_tickets_clustered": duplicate_count,
                "monsoon_surge_status": "Active Policy (Jun-Sep: 2.5x Pothole/Drain Multiplier)"
            },
            "complaint_volume_by_sector": sectors,
            "praja_foundation_10yr_benchmark": {
                "average_pothole_resolution": "64 Days",
                "average_drainage_resolution": "32 Days",
                "average_water_supply_resolution": "26 Days",
                "average_solid_waste_resolution": "28 Days"
            }
        }

civic_complaint_service = CivicComplaintService()
