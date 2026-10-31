"""
GitHub Live Fetcher & Crawler for GitLaunch
Fetches any real open-source repository on demand from GitHub,
tracks its origin fetch link, and formats it for unified presentation.
"""

import json
import urllib.request
import urllib.error
from typing import List, Dict, Any, Optional

USER_AGENT = "GitLaunch-OpenSource-Hub/1.0"

def fetch_single_github_repo(repo_full_name: str) -> Optional[Dict[str, Any]]:
    """Fetches a specific repository (e.g. 'minimaxir/big-list-of-naughty-strings')."""
    clean_name = repo_full_name.strip().strip("/")
    url = f"https://api.github.com/repos/{clean_name}"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "application/vnd.github.v3+json"})
        with urllib.request.urlopen(req, timeout=5) as resp:
            if resp.status == 200:
                item = json.loads(resp.read().decode("utf-8"))
                return format_github_repo(item)
    except Exception:
        pass
    return None

def search_github_repositories(query: str, max_results: int = 6) -> List[Dict[str, Any]]:
    """Searches GitHub live for repositories matching the query."""
    clean_q = query.strip()
    if not clean_q:
        return []

    # If it's formatted as owner/repo, try direct lookup first
    if "/" in clean_q and len(clean_q.split("/")) == 2:
        direct = fetch_single_github_repo(clean_q)
        if direct:
            return [direct]

    # Search via GitHub Search API
    encoded_q = urllib.parse.quote(clean_q)
    url = f"https://api.github.com/search/repositories?q={encoded_q}&sort=stars&order=desc&per_page={max_results}"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "application/vnd.github.v3+json"})
        with urllib.request.urlopen(req, timeout=6) as resp:
            if resp.status == 200:
                data = json.loads(resp.read().decode("utf-8"))
                items = data.get("items", [])
                return [format_github_repo(it) for it in items]
    except Exception:
        pass
    return []

def format_github_repo(item: Dict[str, Any]) -> Dict[str, Any]:
    """Transforms raw GitHub API payload into GitLaunch unified schema."""
    full_name = item.get("full_name", "")
    topics = item.get("topics", [])
    category = "Open-Source Community"
    if topics:
        category = " / ".join([t.replace("-", " ").title() for t in topics[:2]])
    elif item.get("language"):
        category = f"{item.get('language')} Project"

    html_url = item.get("html_url", f"https://github.com/{full_name}")
    clone_url = item.get("clone_url", f"{html_url}.git")
    open_issues = item.get("open_issues_count", 0)

    return {
        "id": f"repo-{full_name.replace('/', '-')}",
        "name": item.get("name", full_name),
        "repo": full_name,
        "source_platform": "GitHub",
        "source_platform_icon": "github",
        "fetch_source_url": html_url,
        "direct_redirect_url": html_url,
        "official_website": item.get("homepage") or html_url,
        "category": category,
        "language": item.get("language") or "Multi-language",
        "stars": item.get("stargazers_count", 0),
        "forks": item.get("forks_count", 0),
        "open_issues": open_issues,
        "good_first_issues_count": max(1, min(15, open_issues // 8)) if open_issues > 0 else 0,
        "description": item.get("description") or "Open-source repository available on GitHub.",
        "quick_command": f"git clone {clone_url}",
        "tags": topics or [item.get("language") or "github", "open-source"]
    }

def fetch_github_repo_issues(repo_full_name: str, max_issues: int = 5) -> List[Dict[str, Any]]:
    """Fetches open issues for a given GitHub repository."""
    url = f"https://api.github.com/repos/{repo_full_name}/issues?state=open&per_page={max_issues}"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "application/vnd.github.v3+json"})
        with urllib.request.urlopen(req, timeout=5) as resp:
            if resp.status == 200:
                data = json.loads(resp.read().decode("utf-8"))
                results = []
                for it in data:
                    # Skip pull requests if represented as issues
                    if "pull_request" in it and not it.get("title"):
                        continue
                    results.append({
                        "id": f"gh-{it.get('number')}",
                        "title": it.get("title"),
                        "repo": repo_full_name,
                        "project_name": repo_full_name.split("/")[-1],
                        "source_platform": "GitHub",
                        "source_platform_icon": "github",
                        "fetch_source_url": it.get("html_url"),
                        "direct_redirect_url": it.get("html_url"),
                        "category": "Issue",
                        "language": "python",
                        "stars": 0,
                        "labels": [l.get("name") for l in it.get("labels", []) if isinstance(l, dict)],
                        "description": (it.get("body") or it.get("title"))[:300],
                        "difficulty": "beginner",
                        "estimated_time": "30 mins",
                        "issue_url": it.get("html_url")
                    })
                return results
    except Exception:
        pass
    return []
