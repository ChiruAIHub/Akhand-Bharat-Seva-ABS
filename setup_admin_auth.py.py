"""
Akhand Bharat Seva - Automated Municipal Authentication Setup Script
Location: C:\\Users\\Techcho\\.gemini\\antigravity\\scratch\\gitlaunch-contribution-finder\\setup_admin_auth.py

Run this script inside your project directory to automatically install:
1. municipal_auth.py (Authentication logic & credentials)
2. templates/admin_login.html (Command center login UI)
3. Patching instructions for your main web app file
"""

import os
import sys

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# ---------------------------------------------------------------------
# 1. Create municipal_auth.py
# ---------------------------------------------------------------------
AUTH_CODE = '''"""
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
'''

# ---------------------------------------------------------------------
# 2. Create templates/admin_login.html
# ---------------------------------------------------------------------
LOGIN_TEMPLATE = '''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Municipal Officer Login | Akhand Bharat Seva</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        body {
            background-color: #0b1120;
            background-image: radial-gradient(circle at 50% 20%, #1e293b 0%, #0b1120 70%);
        }
    </style>
</head>
<body class="min-h-screen flex items-center justify-center p-4">

    <div class="max-w-md w-full bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl p-8 backdrop-blur-xl">
        <div class="text-center mb-6">
            <div class="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-400 mb-3 text-2xl shadow-inner">
                <i class="fa-solid fa-building-columns"></i>
            </div>
            <h1 class="text-2xl font-bold text-white tracking-wide">Akhand Bharat Seva</h1>
            <p class="text-xs uppercase tracking-wider text-slate-400 font-medium mt-1">
                Municipal Command & Control Center
            </p>
            <div class="inline-block mt-3 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-400 text-xs font-medium">
                <i class="fa-solid fa-shield-halved mr-1"></i> Authorized Municipal Personnel Only
            </div>
        </div>

        {% if error %}
        <div class="mb-5 p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center gap-2.5">
            <i class="fa-solid fa-circle-exclamation text-sm shrink-0"></i>
            <span>{{ error }}</span>
        </div>
        {% endif %}

        <form action="/admin/login" method="POST" class="space-y-4">
            <div>
                <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Official Municipal Email
                </label>
                <div class="relative">
                    <span class="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500 pointer-events-none">
                        <i class="fa-solid fa-envelope"></i>
                    </span>
                    <input 
                        type="email" 
                        name="email" 
                        required 
                        placeholder="officer@hyderabad.gov.in"
                        class="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    >
                </div>
            </div>

            <div>
                <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Municipal Security Code / Officer Token
                </label>
                <div class="relative">
                    <span class="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500 pointer-events-none">
                        <i class="fa-solid fa-key"></i>
                    </span>
                    <input 
                        type="password" 
                        name="access_code" 
                        required 
                        placeholder="GHMC-IAS-XXXX"
                        class="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent tracking-wider transition"
                    >
                </div>
            </div>

            <button 
                type="submit" 
                class="w-full mt-2 py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/20 text-sm flex items-center justify-center gap-2 transition cursor-pointer"
            >
                <i class="fa-solid fa-unlock-keyhole"></i>
                <span>Authenticate & Access Dashboard</span>
            </button>
        </form>

        <div class="mt-6 p-3 bg-slate-800/50 rounded-xl border border-slate-700/60 text-[11px] text-slate-400">
            <span class="font-semibold text-slate-300 block mb-1">Demo Official Credentials:</span>
            <div class="font-mono text-slate-300">rajeshwar.ias@hyderabad.gov.in</div>
            <div class="font-mono text-blue-400">GHMC-IAS-9081</div>
        </div>

        <div class="mt-6 border-t border-slate-800/80 pt-4 text-center">
            <p class="text-[11px] text-slate-500">
                Unauthorized access is strictly prohibited and logged under IT Act 2000.
            </p>
            <a href="/" class="inline-flex items-center gap-1.5 mt-2 text-xs text-blue-400 hover:text-blue-300 transition">
                <i class="fa-solid fa-arrow-left"></i> Citizen Portal
            </a>
        </div>
    </div>

</body>
</html>
'''


def run_setup():
    print("[*] Setting up Municipal Authentication System...")

    # Write municipal_auth.py
    auth_file_path = os.path.join(BASE_DIR, "municipal_auth.py")
    with open(auth_file_path, "w", encoding="utf-8") as f:
        f.write(AUTH_CODE.strip() + "\n")
    print(f"[+] Created: {auth_file_path}")

    # Determine templates directory
    templates_dir = os.path.join(BASE_DIR, "templates")
    if not os.path.exists(templates_dir):
        # Check subdirectories
        for root, dirs, _ in os.walk(BASE_DIR):
            if "templates" in dirs:
                templates_dir = os.path.join(root, "templates")
                break
        os.makedirs(templates_dir, exist_ok=True)

    login_file_path = os.path.join(templates_dir, "admin_login.html")
    with open(login_file_path, "w", encoding="utf-8") as f:
        f.write(LOGIN_TEMPLATE.strip() + "\n")
    print(f"[+] Created: {login_file_path}")

    print("\n[✓] Files created successfully!")
    print("\nNext: If your AI agent is running, ask it to connect `municipal_auth` into your main server file (e.g. main.py) so requests to `/admin` are gated by the login check.")


if __name__ == "__main__":
    run_setup()