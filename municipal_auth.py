"""
Municipal Command Center Authentication & Access Control
"""

import hmac
import hashlib
from typing import Optional, Dict

AUTH_SECRET_KEY = "akhand-bharat-seva-municipal-secret-key-2025"

# Authorized roster of municipal officers & unique access codes
AUTHORIZED_MUNICIPAL_OFFICERS: Dict[str, Dict[str, str]] = {
    "rajeshwar.ias@hyderabad.gov.in": {
        "access_code": "GHMC-IAS-9081",
        "name": "K. Rajeshwar Rao, IAS",
        "role": "Zonal Commissioner",
        "initials": "KR"
    },
    "admin.command@hyderabad.gov.in": {
        "access_code": "GHMC-HQ-4421",
        "name": "Control Room Admin",
        "role": "Chief Operations Officer",
        "initials": "CR"
    },
    "water.dept@hyderabad.gov.in": {
        "access_code": "GHMC-HMWSSB-1032",
        "name": "S. Venkat Reddy",
        "role": "Executive Engineer",
        "initials": "VR"
    },
    "roads.dept@hyderabad.gov.in": {
        "access_code": "GHMC-RND-5541",
        "name": "P. Anuradha Rao",
        "role": "Superintending Engineer",
        "initials": "AR"
    }
}

def generate_session_token(email: str) -> str:
    """Creates a tamper-proof signed cookie string."""
    sig = hmac.new(
        AUTH_SECRET_KEY.encode(),
        email.lower().strip().encode(),
        hashlib.sha256
    ).hexdigest()
    return f"{email.lower().strip()}:{sig}"

def verify_session_token(token: Optional[str]) -> Optional[Dict[str, str]]:
    """Verifies cookie signature and returns officer data if valid."""
    if not token or ":" not in token:
        return None
    try:
        email, sig = token.split(":", 1)
        expected_sig = hmac.new(
            AUTH_SECRET_KEY.encode(),
            email.lower().strip().encode(),
            hashlib.sha256
        ).hexdigest()
        
        if not hmac.compare_digest(sig, expected_sig):
            return None
            
        return AUTHORIZED_MUNICIPAL_OFFICERS.get(email.lower().strip())
    except Exception:
        return None

def authenticate_officer(email: str, access_code: str) -> Optional[Dict[str, str]]:
    """Checks submitted email and municipal unique code."""
    officer = AUTHORIZED_MUNICIPAL_OFFICERS.get(email.lower().strip())
    if officer and officer["access_code"] == access_code.strip():
        return officer
    return None
