"""FastAPI layer for the Sorelax web dashboard."""

from __future__ import annotations

import json
import os
import re
import subprocess
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Iterator, Literal

from dateutil import parser as date_parser
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from agent.coral_client import coral_query
from agent.refresh import QUERIES_DIR, load_context, load_logs
from sorelax_cli.scheduler import INTERVAL_HOURS, _pid_running, read_pid, stop_daemon

AgentState = Literal["active", "idle", "stopped", "error"]
LogStatus = Literal["ok", "error"]


class ProjectContext(BaseModel):
    active_work: list[str] = Field(default_factory=list)
    recent_commits: list[str] = Field(default_factory=list)
    open_prs: list[str] = Field(default_factory=list)
    sprint_goal: str = ""
    key_decisions: list[str] = Field(default_factory=list)
    relevant_slack_threads: list[str] = Field(default_factory=list)
    architecture_docs: list[str] = Field(default_factory=list)
    updated_at: str = ""
    row_count: int = 0


class SourceIndicator(BaseModel):
    id: str
    name: str
    healthy: bool
    count: int


class DashboardStatus(BaseModel):
    agentState: AgentState
    schedulerRunning: bool
    lastRefresh: str | None
    nextRefresh: str | None
    sources: list[SourceIndicator] = Field(default_factory=list)


class RefreshLogEntry(BaseModel):
    timestamp: str
    row_count: int
    source_counts: dict[str, int]
    status: LogStatus
    warnings: list[str] = Field(default_factory=list)


class AskRequest(BaseModel):
    question: str


class AskRow(BaseModel):
    source_type: str
    title: str
    detail: str
    extra: str


class AskResponse(BaseModel):
    question: str
    keyword: str
    rows: list[AskRow]


class RefreshResult(BaseModel):
    status: str
    row_count: int
    source_counts: dict[str, Any]
    claude_md: str
    elapsed_seconds: float
    warnings: list[str] = Field(default_factory=list)
    skill_hints: list[str] = Field(default_factory=list)
    sources_joined: int
    sql_queries: int


