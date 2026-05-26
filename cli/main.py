"""Typer CLI for Sorelax."""

from __future__ import annotations

import os
import re
import subprocess
import sys
import threading
import time
from pathlib import Path

import typer
from dotenv import load_dotenv

from agent.coral_client import coral_query
from agent.refresh import (
    CONTEXT_PATH,
    QUERIES_DIR,
    load_context,
    load_logs,
    run_refresh,
)
from sorelax_cli import display
from sorelax_cli.scheduler import (
    INTERVAL_HOURS,
    next_refresh_iso,
    read_pid,
    start_daemon,
    stop_daemon,
)

app = typer.Typer(
    name="sorelax",
    help="Autonomous project context agent — Coral + Gemini → CLAUDE.md",
    no_args_is_help=True,
)


def _repo_root() -> Path:
    return Path.cwd()


def _extract_keyword(question: str) -> str:
    stop = {
        "a", "an", "the", "is", "are", "what", "where", "when", "who",
        "how", "why", "about", "for", "in", "on", "at", "to", "of",
        "and", "or", "with", "from", "tell", "me", "show", "find",
    }
    words = re.findall(r"[a-zA-Z0-9_-]+", question.lower())
    meaningful = [w for w in words if w not in stop and len(w) > 2]
    return meaningful[0] if meaningful else (words[-1] if words else "project")


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
            health[name.capitalize()] = name in out and result.returncode == 0
        except (subprocess.TimeoutExpired, FileNotFoundError):
            health[name.capitalize()] = False
    return health


@app.command()
def refresh() -> None:
    """Run full Coral → Gemini → CLAUDE.md pipeline."""
    display.show_banner()
    sources = ["GitHub", "Linear", "Slack", "Notion"]

    try:
        result_box: dict = {}
        error_box: list[BaseException] = []
        running = threading.Event()
        running.set()

        def _work() -> None:
            try:
                result_box["result"] = run_refresh(output_dir=_repo_root())
            except BaseException as exc:
                error_box.append(exc)
            finally:
                running.clear()

        worker = threading.Thread(target=_work, daemon=True)
        worker.start()
        display.animate_while_running(sources, running.is_set)
        worker.join()

        if error_box:
            raise error_box[0]

        result = result_box["result"]
        elapsed = result.get("elapsed_seconds", 0)
        stats = result.get("source_counts", {})
        display.show_refresh_progress(
            sources,
            stats,
            joined_summary=(
                f"Joined {result['sources_joined']} sources · "
                f"{result['row_count']} rows · "
                f"{result['sql_queries']} SQL query · {elapsed}s"
            ),
        )

        if result.get("warnings"):
            display.show_warnings(result["warnings"])

        display.show_summarise_progress()
        display.show_context_snapshot(result["context"])
        display.show_refresh_footer()
        display.show_skill_refinement(result.get("skill_hints", []))

    except ValueError as exc:
        display.show_error("Configuration error", str(exc))
        raise typer.Exit(1) from exc
    except RuntimeError as exc:
        display.show_error("Coral error", str(exc))
        raise typer.Exit(1) from exc
    except Exception as exc:
        display.show_error("Refresh failed", str(exc))
        raise typer.Exit(1) from exc


@app.command()
def ask(question: str = typer.Argument(..., help="Natural-language question")) -> None:
    """Run on-demand Coral SQL for a keyword from the question."""
    load_dotenv()
    display.show_banner()

    owner = os.getenv("GITHUB_OWNER")
    repo = os.getenv("GITHUB_REPO")
    if not owner or not repo:
        display.show_error(
            "Configuration error",
            "Missing GITHUB_OWNER and/or GITHUB_REPO in .env",
        )
        raise typer.Exit(1)

    keyword = _extract_keyword(question)
    sql_path = QUERIES_DIR / "on_demand.sql"
    sql = sql_path.read_text(encoding="utf-8")
    sql = sql.replace("{owner}", owner).replace("{repo}", repo).replace("{keyword}", keyword)

    try:
        rows = coral_query(sql)
        display.show_ask_result(question, rows)
        display.console.print(f"\n[dim]Keyword: {keyword}[/dim]")
    except RuntimeError as exc:
        display.show_error("Coral error", str(exc))
        raise typer.Exit(1) from exc


@app.command()
def status() -> None:
    """Show last refresh, scheduler, and source health."""
    display.show_banner()
    ctx = load_context()
    last = ctx.get("updated_at", "never") if ctx else "never"

    pid = read_pid()
    sched = f"running (PID {pid})" if pid else "stopped"
    next_r = next_refresh_iso() if pid else f"manual / every {INTERVAL_HOURS}h when daemon runs"

    display.show_status(
        {
            "last_refresh": last,
            "next_refresh": next_r,
            "scheduler": sched,
            "context_path": str(CONTEXT_PATH),
            "sources": _source_health(),
        }
    )


@app.command()
def logs() -> None:
    """Show last 10 refresh log entries."""
    display.show_banner()
    display.show_logs(load_logs(10))


@app.command()
def start() -> None:
    """Start background daemon (refresh every 6 hours)."""
    start_daemon()


@app.command()
def stop() -> None:
    """Stop background daemon."""
    stop_daemon()


def main() -> None:
    app()


if __name__ == "__main__":
    main()
