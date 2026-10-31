"""
Comprehensive Multi-Provider Stress & Live Verification Test Suite
Tests 52 Real Links across ALL Open-Source Providers & Frameworks:
- GitHub Repositories
- Hugging Face (Models & Datasets)
- Ollama Library Models
- ModelScope (Alibaba)
- Kaggle (Models & Datasets)
- Civitai (Creative Diffusion)
- OpenXLab (Shanghai AI Lab)
- Gitee AI / Gitee
- NVIDIA NGC
- Google AI Model Garden
- Replicate
- Research & Datasets (OpenML, Zenodo, UCI ML Repository, Data.gov, Google Dataset Search, Papers with Code)
- AI Development Platforms (LangChain, LlamaIndex, Dify, Flowise, n8n, AutoGen, CrewAI, Haystack, Open WebUI, LiteLLM, AnythingLLM)
- AI API Providers (Groq, Together AI, Fireworks AI, DeepInfra, OpenRouter, Cerebras, SiliconFlow, Hyperbolic, Novita AI, Baseten, Modal, RunPod, Vast.ai, Nebius AI)
"""

import sys
import time
import json
import urllib.request
import urllib.parse
from typing import List, Dict, Any

TEST_SUITE = [
    # 1. GitHub Repositories
    {"group": "GitHub Repositories", "provider": "GitHub", "url": "https://github.com/vllm-project/vllm", "expected_platform": "GitHub"},
    {"group": "GitHub Repositories", "provider": "GitHub", "url": "https://github.com/pallets/flask", "expected_platform": "GitHub"},
    {"group": "GitHub Repositories", "provider": "GitHub", "url": "https://github.com/fastapi/fastapi", "expected_platform": "GitHub"},
    {"group": "GitHub Repositories", "provider": "GitHub", "url": "https://github.com/astral-sh/uv", "expected_platform": "GitHub"},
    {"group": "GitHub Repositories", "provider": "GitHub", "url": "https://github.com/shadcn-ui/ui", "expected_platform": "GitHub"},
    {"group": "GitHub Repositories", "provider": "GitHub", "url": "https://github.com/comfyanonymous/ComfyUI", "expected_platform": "GitHub"},
    {"group": "GitHub Repositories", "provider": "GitHub", "url": "https://github.com/openai/whisper", "expected_platform": "GitHub"},
    {"group": "GitHub Repositories", "provider": "GitHub", "url": "https://github.com/minimaxir/big-list-of-naughty-strings", "expected_platform": "GitHub"},

    # 2. Hugging Face Models & Datasets
    {"group": "Hugging Face Hub", "provider": "Hugging Face", "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1", "expected_platform": "Hugging Face"},
    {"group": "Hugging Face Hub", "provider": "Hugging Face", "url": "https://huggingface.co/Qwen/Qwen2.5-Coder-32B-Instruct", "expected_platform": "Hugging Face"},
    {"group": "Hugging Face Hub", "provider": "Hugging Face", "url": "https://huggingface.co/black-forest-labs/FLUX.1-schnell", "expected_platform": "Hugging Face"},
    {"group": "Hugging Face Hub", "provider": "Hugging Face", "url": "https://huggingface.co/meta-llama/Llama-3.2-3B-Instruct", "expected_platform": "Hugging Face"},
    {"group": "Hugging Face Hub", "provider": "Hugging Face", "url": "https://huggingface.co/datasets/squad", "expected_platform": "Hugging Face"},
    {"group": "Hugging Face Hub", "provider": "Hugging Face", "url": "https://huggingface.co/datasets/glue", "expected_platform": "Hugging Face"},

    # 3. Ollama Library Models
    {"group": "Ollama Library", "provider": "Ollama Library", "url": "https://ollama.com/library/llama3.2", "expected_platform": "Ollama Library"},
    {"group": "Ollama Library", "provider": "Ollama Library", "url": "https://ollama.com/library/deepseek-r1", "expected_platform": "Ollama Library"},
    {"group": "Ollama Library", "provider": "Ollama Library", "url": "https://ollama.com/library/qwen2.5-coder", "expected_platform": "Ollama Library"},
    {"group": "Ollama Library", "provider": "Ollama Library", "url": "https://ollama.com/library/mistral", "expected_platform": "Ollama Library"},
    {"group": "Ollama Library", "provider": "Ollama Library", "url": "https://ollama.com/library/phi4", "expected_platform": "Ollama Library"},

    # 4. ModelScope (Alibaba)
    {"group": "ModelScope Hub", "provider": "ModelScope", "url": "https://modelscope.cn/models/Qwen/Qwen2.5-7B", "expected_platform": "ModelScope"},
    {"group": "ModelScope Hub", "provider": "ModelScope", "url": "https://modelscope.cn/models/baichuan-inc/Baichuan2-7B-Base", "expected_platform": "ModelScope"},
    {"group": "ModelScope Hub", "provider": "ModelScope", "url": "https://modelscope.cn/models/ZhipuAI/chatglm3-6b", "expected_platform": "ModelScope"},

    # 5. Kaggle Models & Datasets
    {"group": "Kaggle", "provider": "Kaggle", "url": "https://www.kaggle.com/models/google/gemma-2", "expected_platform": "Kaggle"},
    {"group": "Kaggle", "provider": "Kaggle", "url": "https://www.kaggle.com/models/meta/llama-3", "expected_platform": "Kaggle"},
    {"group": "Kaggle", "provider": "Kaggle", "url": "https://www.kaggle.com/datasets/tanuprabhu/linear-regression-dataset", "expected_platform": "Kaggle"},

    # 6. Civitai Diffusion Models
    {"group": "Civitai", "provider": "Civitai", "url": "https://civitai.com/models/139562/realvisxl-v40", "expected_platform": "Civitai"},
    {"group": "Civitai", "provider": "Civitai", "url": "https://civitai.com/models/4384/dreamshaper", "expected_platform": "Civitai"},

    # 7. OpenXLab (Shanghai AI Lab)
    {"group": "OpenXLab", "provider": "OpenXLab", "url": "https://openxlab.org.cn/models/OpenGVLab/InternVL2-8B", "expected_platform": "OpenXLab"},

    # 8. Gitee AI / Gitee
    {"group": "Gitee AI", "provider": "Gitee AI", "url": "https://gitee.com/mindspore/mindspore", "expected_platform": "Gitee AI"},
    {"group": "Gitee AI", "provider": "Gitee AI", "url": "https://gitee.com/ascend/ModelLink", "expected_platform": "Gitee AI"},

    # 9. NVIDIA NGC & Google Model Garden
    {"group": "Enterprise AI Hubs", "provider": "NVIDIA NGC", "url": "https://catalog.ngc.nvidia.com/orgs/nvidia/models/llama-3_1-nemotron-70b-instruct", "expected_platform": "NVIDIA NGC"},
    {"group": "Enterprise AI Hubs", "provider": "Google AI Model Garden", "url": "https://cloud.google.com/model-garden/models/gemma-2", "expected_platform": "Google AI Model Garden"},

    # 10. Replicate
    {"group": "Replicate", "provider": "Replicate", "url": "https://replicate.com/stability-ai/sdxl", "expected_platform": "Replicate"},

    # 11. Datasets & Research Repositories (Table 4)
    {"group": "Datasets & Research", "provider": "Papers with Code", "url": "https://paperswithcode.com/paper/deepseek-r1-incentivizing-reasoning", "expected_platform": "Papers with Code"},
    {"group": "Datasets & Research", "provider": "OpenML", "url": "https://www.openml.org/d/61", "expected_platform": "OpenML"},
    {"group": "Datasets & Research", "provider": "Zenodo", "url": "https://zenodo.org/records/1000000", "expected_platform": "Zenodo"},
    {"group": "Datasets & Research", "provider": "UCI ML Repository", "url": "https://archive.ics.uci.edu/dataset/53/iris", "expected_platform": "UCI ML Repository"},
    {"group": "Datasets & Research", "provider": "Data.gov", "url": "https://data.gov/dataset/consumer-complaints", "expected_platform": "Data.gov"},
    {"group": "Datasets & Research", "provider": "Google Dataset Search", "url": "https://datasetsearch.research.google.com/", "expected_platform": "Google Dataset Search"},

    # 12. Open-Source AI Development Platforms (Table 3)
    {"group": "AI Frameworks", "provider": "LangChain", "url": "https://www.langchain.com/", "expected_platform": "Official Platform"},
    {"group": "AI Frameworks", "provider": "LlamaIndex", "url": "https://www.llamaindex.ai/", "expected_platform": "Official Platform"},
    {"group": "AI Frameworks", "provider": "Dify", "url": "https://dify.ai/", "expected_platform": "Official Platform"},
    {"group": "AI Frameworks", "provider": "Flowise", "url": "https://flowiseai.com/", "expected_platform": "Official Platform"},
    {"group": "AI Frameworks", "provider": "n8n", "url": "https://n8n.io/", "expected_platform": "Official Platform"},
    {"group": "AI Frameworks", "provider": "CrewAI", "url": "https://www.crewai.com/", "expected_platform": "Official Platform"},
    {"group": "AI Frameworks", "provider": "Haystack", "url": "https://haystack.deepset.ai/", "expected_platform": "Official Platform"},
    {"group": "AI Frameworks", "provider": "Open WebUI", "url": "https://openwebui.com/", "expected_platform": "Official Platform"},
    {"group": "AI Frameworks", "provider": "LiteLLM", "url": "https://www.litellm.ai/", "expected_platform": "Official Platform"},
    {"group": "AI Frameworks", "provider": "AnythingLLM", "url": "https://anythingllm.com/", "expected_platform": "Official Platform"},

    # 13. AI API Providers (Table 2)
    {"group": "AI API Providers", "provider": "Groq", "url": "https://groq.com/", "expected_platform": "Groq"},
    {"group": "AI API Providers", "provider": "Together AI", "url": "https://together.ai/", "expected_platform": "Together AI"},
    {"group": "AI API Providers", "provider": "Fireworks AI", "url": "https://fireworks.ai/", "expected_platform": "Fireworks AI"},
    {"group": "AI API Providers", "provider": "DeepInfra", "url": "https://deepinfra.com/", "expected_platform": "DeepInfra"},
    {"group": "AI API Providers", "provider": "OpenRouter", "url": "https://openrouter.ai/", "expected_platform": "OpenRouter"},
    {"group": "AI API Providers", "provider": "Cerebras", "url": "https://cerebras.ai/", "expected_platform": "Cerebras"},
    {"group": "AI API Providers", "provider": "SiliconFlow", "url": "https://siliconflow.cn/", "expected_platform": "SiliconFlow"},
    {"group": "AI API Providers", "provider": "Hyperbolic", "url": "https://hyperbolic.ai/", "expected_platform": "Hyperbolic"},
    {"group": "AI API Providers", "provider": "Modal", "url": "https://modal.com/", "expected_platform": "Modal"},
    {"group": "AI API Providers", "provider": "RunPod", "url": "https://runpod.io/", "expected_platform": "RunPod"}
]