app = FastAPI(title="Sorelax API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _repo_root() -> Path:
    return Path(__file__).resolve().parent.parent


def _extract_keyword(question: str) -> str:
    stop = {
        "a", "an", "the", "is", "are", "what", "where", "when", "who",
        "how", "why", "about", "for", "in", "on", "at", "to", "of",
        "and", "or", "with", "from", "tell", "me", "show", "find",
    }
    words = re.findall(r"[a-zA-Z0-9_-]+", question.lower())
    meaningful = [w for w in words if w not in stop and len(w) > 2]
    return meaningful[0] if meaningful else (words[-1] if words else "project")


def _normalise_context(raw: dict[str, Any]) -> ProjectContext:
    return ProjectContext(
        active_work=[str(x) for x in raw.get("active_work") or []],
        recent_commits=[str(x) for x in raw.get("recent_commits") or []],
        open_prs=[str(x) for x in raw.get("open_prs") or []],
        sprint_goal=str(raw.get("sprint_goal") or ""),
        key_decisions=[str(x) for x in raw.get("key_decisions") or []],
        relevant_slack_threads=[str(x) for x in raw.get("relevant_slack_threads") or []],
        architecture_docs=[str(x) for x in raw.get("architecture_docs") or []],
        updated_at=str(raw.get("updated_at") or ""),
        row_count=int(raw.get("row_count") or 0),
    )


def _compute_next_refresh(last_refresh: str | None, scheduler_running: bool) -> str | None:
    if not scheduler_running or not last_refresh or last_refresh == "never":
        return None
    try:
        last_dt = date_parser.isoparse(last_refresh)
        if last_dt.tzinfo is None:
            last_dt = last_dt.replace(tzinfo=timezone.utc)
        return (last_dt + timedelta(hours=INTERVAL_HOURS)).isoformat()
    except (ValueError, TypeError):
        return None


def _resolve_agent_state(*, scheduler_running: bool, has_context: bool) -> AgentState:
    if scheduler_running:
        return "active"
    if has_context:
        return "idle"
    return "stopped"


def _source_health() -> dict[str, bool]:
    health: dict[str, bool] = {}
    for name in ("github", "linear", "slack", "notion"):
        try:
            result = subprocess.run(
                ["coral", "source", "list"],
                capture_output=True,
                text=True,
                timeout=15,
            )
            out = (result.stdout + result.stderr).lower()
            health[name] = name in out and result.returncode == 0
        except (subprocess.TimeoutExpired, FileNotFoundError):
            health[name] = False
    return health


def _latest_source_counts() -> dict[str, int]:
    entries = load_logs(limit=1)
    if not entries:
        return {}
    raw = entries[-1].get("source_counts") or {}
    return {k: int(v) for k, v in raw.items() if isinstance(v, (int, float))}


def _build_source_indicators() -> list[SourceIndicator]:
    health = _source_health()
    counts = _latest_source_counts()
    specs = (
        ("github", "GitHub", ("github_commits", "github_prs")),
        ("linear", "Linear", ("linear_issues",)),
        ("slack", "Slack", ("slack_messages",)),
        ("notion", "Notion", ("notion_docs",)),
    )
    indicators: list[SourceIndicator] = []
    for source_id, label, keys in specs:
        total = sum(counts.get(key, 0) for key in keys)
        indicators.append(
            SourceIndicator(
                id=source_id,
                name=label,
                healthy=health.get(source_id, False),
                count=total,
            )
        )
    return indicators


def _build_dashboard_status() -> DashboardStatus:
    ctx = load_context()
    has_context = ctx is not None
    last_refresh = ctx.get("updated_at") if ctx else None

    pid = read_pid()
    scheduler_running = bool(pid and _pid_running(pid))

    return DashboardStatus(
        agentState=_resolve_agent_state(
            scheduler_running=scheduler_running,
            has_context=has_context,
        ),
        schedulerRunning=scheduler_running,
        lastRefresh=last_refresh,
        nextRefresh=_compute_next_refresh(last_refresh, scheduler_running),
        sources=_build_source_indicators(),
    )


def _normalise_log_entry(raw: dict[str, Any]) -> RefreshLogEntry:
    status = raw.get("status", "ok")
    if status not in ("ok", "error"):
        status = "error" if raw.get("warnings") else "ok"
    source_counts = raw.get("source_counts") or {}
    return RefreshLogEntry(
        timestamp=str(raw.get("timestamp") or ""),
        row_count=int(raw.get("row_count") or 0),
        source_counts={k: int(v) for k, v in source_counts.items() if isinstance(v, (int, float))},
        status=status,  # type: ignore[arg-type]
        warnings=[str(w) for w in raw.get("warnings") or []],
    )


def _normalise_ask_rows(rows: list[dict[str, Any]]) -> list[AskRow]:
    normalised: list[AskRow] = []
    for row in rows:
        normalised.append(
            AskRow(
                source_type=str(row.get("source_type") or ""),
                title=str(row.get("title") or ""),
                detail=str(row.get("detail") or ""),
                extra=str(row.get("extra") or ""),
            )
        )
    return normalised


def _refresh_result_from_dict(raw: dict[str, Any]) -> RefreshResult:
    return RefreshResult(
        status=str(raw.get("status") or "error"),
        row_count=int(raw.get("row_count") or 0),
        source_counts=raw.get("source_counts") or {},
        claude_md=str(raw.get("claude_md") or ""),
        elapsed_seconds=float(raw.get("elapsed_seconds") or 0),
        warnings=[str(w) for w in raw.get("warnings") or []],
        skill_hints=[str(h) for h in raw.get("skill_hints") or []],
        sources_joined=int(raw.get("sources_joined") or 0),
        sql_queries=int(raw.get("sql_queries") or 0),
    )


def _sse(event: str, payload: dict[str, Any]) -> str:
    return f"event: {event}\ndata: {json.dumps(payload, default=str)}\n\n"


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/scheduler/start")
def scheduler_start() -> dict[str, bool | int | None]:
    pid = read_pid()
    if pid and _pid_running(pid):
        raise HTTPException(status_code=409, detail=f"Scheduler already running (PID {pid})")

    env = os.environ.copy()
    env["PYTHONPATH"] = str(_repo_root())
    subprocess.Popen(
        [sys.executable, "-m", "sorelax_cli.main", "start"],
        cwd=str(_repo_root()),
        env=env,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        start_new_session=True,
    )

    import time

    time.sleep(0.5)
    new_pid = read_pid()
    if not new_pid or not _pid_running(new_pid):
        raise HTTPException(status_code=500, detail="Failed to start scheduler daemon")

    return {"ok": True, "pid": new_pid}


@app.post("/api/scheduler/stop")
def scheduler_stop() -> dict[str, bool]:
    pid = read_pid()
    if not pid or not _pid_running(pid):
        stop_daemon()
        return {"ok": True}

    stop_daemon()
    return {"ok": True}


@app.get("/api/context", response_model=ProjectContext)
def get_context() -> ProjectContext:
    ctx = load_context()
    if ctx is None:
        raise HTTPException(status_code=404, detail="No project context found. Run refresh first.")
    return _normalise_context(ctx)


@app.get("/api/status", response_model=DashboardStatus)
def get_status() -> DashboardStatus:
    return _build_dashboard_status()


@app.get("/api/logs", response_model=list[RefreshLogEntry])
def get_logs() -> list[RefreshLogEntry]:
    entries = load_logs(limit=50)
    return [_normalise_log_entry(entry) for entry in entries]


@app.post("/api/ask", response_model=AskResponse)
def ask(body: AskRequest) -> AskResponse:
    load_dotenv()
    question = body.question.strip()
    if not question:
        raise HTTPException(status_code=400, detail="question must not be empty")

    owner = os.getenv("GITHUB_OWNER")
    repo = os.getenv("GITHUB_REPO")
    if not owner or not repo:
        raise HTTPException(
            status_code=400,
            detail="Missing GITHUB_OWNER and/or GITHUB_REPO in environment",
        )

    keyword = _extract_keyword(question)
    sql = (QUERIES_DIR / "on_demand.sql").read_text(encoding="utf-8")
    sql = sql.replace("{owner}", owner).replace("{repo}", repo).replace("{keyword}", keyword)

    try:
        rows = coral_query(sql)
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    return AskResponse(
        question=question,
        keyword=keyword,
        rows=_normalise_ask_rows(rows),
    )


def _stream_refresh_subprocess() -> Iterator[str]:
    refresh_script = Path(__file__).resolve().parent / "refresh.py"
    env = os.environ.copy()
    env["PYTHONPATH"] = str(_repo_root())

    yield _sse("start", {"message": "Refresh started"})

    proc = subprocess.Popen(
        [sys.executable, str(refresh_script)],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        cwd=_repo_root(),
        env=env,
    )

    output_chunks: list[str] = []
    assert proc.stdout is not None
    for line in proc.stdout:
        output_chunks.append(line)
        stripped = line.rstrip("\n")
        if stripped:
            yield _sse("log", {"line": stripped})

    exit_code = proc.wait()
    raw_output = "".join(output_chunks).strip()

    if exit_code != 0:
        yield _sse(
            "error",
            {
                "message": raw_output or f"Refresh subprocess exited with code {exit_code}",
            },
        )
        return

    try:
        result = _refresh_result_from_dict(json.loads(raw_output))
    except json.JSONDecodeError:
        yield _sse(
            "error",
            {"message": "Refresh completed but returned invalid JSON", "raw": raw_output},
        )
        return

    yield _sse("result", result.model_dump())


@app.post("/api/refresh")
def refresh() -> StreamingResponse:
    return StreamingResponse(
        _stream_refresh_subprocess(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


def start() -> None:
    import uvicorn

    uvicorn.run("agent.api:app", host="127.0.0.1", port=8000, reload=False)


if __name__ == "__main__":
    start()
