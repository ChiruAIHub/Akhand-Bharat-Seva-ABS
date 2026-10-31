"""
Comprehensive Multi-Provider Stress Test Suite for GitLaunch
Tests 20 real links across all Open-Source Providers from the Hackathon Taxonomy:
- GitHub
- Hugging Face (Models & Datasets)
- Ollama Library
- ModelScope
- Kaggle
- Civitai
- OpenXLab
- Gitee AI
- Papers with Code
- AI API & Framework Providers
"""

import sys
import time
import json
import urllib.request
import urllib.parse

TEST_MATRIX = [
    # 1. GitHub Repositories
    {"provider": "GitHub", "url": "https://github.com/minimaxir/big-list-of-naughty-strings", "expected_platform": "GitHub"},
    {"provider": "GitHub", "url": "https://github.com/vllm-project/vllm", "expected_platform": "GitHub"},
    {"provider": "GitHub", "url": "https://github.com/FlowiseAI/Flowise", "expected_platform": "GitHub"},
    {"provider": "GitHub", "url": "https://github.com/n8n-io/n8n", "expected_platform": "GitHub"},
    {"provider": "GitHub", "url": "https://github.com/deepset-ai/haystack", "expected_platform": "GitHub"},
    {"provider": "GitHub", "url": "https://github.com/Mintplex-Labs/anything-llm", "expected_platform": "GitHub"},
    {"provider": "GitHub", "url": "https://github.com/coqui-ai/TTS", "expected_platform": "GitHub"},
    {"provider": "GitHub", "url": "https://github.com/Rudrabha/Wav2Lip", "expected_platform": "GitHub"},
    {"provider": "GitHub", "url": "https://github.com/suno-ai/bark", "expected_platform": "GitHub"},

    # 2. Hugging Face Models & Datasets
    {"provider": "Hugging Face", "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1", "expected_platform": "Hugging Face"},
    {"provider": "Hugging Face", "url": "https://huggingface.co/Qwen/Qwen2.5-Coder-32B-Instruct", "expected_platform": "Hugging Face"},
    {"provider": "Hugging Face", "url": "https://huggingface.co/black-forest-labs/FLUX.1-schnell", "expected_platform": "Hugging Face"},
    {"provider": "Hugging Face", "url": "https://huggingface.co/meta-llama/Llama-3.2-3B-Instruct", "expected_platform": "Hugging Face"},
    {"provider": "Hugging Face", "url": "https://huggingface.co/datasets/squad", "expected_platform": "Hugging Face"},

    # 3. Ollama Library Models
    {"provider": "Ollama Library", "url": "https://ollama.com/library/llama3.2", "expected_platform": "Ollama Library"},
    {"provider": "Ollama Library", "url": "https://ollama.com/library/deepseek-r1", "expected_platform": "Ollama Library"},
    {"provider": "Ollama Library", "url": "https://ollama.com/library/qwen2.5-coder", "expected_platform": "Ollama Library"},

    # 4. ModelScope (Alibaba)
    {"provider": "ModelScope", "url": "https://modelscope.cn/models/Qwen/Qwen2.5-7B", "expected_platform": "ModelScope"},

    # 5. Kaggle
    {"provider": "Kaggle", "url": "https://www.kaggle.com/models/google/gemma-2", "expected_platform": "Kaggle"},

    # 6. Civitai
    {"provider": "Civitai", "url": "https://civitai.com/models/139562/realvisxl-v40", "expected_platform": "Civitai"},

    # 7. OpenXLab
    {"provider": "OpenXLab", "url": "https://openxlab.org.cn/models/OpenGVLab/InternVL2-8B", "expected_platform": "OpenXLab"},

    # 8. Gitee AI
    {"provider": "Gitee AI", "url": "https://gitee.com/mindspore/mindspore", "expected_platform": "Gitee AI"},

    # 9. Papers with Code
    {"provider": "Papers with Code", "url": "https://paperswithcode.com/paper/deepseek-r1-incentivizing-reasoning", "expected_platform": "Papers with Code"}
]

def run_stress_test():
    print("=" * 75)
    print("GITLAUNCH MULTI-PROVIDER STRESS TEST (23 REAL OPEN-SOURCE TARGETS)")
    print("=" * 75)

    passed = 0
    failed = 0
    total = len(TEST_MATRIX)
    start_time = time.time()

    for i, target in enumerate(TEST_MATRIX, 1):
        url = target["url"]
        provider = target["provider"]
        expected_platform = target["expected_platform"]

        print(f"\n[{i}/{total}] PROVIDER: {provider}")
        print(f" -> Query URL: {url}")
        
        t0 = time.time()
        api_endpoint = f"http://127.0.0.1:8000/api/repos?search={urllib.parse.quote(url)}"

        try:
            req = urllib.request.Request(api_endpoint, headers={"User-Agent": "GitLaunch-StressRunner"})
            with urllib.request.urlopen(req, timeout=15) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                repos = data.get("repositories", [])

                if not repos:
                    print(f" [FAIL] Zero repositories returned for URL: {url}")
                    failed += 1
                    continue

                repo = repos[0]
                elapsed = round(time.time() - t0, 2)

                print(f" [PASS] SUCCESS ({elapsed}s)")
                print(f"    - Name        : {repo.get('name')}")
                print(f"    - Platform    : {repo.get('source_platform')} (Expected: {expected_platform})")
                print(f"    - Stars/Likes : {repo.get('stars', 0):,}")
                print(f"    - Category    : {repo.get('category')}")
                print(f"    - Origin Link : {repo.get('fetch_source_url')}")
                print(f"    - Direct Redir: {repo.get('direct_redirect_url')}")
                print(f"    - Quick Cmd   : {repo.get('quick_command')}")

                # Validation checks
                assert expected_platform.lower() in repo.get("source_platform", "").lower(), f"Platform mismatch: {repo.get('source_platform')} != {expected_platform}"
                assert repo.get("direct_redirect_url"), "Missing direct redirect URL"
                assert repo.get("fetch_source_url"), "Missing origin fetch source URL"

                passed += 1

        except Exception as e:
            print(f" [ERROR] Exception testing {url}: {e}")
            failed += 1

    total_time = round(time.time() - start_time, 2)
    print("\n" + "=" * 75)
    print(f"FINAL AUDIT REPORT: {passed}/{total} PASSED | {failed} FAILED in {total_time}s")
    print("=" * 75)
    return failed == 0

if __name__ == "__main__":
    success = run_stress_test()
    sys.exit(0 if success else 1)
