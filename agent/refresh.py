"""Orchestrate Coral query → Gemini summarise → persist context → CLAUDE.md."""

from __future__ import annotations

import json
import os
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Callable

from dotenv import load_dotenv

from agent.coral_client import coral_query
from agent.generate_context import write_claude_md
from agent.summariser import summarise_rows

SORELAX_DIR = Path.home() / ".sorelax"
CONTEXT_PATH = SORELAX_DIR / "project_context.json"
LOG_PATH = SORELAX_DIR / "project_log.jsonl"
QUERIES_DIR = Path(__file__).resolve().parent / "queries"

REQUIRED_ENV = (
    "GITHUB_OWNER",
    "GITHUB_REPO",
    "GEMINI_API_KEY",
)


def _ensure_dirs() -> None:
    SORELAX_DIR.mkdir(parents=True, exist_ok=True)


def _load_sql(name: str, **subs: str) -> str:
    sql = (QUERIES_DIR / name).read_text(encoding="utf-8")
    for key, val in subs.items():
        sql = sql.replace("{" + key + "}", val)
    return sql


def _check_env() -> None:
    missing = [k for k in REQUIRED_ENV if not os.getenv(k)]
    if missing:
        raise ValueError(
            "Missing required environment variable(s): " + ", ".join(missing)
        )


def _count_sources(rows: list[dict[str, Any]]) -> dict[str, int]:
    counts = {
        "github_commits": 0,
        "github_prs": 0,
        "linear_issues": 0,
        "slack_messages": 0,
        "notion_docs": 0,
    }
    channels: set[str] = set()
    sprints: set[str] = set()

    for row in rows:
        if row.get("commit_message") or row.get("commit_author"):
            counts["github_commits"] += 1
        if row.get("open_pr_title"):
            counts["github_prs"] += 1
        if row.get("linear_issue"):
            counts["linear_issues"] += 1
            if row.get("sprint"):
                sprints.add(str(row["sprint"]))
        if row.get("slack_message"):
            counts["slack_messages"] += 1
            if row.get("channel__name"):
                channels.add(str(row["channel__name"]))
        if row.get("notion_doc"):
            counts["notion_docs"] += 1

    counts["slack_channels"] = len(channels)
    counts["sprint_names"] = list(sprints)
    counts["channel_names"] = list(channels)
    return counts


def _skill_hints(rows: list[dict[str, Any]], context: dict[str, Any]) -> list[str]:
    hints: list[str] = []
    channels = sorted(
        {str(r["channel__name"]) for r in rows if r.get("channel__name")}
    )[:5]
    if channels:
        hints.append(f"Narrowed Slack filter to {', '.join('#' + c for c in channels)}")
    sprint = context.get("sprint_goal") or ""
    if sprint:
        hints.append(f"Pinned sprint: {sprint}")
    if context.get("architecture_docs"):
        hints.append(
            f"Tracked {len(context['architecture_docs'])} architecture doc(s)"
        )
    return hints


ProgressCallback = Callable[[str, float, str], None]


def run_refresh(
    *,
    output_dir: Path | None = None,
    on_source_progress: ProgressCallback | None = None,
) -> dict[str, Any]:
    """
    Full refresh pipeline.

    Returns a result dict with status, counts, context, timing, and skill hints.
    """
    load_dotenv()
    _check_env()
    _ensure_dirs()

    owner = os.environ["GITHUB_OWNER"]
    repo = os.environ["GITHUB_REPO"]

    sql = _load_sql("project_state.sql", owner=owner, repo=repo)

    sources = ["GitHub", "Linear", "Slack", "Notion"]
    t0 = time.perf_counter()

    if on_source_progress:
        for i, name in enumerate(sources):
            on_source_progress(name, (i + 1) / len(sources) * 0.5, "querying…")

    rows = coral_query(sql)
    elapsed = time.perf_counter() - t0

    if on_source_progress:
        for name in sources:
            on_source_progress(name, 1.0, "done")

    source_counts = _count_sources(rows)
    warnings: list[str] = []
    if not rows:
        warnings.append("Coral returned 0 rows — check source configuration")

    context = summarise_rows(rows)
    now = datetime.now(timezone.utc).isoformat()
    context["updated_at"] = now
    context["row_count"] = len(rows)

    with CONTEXT_PATH.open("w", encoding="utf-8") as f:
        json.dump(context, f, indent=2)

    log_entry = {
        "timestamp": now,
        "row_count": len(rows),
        "source_counts": {k: v for k, v in source_counts.items() if isinstance(v, int)},
        "status": "ok",
        "warnings": warnings,
    }
    with LOG_PATH.open("a", encoding="utf-8") as f:
        f.write(json.dumps(log_entry) + "\n")

    claude_path = write_claude_md(CONTEXT_PATH, output_dir)

    hints = _skill_hints(rows, context)

    return {
        "status": "ok",
        "row_count": len(rows),
        "source_counts": source_counts,
        "context": context,
        "claude_md": str(claude_path),
        "elapsed_seconds": round(elapsed, 2),
        "warnings": warnings,
        "skill_hints": hints,
        "sources_joined": 4,
        "sql_queries": 1,
    }


def load_context() -> dict[str, Any] | None:
    if not CONTEXT_PATH.exists():
        return None
    with CONTEXT_PATH.open(encoding="utf-8") as f:
        return json.load(f)


def load_logs(limit: int = 10) -> list[dict[str, Any]]:
    if not LOG_PATH.exists():
        return []
    lines = LOG_PATH.read_text(encoding="utf-8").strip().splitlines()
    entries = []
    for line in lines[-limit:]:
        try:
            entries.append(json.loads(line))
        except json.JSONDecodeError:
            continue
    return entries
