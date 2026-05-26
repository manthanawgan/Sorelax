"""Run Coral SQL queries via subprocess."""

from __future__ import annotations

import json
import subprocess
from typing import Any


def coral_query(sql: str) -> list[dict[str, Any]]:
    result = subprocess.run(
        ["coral", "sql", "--format", "json", sql],
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