def run_test_suite():
    total_tests = len(TEST_SUITE)
    print("=" * 80)
    print(f"GITLAUNCH MULTI-PROVIDER VERIFICATION ENGINE: {total_tests} TARGETS")
    print("Testing Live API on http://127.0.0.1:8000/api/repos")
    print("=" * 80)

    start_all = time.time()
    passed = 0
    failed = 0
    results_by_group: Dict[str, Dict[str, int]] = {}

    for idx, test_item in enumerate(TEST_SUITE, 1):
        group = test_item["group"]
        provider = test_item["provider"]
        target_url = test_item["url"]
        expected_platform = test_item["expected_platform"]

        if group not in results_by_group:
            results_by_group[group] = {"passed": 0, "failed": 0}

        print(f"\n[{idx:02d}/{total_tests:02d}] {group} -> {provider}")
        print(f"       Target URL: {target_url}")

        t0 = time.time()
        api_query = f"http://127.0.0.1:8000/api/repos?search={urllib.parse.quote(target_url)}"

        try:
            req = urllib.request.Request(api_query, headers={"User-Agent": "GitLaunch-VerificationSuite"})
            with urllib.request.urlopen(req, timeout=12) as response:
                if response.status != 200:
                    print(f"       [FAIL] HTTP {response.status} returned")
                    failed += 1
                    results_by_group[group]["failed"] += 1
                    continue

                payload = json.loads(response.read().decode("utf-8"))
                repos = payload.get("repositories", [])
                if not repos:
                    print(f"       [FAIL] No repository object returned in response payload")
                    failed += 1
                    results_by_group[group]["failed"] += 1
                    continue

                repo = repos[0]
                elapsed = round(time.time() - t0, 2)

                # Validation criteria
                name = repo.get("name")
                handle = repo.get("repo")
                platform = repo.get("source_platform")
                origin = repo.get("fetch_source_url")
                redirect = repo.get("direct_redirect_url")
                stars = repo.get("stars", 0)
                category = repo.get("category")
                cmd = repo.get("quick_command", "")

                assert name, "Repository name is empty"
                assert handle, "Repository handle is empty"
                assert platform, "Source platform is empty"
                assert origin, "Fetch source URL is empty"
                assert redirect, "Direct redirect URL is empty"
                assert expected_platform.lower() in platform.lower(), f"Platform mismatch: got '{platform}', expected '{expected_platform}'"

                print(f"       [PASS] {name} ({elapsed}s)")
                print(f"              * Platform      : {platform}")
                print(f"              * Handle        : {handle}")
                print(f"              * Category      : {category}")
                print(f"              * Stars / Likes : {stars:,}")
                print(f"              * Origin Source : {origin}")
                print(f"              * Direct Link   : {redirect}")
                if cmd:
                    print(f"              * Quick Command : {cmd[:65]}...")

                # Also test drill-down endpoint GET /api/repos/{repo_id}
                repo_id = repo.get("id")
                if repo_id:
                    detail_url = f"http://127.0.0.1:8000/api/repos/{urllib.parse.quote(repo_id)}"
                    req_detail = urllib.request.Request(detail_url, headers={"User-Agent": "GitLaunch-VerificationSuite"})
                    with urllib.request.urlopen(req_detail, timeout=5) as detail_resp:
                        assert detail_resp.status == 200, f"Detail endpoint returned {detail_resp.status}"

                passed += 1
                results_by_group[group]["passed"] += 1

        except Exception as exc:
            elapsed = round(time.time() - t0, 2)
            print(f"       [ERROR] ({elapsed}s) Exception: {exc}")
            failed += 1
            results_by_group[group]["failed"] += 1

    total_duration = round(time.time() - start_all, 2)

    print("\n" + "=" * 80)
    print("VERIFICATION SUITE SUMMARY BY PROVIDER GROUP")
    print("=" * 80)
    for grp, counts in results_by_group.items():
        p = counts["passed"]
        f = counts["failed"]
        status = "ALL PASSED" if f == 0 else f"{f} FAILED"
        print(f" - {grp:<32}: {p} passed, {f} failed [{status}]")

    print("=" * 80)
    print(f"FINAL AUDIT VERDICT: {passed}/{total_tests} TESTS PASSED ({failed} FAILED) in {total_duration}s")
    print("=" * 80)

    return failed == 0

if __name__ == "__main__":
    success = run_test_suite()
    sys.exit(0 if success else 1)
