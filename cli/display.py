"""Rich terminal UI for Sorelax."""

from __future__ import annotations

import time
from collections.abc import Callable
from typing import Any

from rich import box
from rich.console import Console
from rich.panel import Panel
from rich.progress import BarColumn, Progress, SpinnerColumn, TextColumn
from rich.table import Table
from rich.text import Text

console = Console()

BANNER = """
╔══════════════════════════════════════════════════════════╗
║                      SORELAX v1.0                        ║
║         Autonomous Project Context Agent                 ║
╚══════════════════════════════════════════════════════════╝
"""


def show_banner() -> None:
    console.print(BANNER, style="bold cyan")


def show_error(title: str, message: str) -> None:
    console.print(Panel(message, title=title, border_style="red", box=box.ROUNDED))


def animate_while_running(sources: list[str], is_running: Callable[[], bool]) -> None:
    """Show filling progress bars while ``is_running()`` is true."""
    console.print("\n  [dim]Querying sources via Coral SQL...[/dim]\n")
    pct = 0
    while is_running():
        pct = min(pct + 8, 95)
        with Progress(
            TextColumn("[bold]{task.fields[name]}[/bold]"),
            BarColumn(bar_width=40, complete_style="cyan"),
            console=console,
            transient=True,
        ) as progress:
            for src in sources:
                progress.add_task("", name=f"◆ {src:<10}", completed=pct)
        time.sleep(0.15)


def show_refresh_progress(
    sources: list[str],
    source_stats: dict[str, Any] | None = None,
    *,
    joined_summary: str | None = None,
) -> None:
    """Animated progress bars per source (call before/during query)."""
    console.print("\n  [dim]Querying sources via Coral SQL...[/dim]\n")
    stats = source_stats or {}

    labels = {
        "GitHub": _github_line(stats),
        "Linear": _linear_line(stats),
        "Slack": _slack_line(stats),
        "Notion": _notion_line(stats),
    }

    with Progress(
        SpinnerColumn(),
        TextColumn("[bold]{task.fields[name]}[/bold]"),
        BarColumn(bar_width=40, complete_style="green"),
        TextColumn("{task.fields[detail]}"),
        console=console,
        transient=True,
    ) as progress:
        tasks = []
        for src in sources:
            t = progress.add_task("", name=f"◆ {src:<10}", detail="", total=100)
            tasks.append((src, t))

        for src, tid in tasks:
            for pct in range(0, 101, 20):
                progress.update(tid, completed=pct, detail="")
                time.sleep(0.04)
            detail = labels.get(src, "✓")
            progress.update(tid, completed=100, detail=f"  ✓  {detail}")

    if joined_summary:
        console.print(f"\n  [green]{joined_summary}[/green]\n")


def _github_line(stats: dict[str, Any]) -> str:
    c = stats.get("github_commits", 0)
    p = stats.get("github_prs", 0)
    return f"{c} commits · {p} open PRs"


def _linear_line(stats: dict[str, Any]) -> str:
    n = stats.get("linear_issues", 0)
    sprint = (stats.get("sprint_names") or ["—"])[0] if stats.get("sprint_names") else "—"
    return f"{n} active issues · Sprint {sprint}"


def _slack_line(stats: dict[str, Any]) -> str:
    m = stats.get("slack_messages", 0)
    ch = stats.get("slack_channels", 0)
    return f"{m} messages · {ch} channels"


def _notion_line(stats: dict[str, Any]) -> str:
    n = stats.get("notion_docs", 0)
    return f"{n} architecture docs"


def show_summarise_progress() -> None:
    console.print("─" * 58)
    with Progress(
        TextColumn("  Summarising with Gemini..."),
        BarColumn(bar_width=40, complete_style="green"),
        TextColumn("✓"),
        console=console,
        transient=True,
    ) as progress:
        t = progress.add_task("", total=100)
        for pct in range(0, 101, 25):
            progress.update(t, completed=pct)
            time.sleep(0.08)
        progress.update(t, completed=100)
    console.print("─" * 58)


def show_context_snapshot(context_json: dict[str, Any]) -> None:
    console.print("\n  [bold]Context snapshot ready:[/bold]\n")

    def line(label: str, key: str, *, join: str = " · ") -> None:
        val = context_json.get(key)
        if isinstance(val, list):
            text = join.join(val[:4]) if val else "—"
        else:
            text = str(val) if val else "—"
        console.print(f"  [cyan]{label:<14}[/cyan] → {text}")

    line("Active work", "active_work", join=", ")
    line("Open PRs", "open_prs")
    line("Sprint goal", "sprint_goal", join="")
    decisions = context_json.get("key_decisions", [])
    console.print(
        f"  [cyan]{'Key decision':<14}[/cyan] → "
        f"{decisions[0] if decisions else '—'}"
    )
    line("Arch docs", "architecture_docs", join=", ")


def show_skill_refinement(hints: list[str]) -> None:
    if not hints:
        return
    console.print("\n  [bold]Skill refinement:[/bold]")
    for h in hints:
        console.print(f"  [dim]→[/dim] {h}")


def show_refresh_footer() -> None:
    console.print("\n  [green]✓[/green]  CLAUDE.md written")
    console.print("  [green]✓[/green]  Memory updated")
    console.print("  [green]✓[/green]  Next refresh in [bold]6h 00m[/bold]")
    console.print("─" * 58)


def show_status(status_dict: dict[str, Any]) -> None:
    table = Table(title="Sorelax Status", box=box.ROUNDED, show_header=True)
    table.add_column("Field", style="cyan")
    table.add_column("Value")

    table.add_row("Last refresh", status_dict.get("last_refresh", "never"))
    table.add_row("Next refresh", status_dict.get("next_refresh", "—"))
    table.add_row("Scheduler", status_dict.get("scheduler", "stopped"))
    table.add_row("Context file", status_dict.get("context_path", "—"))

    console.print(table)
    console.print()

    health = status_dict.get("sources", {})
    ht = Table(title="Source health", box=box.SIMPLE)
    ht.add_column("", width=3)
    ht.add_column("Source")
    ht.add_column("Status")
    for name, ok in health.items():
        dot = "[green]●[/green]" if ok else "[red]●[/red]"
        ht.add_row(dot, name, "healthy" if ok else "unavailable")
    console.print(ht)


def show_ask_result(question: str, rows: list[dict[str, Any]]) -> None:
    console.print(Panel(question, title="Question", border_style="blue"))
    if not rows:
        console.print("[yellow]No matching rows.[/yellow]")
        return

    table = Table(box=box.ROUNDED, show_header=True, header_style="bold")
    keys = list(rows[0].keys())
    for k in keys:
        table.add_column(k)
    for row in rows[:30]:
        table.add_row(*[str(row.get(k, ""))[:80] for k in keys])
    console.print(table)


def show_logs(entries: list[dict[str, Any]]) -> None:
    if not entries:
        console.print("[dim]No log entries yet. Run sorelax refresh.[/dim]")
        return
    table = Table(title="Recent refresh log", box=box.ROUNDED)
    table.add_column("Timestamp")
    table.add_column("Rows", justify="right")
    table.add_column("Status")
    table.add_column("Warnings")
    for e in reversed(entries):
        table.add_row(
            e.get("timestamp", ""),
            str(e.get("row_count", "")),
            e.get("status", ""),
            ", ".join(e.get("warnings", [])) or "—",
        )
    console.print(table)


def show_warnings(warnings: list[str]) -> None:
    for w in warnings:
        console.print(f"  [yellow]⚠[/yellow]  {w}")
