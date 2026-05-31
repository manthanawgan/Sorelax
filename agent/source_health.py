"""Coral source health checks for Sorelax status endpoints."""

from __future__ import annotations

import subprocess

from agent.slack_coral import slack_source_healthy


def _coral_source_listed(name: str) -> bool:
    try:
        result = subprocess.run(
            ["coral", "source", "list"],
            capture_output=True,
            text=True,
            timeout=15,
        )
        out = (result.stdout + result.stderr).lower()
        return name in out and result.returncode == 0
    except (subprocess.TimeoutExpired, FileNotFoundError):
        return False


def source_health() -> dict[str, bool]:
    """Return health for github, linear, slack, and notion."""
    return {
        "github": _coral_source_listed("github"),
        "linear": _coral_source_listed("linear"),
        "slack": slack_source_healthy(),
        "notion": _coral_source_listed("notion"),
    }
