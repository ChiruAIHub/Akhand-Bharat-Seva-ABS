"""
5-Tier Priority Queue & Dynamic SLA Escalation Engine
Implements:
1. P1 to P5 Priority Matrix according to Official Citizen Charters (Doc 3).
2. Fatal Hazard Gatekeeper (missing manholes, sparking live wires).
3. Monsoon Surge Multiplier (2.5x - 4x surge in June - September from Doc 1).
4. 48-Hour Auto-Escalation countdown timer.
"""

import os
import json
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, List, Optional

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")
SLA_FILE = os.path.join(DATA_DIR, "civic_sla_benchmarks.json")

def load_sla_benchmarks() -> Dict[str, Any]:
    if os.path.exists(SLA_FILE):
        with open(SLA_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"benchmarks": {}, "monsoon_policy": {}}

# Fatal hazard keywords that trigger instantaneous P1 bypass
FATAL_HAZARDS = {
    "broken_or_missing_manhole": ["manhole", "open gutter", "manhole cover", "open drain hole", "nalah open"],
    "exposed_live_wires": ["live wire", "sparking", "electric pole tilt", "loose wire", "electric shock", "exposed cable"],
    "water_main_burst": ["pipe burst", "main pipe burst", "high pressure leak", "pipeline burst", "road submerged"],
    "aggressive_dog_pack": ["dog bite", "rabid dog", "aggressive pack", "child bitten"]
}

def is_monsoon_season(date: Optional[datetime] = None) -> bool:
    """Checks whether the date falls in the heavy monsoon window (June - September)."""
    d = date or datetime.now()
    return d.month in [6, 7, 8, 9]

def evaluate_complaint_priority(
    sector: str,
    sub_category: str,
    text: str,
    visual_severity_level: int = 1,
    submission_time: Optional[datetime] = None
) -> Dict[str, Any]:
    """
    Evaluates complaint urgency, assigning:
    - priority_tier (P1_CRITICAL to P5_REVENUE_STATUTORY)
    - target_sla_hours
    - escalation_deadline
    - hazard flags & supervisor routing
    """
    now = submission_time or datetime.now(timezone.utc)
    sla_db = load_sla_benchmarks()
    benchmarks = sla_db.get("benchmarks", {})
    lower_text = text.lower()

    # 1. Fatal Hazard Detection (Instant P1 Override)
    detected_hazard = None
    hazard_type = None

    for h_type, keywords in FATAL_HAZARDS.items():
        if any(kw in lower_text for kw in keywords):
            detected_hazard = True
            hazard_type = h_type
            break

    # Also Level 5 visual severity triggers P1
    if visual_severity_level >= 5:
        detected_hazard = True
        hazard_type = hazard_type or "visual_fatal_hazard"

    if detected_hazard:
        sla_hours = 4
        tier = "P1_CRITICAL"
        tier_label = "P1: Critical Life-Safety Hazard (0 - 4 Hours)"
        sla_target = "4 Hours"
        historical_note = "Immediate emergency crew bypass; instant alert to Ward Supervisor"
    
    # 2. Level 4 Visual Severity triggers P2 Urgent
    elif visual_severity_level == 4:
        sla_hours = 24
        tier = "P2_URGENT"
        tier_label = "P2: Urgent Public Health & Safety (24 Hours / 1 Day)"
        sla_target = "24 Hours"
        historical_note = "Elevated by Gemma Vision assessment (Level 4 Physical Damage)"

    # 3. Match against taxonomy & empirical benchmarks
    else:
        # Check specific category key
        matched_key = None
        for key in benchmarks.keys():
            if key in lower_text or key in sub_category.lower() or key in sector.lower():
                matched_key = key
                break

        if matched_key and matched_key in benchmarks:
            bm = benchmarks[matched_key]
            tier = bm["priority_tier"]
            sla_hours = bm["official_sla_hours"]
            sla_target = bm["official_sla_label"]
            historical_note = bm.get("historical_actual_avg", "Standard municipal SLA")
            tier_label = f"{tier}: {sla_target}"
        elif "water" in sector.lower():
            tier = "P3_ESSENTIAL"
            tier_label = "P3: Essential Urban Utilities (1 - 3 Days)"
            sla_hours = 48
            sla_target = "48 Hours"
            historical_note = "26 days (Praja Mumbai Historical Average)"
        elif "drainage" in sector.lower() or "sanitation" in sector.lower():
            tier = "P3_ESSENTIAL"
            tier_label = "P3: Essential Urban Utilities (1 - 2 Days)"
            sla_hours = 48
            sla_target = "48 Hours"
            historical_note = "32 days (Praja Mumbai Historical Average)"
        elif "road" in sector.lower():
            tier = "P4_CIVIL_MAINTENANCE"
            tier_label = "P4: Civil Infrastructure Maintenance (3 - 7 Working Days)"
            sla_hours = 168
            sla_target = "7 Days"
            historical_note = "64 days (Praja Mumbai Historical Average)"
        elif "property" in sector.lower() or "certificate" in sector.lower() or "administration" in sector.lower():
            tier = "P5_REVENUE_STATUTORY"
            tier_label = "P5: Revenue & Statutory Services (7 - 30 Days)"
            sla_hours = 360
            sla_target = "15 Days"
            historical_note = "Standard statutory service window"
        else:
            tier = "P3_ESSENTIAL"
            tier_label = "P3: Standard Municipal Priority (2 - 3 Days)"
            sla_hours = 72
            sla_target = "72 Hours"
            historical_note = "Standard charter baseline"

    # 4. Apply Monsoon Dynamic Escalation (June - September)
    monsoon_applied = False
    if is_monsoon_season(now) and tier in ["P4_CIVIL_MAINTENANCE", "P3_ESSENTIAL"]:
        if any(sec in sector.lower() for sec in ["road", "drainage", "water", "sewage"]):
            # Escalate priority by +1 tier during monsoon
            if tier == "P4_CIVIL_MAINTENANCE":
                tier = "P2_URGENT"
                sla_hours = 24
                sla_target = "24 Hours (Monsoon Escalated)"
                tier_label = "P2: Urgent (Monsoon Surge Safety Rule)"
                monsoon_applied = True
            elif tier == "P3_ESSENTIAL":
                tier = "P2_URGENT"
                sla_hours = 24
                sla_target = "24 Hours (Monsoon Escalated)"
                tier_label = "P2: Urgent (Monsoon Waterlogging Prevention)"
                monsoon_applied = True

    # 5. Calculate Escalation Deadlines
    resolution_deadline = now + timedelta(hours=sla_hours)
    auto_escalate_deadline = now + timedelta(hours=min(48, max(4, sla_hours // 2)))

    return {
        "priority_tier": tier,
        "priority_label": tier_label,
        "target_sla_hours": sla_hours,
        "target_sla_label": sla_target,
        "historical_benchmark_reference": historical_note,
        "is_fatal_hazard": bool(detected_hazard),
        "hazard_type": hazard_type,
        "monsoon_surge_escalated": monsoon_applied,
        "resolution_deadline_iso": resolution_deadline.isoformat(),
        "auto_escalate_deadline_iso": auto_escalate_deadline.isoformat(),
        "requires_human_supervisor_alert": bool(detected_hazard) or tier == "P1_CRITICAL"
    }
