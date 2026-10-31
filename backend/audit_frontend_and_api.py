import os
import re
import json
import urllib.request
import urllib.error

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HTML_PATH = os.path.join(ROOT, "frontend", "index.html")

def audit_html_and_js():
    print("=" * 80)
    print("STEP 1: AUDITING FRONTEND HTML & JAVASCRIPT")
    print("=" * 80)
    with open(HTML_PATH, "r", encoding="utf-8") as f:
        html = f.read()

    script_match = re.search(r'<script>(.*?)</script>', html, re.DOTALL)
    if not script_match:
        print("[FAIL] No <script> tag found in index.html!")
        return False
    script = script_match.group(1)

    # 1. Audit event handlers
    handlers = re.findall(r'on\w+=["\']([^"\']+)["\']', html)
    called_funcs = set()
    for h in handlers:
        for m in re.findall(r'([a-zA-Z0-9_$]+)\s*\(', h):
            if m not in ['alert', 'console', 'preventDefault', 'stopPropagation']:
                called_funcs.add(m)

    missing = []
    for fn in called_funcs:
        if f"function {fn}" not in script and f"{fn} =" not in script and f"{fn}=" not in script:
            missing.append(fn)

    print(f"Total HTML functions checked: {len(called_funcs)}")
    if missing:
        print(f"[FAIL] Missing JavaScript functions: {missing}")
    else:
        print("[PASS] All HTML event handler functions are properly defined in JavaScript.")

    # 2. Audit getElementById calls
    dom_ids_in_js = set(re.findall(r'document\.getElementById\(["\']([^"\']+)["\']\)', script))
    html_ids = set(re.findall(r'id=["\']([^"\']+)["\']', html))
    
    missing_ids = [did for did in dom_ids_in_js if did not in html_ids]
    print(f"Total DOM element IDs checked: {len(dom_ids_in_js)}")
    if missing_ids:
        print(f"[FAIL] getElementById targets missing from HTML: {missing_ids}")
    else:
        print("[PASS] All DOM IDs referenced in JS exist in HTML.")

    return len(missing) == 0 and len(missing_ids) == 0

if __name__ == "__main__":
    audit_html_and_js()
