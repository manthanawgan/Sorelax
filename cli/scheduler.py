"""Background scheduler — refresh every 6 hours."""

from __future__ import annotations

import os
import signal
import sys
from datetime import datetime, timezone
from pathlib import Path

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from agent.refresh import run_refresh
from sorelax_cli import display

PID_FILE = Path.home() / ".sorelax" / "sorelax.pid"
INTERVAL_HOURS = 6


def _pid_running(pid: int) -> bool:
    try:
        os.kill(pid, 0)
        return True
    except OSError:
        return False


def read_pid() -> int | None:
    if not PID_FILE.exists():
        return None
    try:
        return int(PID_FILE.read_text().strip())
    except ValueError:
        return None


def write_pid(pid: int) -> None:
    PID_FILE.parent.mkdir(parents=True, exist_ok=True)
    PID_FILE.write_text(str(pid))


def remove_pid() -> None:
    if PID_FILE.exists():
        PID_FILE.unlink()


def next_refresh_iso() -> str | None:
    """Read scheduler state from a simple marker file if daemon is running."""
    pid = read_pid()
    if pid and _pid_running(pid):
        return f"~{INTERVAL_HOURS}h from last daemon tick (PID {pid})"
    return None


def _job_refresh() -> None:
    try:
        run_refresh()
    except Exception as exc:
        display.show_error("Scheduled refresh failed", str(exc))


def start_daemon() -> None:
    existing = read_pid()
    if existing and _pid_running(existing):
        display.show_error("Already running", f"Sorelax daemon PID {existing}")
        sys.exit(1)

    scheduler = BackgroundScheduler()
    scheduler.add_job(
        _job_refresh,
        trigger=IntervalTrigger(hours=INTERVAL_HOURS),
        id="sorelax_refresh",
        next_run_time=datetime.now(timezone.utc),
    )
    scheduler.start()
    write_pid(os.getpid())
    display.show_banner()
    display.console.print(
        f"[green]Daemon started[/green] (PID {os.getpid()}). "
        f"Refresh every {INTERVAL_HOURS}h. Ctrl+C to stop."
    )
    try:
        signal.pause()
    except AttributeError:
        import time

        while True:
            time.sleep(3600)
    finally:
        scheduler.shutdown(wait=False)
        remove_pid()


def stop_daemon() -> None:
    pid = read_pid()
    if not pid:
        display.console.print("[yellow]No PID file — daemon not running?[/yellow]")
        return
    if not _pid_running(pid):
        remove_pid()
        display.console.print("[yellow]Stale PID file removed.[/yellow]")
        return
    os.kill(pid, signal.SIGTERM)
    remove_pid()
    display.console.print(f"[green]Stopped daemon[/green] (PID {pid})")
