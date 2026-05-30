"""Launch the Sorelax dashboard website (Vite dev server)."""

from __future__ import annotations

import shutil
import signal
import subprocess
import sys
import threading
import time
import webbrowser
from pathlib import Path

import typer


def _repo_root() -> Path:
    return Path(__file__).resolve().parent.parent


def _website_dir() -> Path:
    website = _repo_root() / "website"
    if not website.is_dir():
        typer.echo(
            f"Cannot find website/ at {website}. "
            "Run sorelax-website from an installed Sorelax checkout.",
            err=True,
        )
        raise typer.Exit(1)
    return website


def _ensure_deps(website: Path) -> None:
    if (website / "node_modules").is_dir():
        return
    if not shutil.which("npm"):
        typer.echo("npm is required. Install Node.js and try again.", err=True)
        raise typer.Exit(1)
    typer.echo("Installing frontend dependencies (first run)...")
    subprocess.run(["npm", "install"], cwd=website, check=True)


def _launch(
    port: int = typer.Option(5173, "--port", "-p", help="Vite dev server port"),
    host: str = typer.Option("127.0.0.1", "--host", help="Bind address"),
    no_open: bool = typer.Option(False, "--no-open", help="Do not open the browser"),
) -> None:
    """Start the dashboard and open it in your default browser."""
    website = _website_dir()
    _ensure_deps(website)

    if not shutil.which("npm"):
        typer.echo("npm is required. Install Node.js and try again.", err=True)
        raise typer.Exit(1)

    url = f"http://{host}:{port}/dashboard"
    typer.echo(f"\n  Sorelax Website → {url}\n")
    typer.echo("  Press Ctrl+C to stop.\n")

    if not no_open:

        def _open_browser() -> None:
            time.sleep(1.8)
            webbrowser.open(url)

        threading.Thread(target=_open_browser, daemon=True).start()

    proc = subprocess.Popen(
        [
            "npm",
            "run",
            "dev",
            "--",
            "--host",
            host,
            "--port",
            str(port),
            "--strictPort",
        ],
        cwd=website,
    )

    def _handle_signal(_signum: int, _frame: object) -> None:
        proc.send_signal(signal.SIGINT)

    signal.signal(signal.SIGINT, _handle_signal)
    signal.signal(signal.SIGTERM, _handle_signal)

    sys.exit(proc.wait())


def main() -> None:
    typer.run(_launch)


if __name__ == "__main__":
    main()
