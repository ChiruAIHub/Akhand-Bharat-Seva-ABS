"""
Continuous Cloudflare Tunnel Supervisor & Watchdog for Akhand Bharat Seva
Monitors cloudflared process, captures active public URL, and auto-heals if disconnected.
"""

import os
import re
import sys
import time
import subprocess

PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
CLOUDFLARED_BIN = os.path.join(PROJECT_ROOT, "cloudflared.exe")
LIVE_URL_FILE = os.path.join(PROJECT_ROOT, "LIVE_PUBLIC_URL.txt")
README_FILE = os.path.join(PROJECT_ROOT, "README.md")
DIST_INDEX_FILE = os.path.join(PROJECT_ROOT, "frontend", "akhand_bharat_seva", "dist", "akhand-bharat-seva", "browser", "index.html")
SRC_INDEX_FILE = os.path.join(PROJECT_ROOT, "frontend", "akhand_bharat_seva", "src", "index.html")

def update_index_files(public_url: str):
    """Updates the quick access dock links across dist, src index.html, and README.md."""
    for filepath in [DIST_INDEX_FILE, SRC_INDEX_FILE, README_FILE]:
        if os.path.exists(filepath):
            try:
                with open(filepath, "r", encoding="utf-8") as f:
                    content = f.read()
                # Replace any previous trycloudflare URL with the current one
                updated = re.sub(
                    r'https://[a-zA-Z0-9-]+\.trycloudflare\.com',
                    public_url,
                    content
                )
                if updated != content:
                    with open(filepath, "w", encoding="utf-8") as f:
                        f.write(updated)
                    print(f"[SUPERVISOR] Updated public link in {os.path.basename(filepath)}")
            except Exception as e:
                print(f"[SUPERVISOR] Warning updating {filepath}: {e}")

def run_tunnel():
    if not os.path.exists(CLOUDFLARED_BIN):
        print(f"[SUPERVISOR] Error: {CLOUDFLARED_BIN} not found!")
        return

    print(f"[SUPERVISOR] Launching Cloudflare Tunnel for http://127.0.0.1:8000 ...")
    cmd = [CLOUDFLARED_BIN, "tunnel", "--url", "http://127.0.0.1:8000"]

    while True:
        try:
            process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                bufsize=1,
                encoding="utf-8",
                errors="replace"
            )

            current_url = None
            url_pattern = re.compile(r'https://[a-zA-Z0-9-]+\.trycloudflare\.com')

            for line in process.stdout:
                line_str = line.strip()
                if "trycloudflare.com" in line_str:
                    match = url_pattern.search(line_str)
                    if match:
                        found_url = match.group(0)
                        if found_url != current_url:
                            current_url = found_url
                            print(f"\n========================================================")
                            print(f" [TUNNEL ACTIVE] LIVE PUBLIC URL: {current_url}")
                            print(f"========================================================\n")
                            # Save to disk
                            with open(LIVE_URL_FILE, "w", encoding="utf-8") as f:
                                f.write(current_url)
                            update_index_files(current_url)

            process.wait()
            print(f"[SUPERVISOR] Cloudflared exited with code {process.returncode}. Restarting in 3 seconds...")
            time.sleep(3)

        except Exception as err:
            print(f"[SUPERVISOR] Unexpected error: {err}. Restarting in 5 seconds...")
            time.sleep(5)

if __name__ == "__main__":
    run_tunnel()
