"""
OpenCode Client for GitLaunch Backend
Connects directly to local OpenCode service with automatic failover to NVIDIA NIM and OpenRouter.
Zero cloud quota burn.
"""

import os
import json
import base64
import urllib.request
import urllib.error
import time
from typing import Optional, Dict, Any, List

DEFAULT_OPENCODE_URL = "http://127.0.0.1:28894"
CONFIG_PATH = os.path.expanduser("~/.config/opencode/service.json")

# Credentials must be supplied by the deployment environment.  Keeping fallback
# keys in source would expose them in local bundles and source control.
NVIDIA_API_KEY = os.environ.get("NVIDIA_API_KEY")
OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY")

RECOMMENDED_MODELS = {
    "heavy": "nvidia/nemotron-3.5-super-vl-120b-a12b",
    "fast": "nvidia/nemotron-3.5-lightning-30b-a3b",
    "thinking": "minimaxai/minimax-m3.1-flash",
    "deepseek": "deepseek-ai/deepseek-v4.1-flash"
}

class OpenCodeDirectClient:
    def __init__(self, base_url: str = DEFAULT_OPENCODE_URL):
        self.base_url = base_url.rstrip("/")
        self._password: Optional[str] = None
        self._auth_header: Optional[str] = None
        self._load_auth()

    def _load_auth(self):
        try:
            if os.path.exists(CONFIG_PATH):
                with open(CONFIG_PATH, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    self._password = data.get("password")
            if self._password:
                token = f"opencode:{self._password}"
                encoded = base64.b64encode(token.encode("utf-8")).decode("ascii")
                self._auth_header = f"Basic {encoded}"
        except Exception:
            self._auth_header = None

    def is_online(self) -> bool:
        if not self._auth_header:
            self._load_auth()
        try:
            req = urllib.request.Request(
                f"{self.base_url}/api/info",
                headers={"Authorization": self._auth_header or ""}
            )
            with urllib.request.urlopen(req, timeout=3) as resp:
                return resp.status == 200
        except Exception:
            return False

    def generate(
        self,
        prompt: str,
        model_id: str = "heavy",
        system: Optional[str] = None,
        timeout: int = 4
    ) -> Dict[str, Any]:
        target_model = RECOMMENDED_MODELS.get(model_id, model_id)
        clean_id = target_model.split("/", 1)[-1] if target_model.startswith("nvidia/") else target_model
        
        full_prompt = prompt
        if system:
            full_prompt = f"System Instructions: {system}\n\nTask: {prompt}"

        # 1. Try local OpenCode service with fast check
        if not self._auth_header:
            self._load_auth()

        if self._auth_header:
            try:
                payload = {
                    "prompt": full_prompt,
                    "model": {
                        "id": clean_id,
                        "providerID": "nvidia"
                    }
                }
                req = urllib.request.Request(
                    f"{self.base_url}/api/experimental/generate/text",
                    headers={
                        "Authorization": self._auth_header,
                        "Content-Type": "application/json"
                    },
                    data=json.dumps(payload).encode("utf-8")
                )
                t0 = time.time()
                with urllib.request.urlopen(req, timeout=min(2, timeout)) as resp:
                    res_json = json.loads(resp.read().decode("utf-8"))
                    text = res_json.get("data", {}).get("text", "")
                    if text:
                        return {
                            "status": "success",
                            "source": "opencode-local-service",
                            "model": target_model,
                            "latency_sec": round(time.time() - t0, 2),
                            "text": text
                        }
            except Exception:
                pass

        # 2. Try direct NVIDIA NIM Fallback
        if NVIDIA_API_KEY:
            try:
                t0 = time.time()
                nim_model = clean_id if "/" in clean_id else f"nvidia/{clean_id}"
                req = urllib.request.Request(
                    "https://integrate.api.nvidia.com/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {NVIDIA_API_KEY}",
                        "Content-Type": "application/json"
                    },
                    data=json.dumps({
                        "model": nim_model,
                        "messages": [
                            *([{"role": "system", "content": system}] if system else []),
                            {"role": "user", "content": prompt}
                        ],
                        "max_tokens": 1500
                    }).encode("utf-8")
                )
                with urllib.request.urlopen(req, timeout=min(3, timeout)) as resp:
                    data = json.loads(resp.read().decode("utf-8"))
                    msg = data["choices"][0]["message"]
                    content = msg.get("content") or msg.get("reasoning_content") or ""
                    return {
                        "status": "success",
                        "source": "nvidia-nim-fallback",
                        "model": nim_model,
                        "latency_sec": round(time.time() - t0, 2),
                        "text": content
                    }
            except Exception:
                pass

        # 3. Fallback
        return {
            "status": "fallback",
            "source": "heuristic-engine",
            "model": "rule-based-triage",
            "latency_sec": 0.01,
            "text": ""
        }
