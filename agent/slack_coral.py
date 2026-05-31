"""Query Slack via Coral's per-channel messages table function."""

from __future__ import annotations

from typing import Any

from agent.coral_client import coral_query

_CHANNELS_SQL = "SELECT id, name FROM slack.channels"


def _sql_literal(value: str) -> str:
    return value.replace("'", "''")


def list_slack_channels() -> list[dict[str, Any]]:
    """Return Slack channels from Coral (id, name)."""
    try:
        return coral_query(_CHANNELS_SQL)
    except RuntimeError:
        return []


def fetch_channel_messages(
    channel_id: str,
    *,
    keyword: str | None = None,
    limit: int = 10,
) -> list[dict[str, Any]]:
    """Fetch messages for one channel; optional ILIKE keyword filter."""
    where = ""
    if keyword:
        where = f" WHERE text ILIKE '%{_sql_literal(keyword)}%'"
    sql = (
        f"SELECT text, user_id, ts FROM slack.messages(channel => '{_sql_literal(channel_id)}')"
        f"{where} ORDER BY ts DESC LIMIT {limit}"
    )
    return coral_query(sql)


def slack_source_healthy() -> bool:
    """True when at least one channel's messages query succeeds."""
    for channel in list_slack_channels():
        channel_id = channel.get("id")
        if not channel_id:
            continue
        try:
            fetch_channel_messages(str(channel_id), limit=1)
            return True
        except RuntimeError:
            continue
    return False


def search_slack_for_ask(keyword: str, *, limit_per_channel: int = 10) -> list[dict[str, Any]]:
    """Return on-demand ask rows from Slack across all channels."""
    rows: list[dict[str, Any]] = []
    for channel in list_slack_channels():
        channel_id = str(channel.get("id") or "")
        channel_name = str(channel.get("name") or channel_id)
        if not channel_id:
            continue
        try:
            messages = fetch_channel_messages(
                channel_id,
                keyword=keyword,
                limit=limit_per_channel,
            )
        except RuntimeError:
            continue
        for message in messages:
            text = str(message.get("text") or "")
            rows.append(
                {
                    "source_type": "slack.message",
                    "title": text[:120],
                    "detail": str(message.get("user_id") or ""),
                    "extra": channel_name,
                }
            )
    return rows


def fetch_slack_rows_for_refresh(*, limit_per_channel: int = 20) -> list[dict[str, Any]]:
    """Return project_state-compatible rows for Slack messages."""
    rows: list[dict[str, Any]] = []
    for channel in list_slack_channels():
        channel_id = str(channel.get("id") or "")
        channel_name = str(channel.get("name") or channel_id)
        if not channel_id:
            continue
        try:
            messages = fetch_channel_messages(channel_id, limit=limit_per_channel)
        except RuntimeError:
            continue
        for message in messages:
            rows.append(
                {
                    "commit_message": None,
                    "commit_author": None,
                    "committed_date": None,
                    "open_pr_title": None,
                    "pr_author": None,
                    "branch": None,
                    "linear_issue": None,
                    "assignee__name": None,
                    "priority": None,
                    "sprint": None,
                    "slack_message": message.get("text"),
                    "slack_author": message.get("user_id"),
                    "channel__name": channel_name,
                    "notion_doc": None,
                }
            )
    return rows
