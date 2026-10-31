"""
Unit & Integration Test Suite for GitLaunch Backend
Verifies all 4 screenshot endpoints, repo aggregator, ecosystem directory, and web UI.
"""

import os
import sys
import unittest
from fastapi.testclient import TestClient

# Add backend directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from main import app

class TestGitLaunchAPI(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_01_health_check(self):
        """Test 1: GET /api/health and GET /health"""
        resp = self.client.get("/api/health")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data.get("status"), "online")
        self.assertIn("ai_engine", data)

        resp_alias = self.client.get("/health")
        self.assertEqual(resp_alias.status_code, 200)
        print("\n[PASS] GET /api/health ->", data["ai_engine"], "| status:", data["status"])

    def test_02_repos_hub_aggregated(self):
        """Test 2: GET /api/repos (Unified Open-Source Repositories Hub with origin fetch links and redirects)"""
        resp = self.client.get("/api/repos")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertGreaterEqual(data.get("count"), 10)
        self.assertIn("available_platforms", data)
        sample = data["repositories"][0]
        self.assertIn("fetch_source_url", sample)
        self.assertIn("direct_redirect_url", sample)
        self.assertIn("source_platform", sample)
        print(f"[PASS] GET /api/repos -> Aggregated {data['count']} repos across {data['available_platforms']}.")
        print(f"       Sample: '{sample['name']}' from '{sample['source_platform']}' -> Redirect: {sample['direct_redirect_url']}")

    def test_03_match_issues_with_sources(self):
        """Test 3: POST /api/issues/match"""
        payload = {
            "languages": ["python", "javascript"],
            "experience": "beginner",
            "time": "1 hour"
        }
        resp = self.client.post("/api/issues/match", json=payload)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertGreaterEqual(data.get("count"), 1)
        top = data["issues"][0]
        self.assertIn("match_score", top)
        self.assertIn("direct_redirect_url", top)
        print(f"[PASS] POST /api/issues/match -> Found {data['count']} issues. Top: {top['repo']} ({top['match_score']}, {top['source_platform']})")

    def test_04_analyze_issue_screenshot_id_123(self):
        """Test 4: POST /api/issues/analyze for '123'"""
        payload = {"issue_id": "123"}
        resp = self.client.post("/api/issues/analyze", json=payload)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(len(data.get("summary_bullets", [])), 3)
        self.assertGreaterEqual(len(data.get("files_to_modify", [])), 1)
        self.assertIn("direct_redirect_url", data)
        print(f"[PASS] POST /api/issues/analyze for '123' -> 3 bullets: OK, files: {data['files_to_modify']}, diff: {data['difficulty_score']}")

    def test_05_pr_roadmap_screenshot_id_123(self):
        """Test 5: POST /api/issues/pr-roadmap for '123'"""
        payload = {"issue_id": "123"}
        resp = self.client.post("/api/issues/pr-roadmap", json=payload)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("git_clone_cmd", data)
        self.assertIn("git_branch_cmd", data)
        self.assertIn("direct_redirect_url", data)
        print(f"[PASS] POST /api/issues/pr-roadmap for '123' -> clone: '{data['git_clone_cmd']}', branch: '{data['git_branch_cmd']}'")

    def test_06_ecosystem_and_web_ui(self):
        """Test 6: GET /api/ecosystem and GET /"""
        resp_eco = self.client.get("/api/ecosystem")
        self.assertEqual(resp_eco.status_code, 200)

        resp_ui = self.client.get("/")
        self.assertEqual(resp_ui.status_code, 200)
        self.assertIn("GitLaunch", resp_ui.text)
        print(f"[PASS] GET / and /api/ecosystem -> Dashboard and Ecosystem directory fully active.")

if __name__ == "__main__":
    unittest.main()
