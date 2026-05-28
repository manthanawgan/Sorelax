"""Summarise Coral row data via Gemini into structured JSON."""

from __future__ import annotations

import json
import os
import re
from typing import Any

from google import genai
from google.genai import types


SUMMARY_KEYS = (
    "active_work",
    "recent_commits",
    "open_prs",
    "sprint_goal",
    "key_decisions",
    "relevant_slack_threads",
    "architecture_docs",
)

_BASE_PROMPT = """You are a project-context analyst. Given raw rows from GitHub, Linear, Slack, and Notion, produce a concise project snapshot.

Return ONLY valid JSON (no markdown fences, no commentary) with exactly these keys:
- active_work: list of strings (in-flight work items with owner hints)
- recent_commits: list of strings (short commit summaries)
- open_prs: list of strings (e.g. "#312: title (author)")
- sprint_goal: string (current sprint or cycle goal; empty string if unknown)
- key_decisions: list of strings
- relevant_slack_threads: list of strings (channel + topic snippets)
- architecture_docs: list of strings (doc titles)

Raw rows (JSON):
{rows}
"""


def _configure_gemini() -> genai.GenerativeModel:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("Missing GEMINI_API_KEY in environment")
    genai.configure(api_key=api_key)
    return genai.GenerativeModel("gemini-2.5-flash")


def _extract_json(text: str) -> dict[str, Any]:
    text = text.strip()
    fence = re.search(r"```(?:json)?\s*([\s\S]*?)```", text)
    if fence:
        text = fence.group(1).strip()
    return json.loads(text)


def _normalise(parsed: dict[str, Any]) -> dict[str, Any]:
    out: dict[str, Any] = {}
    for key in SUMMARY_KEYS:
        val = parsed.get(key)
        if key == "sprint_goal":
            if isinstance(val, list):
                out[key] = ", ".join(str(x) for x in val) if val else ""
            else:
                out[key] = str(val) if val else ""
        elif isinstance(val, list):
            out[key] = [str(x) for x in val]
        elif val is None:
            out[key] = []
        else:
            out[key] = [str(val)]
    return out


def summarise_rows(rows: list[dict[str, Any]], *, strict: bool = False) -> dict[str, Any]:
    """Call Gemini to summarise rows; retry once on invalid JSON."""
    model = _configure_gemini()
    rows_json = json.dumps(rows, default=str)
    prompt = _BASE_PROMPT.format(rows=rows_json)
    if strict:
        prompt += (
            "\n\nSTRICT: Output must be parseable JSON only. "
            "Use double quotes for all keys and string values. No trailing commas."
        )

    last_error: Exception | None = None
    for attempt in range(2):
        try:
            response = model.generate_content(prompt if attempt == 0 else prompt + "\n\nRETRY: JSON only.")
            text = response.text or ""
            parsed = _extract_json(text)
            return _normalise(parsed)
        except (json.JSONDecodeError, ValueError, AttributeError) as exc:
            last_error = exc
            strict = True
            continue

    raise ValueError(f"Gemini returned invalid JSON after retry: {last_error}") from last_error


if __name__ == "__main__":
    import sys
    from datetime import datetime, timezone
    from pathlib import Path

    from dotenv import load_dotenv

    load_dotenv()
    rows = json.load(sys.stdin)
    context = summarise_rows(rows)
    context["updated_at"] = datetime.now(timezone.utc).isoformat()
    context_path = Path.home() / ".sorelax" / "project_context.json"
    context_path.parent.mkdir(parents=True, exist_ok=True)
    context_path.write_text(json.dumps(context, indent=2), encoding="utf-8")
    json.dump(context, sys.stdout)
    sys.stdout.write("\n")
