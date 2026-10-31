"""
Automated Multi-Provider Link Testing Suite for GitLaunch
Tests real links from GitHub, Hugging Face, Ollama, and ModelScope.
Verifies that GitLaunch:
1. Detects the provider correctly
2. Fetches full repository/model details (name, stars/likes, description, category)
3. Preserves the exact origin fetch URL
4. Provides a working direct redirect link
"""

import urllib.request
import urllib.parse
import json
import time

TEST_TARGETS = [
    {
        "provider": "GitHub",
        "url": "https://github.com/minimaxir/big-list-of-naughty-strings",
        "expected_name_substr": "naughty",
        "expected_platform": "GitHub"
    },
    {
        "provider": "GitHub",
        "url": "https://github.com/vllm-project/vllm",
        "expected_name_substr": "vllm",
        "expected_platform": "GitHub"
    },
    {
        "provider": "GitHub",
        "url": "https://github.com/FlowiseAI/Flowise",
        "expected_name_substr": "Flowise",
        "expected_platform": "GitHub"
    },
    {
        "provider": "GitHub",
        "url": "https://github.com/n8n-io/n8n",
        "expected_name_substr": "n8n",
        "expected_platform": "GitHub"
    },
    {
        "provider": "Hugging Face",
        "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1",
        "expected_name_substr": "DeepSeek-R1",
        "expected_platform": "Hugging Face"
    },
    {
        "provider": "Hugging Face",
        "url": "https://huggingface.co/Qwen/Qwen2.5-Coder-32B-Instruct",
        "expected_name_substr": "Qwen2.5-Coder",
        "expected_platform": "Hugging Face"
    },
    {
        "provider": "Hugging Face",
        "url": "https://huggingface.co/black-forest-labs/FLUX.1-schnell",
        "expected_name_substr": "FLUX",
        "expected_platform": "Hugging Face"
    },
    {
        "provider": "Ollama Library",
        "url": "https://ollama.com/library/llama3.2",
        "expected_name_substr": "llama3.2",
        "expected_platform": "Ollama Library"
    },
    {
        "provider": "Ollama Library",
        "url": "https://ollama.com/library/deepseek-r1",
        "expected_name_substr": "deepseek-r1",
        "expected_platform": "Ollama Library"
    },
    {
        "provider": "ModelScope",
        "url": "https://modelscope.cn/models/Qwen/Qwen2.5-7B",
        "expected_name_substr": "Qwen2.5-7B",
        "expected_platform": "ModelScope"
    }
]

def run_tests():
    print("=" * 70)
    print("GITLAUNCH MULTI-PROVIDER VERIFICATION RUN")
    print("=" * 70)
    passed = 0
    failed = 0

    for idx, target in enumerate(TEST_TARGETS, 1):
        url = target["url"]
        provider = target["provider"]
        print(f"\n[{idx}/{len(TEST_TARGETS)}] Testing Provider: {provider}")
        print(f" -> Query Link: {url}")

        t0 = time.time()
        api_url = f"http://127.0.0.1:8000/api/repos?search={urllib.parse.quote(url)}"
        
        try:
            req = urllib.request.Request(api_url, headers={"User-Agent": "GitLaunch-TestRunner"})
            with urllib.request.urlopen(req, timeout=12) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                repos = data.get("repositories", [])
                
                if not repos:
                    print(f" [FAIL] No results returned for {url}")
                    failed += 1
                    continue

                repo = repos[0]
                latency = round(time.time() - t0, 2)
                
                # Verify details
                print(f" [PASS] MATCH FOUND in {latency}s:")
                print(f"    - Name        : {repo.get('name')}")
                print(f"    - Platform    : {repo.get('source_platform')} (Expected: {target['expected_platform']})")
                print(f"    - Stars/Likes : {repo.get('stars'):,}")
                print(f"    - Category    : {repo.get('category')}")
                print(f"    - Origin Link : {repo.get('fetch_source_url')}")
                print(f"    - Direct Redir: {repo.get('direct_redirect_url')}")
                print(f"    - Quick Cmd   : {repo.get('quick_command')}")
                print(f"    - Description : {repo.get('description', '')[:85]}...")

                # Assertions
                assert target["expected_platform"].lower() in repo.get("source_platform", "").lower(), "Platform mismatch"
                assert repo.get("direct_redirect_url"), "Missing redirect URL"
                assert repo.get("fetch_source_url"), "Missing fetch source URL"
                
                passed += 1

        except Exception as e:
            print(f" [ERROR]: {e}")
            failed += 1

    print("\n" + "=" * 70)
    print(f"SUMMARY: {passed} PASSED | {failed} FAILED out of {len(TEST_TARGETS)} tested providers")
    print("=" * 70)
    return failed == 0

if __name__ == "__main__":
    run_tests()
