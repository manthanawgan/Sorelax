"""Run Coral SQL queries via subprocess.

Coral does not support UNION / UNION ALL syntax.  When a list of SQL strings
is passed to ``coral_query``, each statement is executed individually and the
rows are merged in Python before returning.
"""

from __future__ import annotations

import json
import subprocess
from typing import Any


def _strip_comments(sql: str) -> str:
    """Remove SQL line comments and blank lines.

    Coral's CLI parser treats a leading '--' as a flag, so we must strip all
    comment lines before passing the query as a positional argument.
    """
    lines = [
        line for line in sql.splitlines()
        if not line.strip().startswith("--") and line.strip()
    ]
    return "\n".join(lines).strip()


def _run_single(sql: str) -> list[dict[str, Any]]:
    """Execute one SQL string against Coral and return its rows."""
    result = subprocess.run(
        ["coral", "sql", "--format", "json", _strip_comments(sql)],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        raise RuntimeError(
            result.stderr.strip() or f"Coral exited with code {result.returncode}"
        )
    if not result.stdout.strip():
        return []
    data = json.loads(result.stdout)
    if isinstance(data, list):
        return data
    if isinstance(data, dict) and "rows" in data:
        return data["rows"]
    return [data] if isinstance(data, dict) else []


def coral_query(
    sql: str | list[str],
    *,
    skip_errors: bool = False,
) -> list[dict[str, Any]]:
    """Run one or more Coral SQL queries and return the merged rows.

    Pass a *list* of SQL strings when the logical query would require UNION /
    UNION ALL — Coral does not support those keywords, so each part must be
    executed separately and the results merged here in Python.

    When ``skip_errors=True`` (automatically set for list input), individual
    query failures (e.g. a source not registered in Coral) are silently skipped
    so the remaining parts still return data.
    """
    if isinstance(sql, str):
        return _run_single(sql)

    # Multiple queries: run each and merge, skipping unavailable sources
    merged: list[dict[str, Any]] = []
    for statement in sql:
        try:
            merged.extend(_run_single(statement))
        except RuntimeError:
            # Source not registered or other per-query error — skip gracefully
            if not skip_errors:
                pass  # default: always skip individual failures in multi mode
    return merged
