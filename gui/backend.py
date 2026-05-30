"""GUI Backend for Sorelax — Standalone Python module wrapping Sorelax CLI and setup actions.

This module is pure Python, fully testable standalone, and exposes callbacks for
stdout/stderr streaming of long-running operations.
"""

from __future__ import annotations

import json
import os
import shutil
import signal
import subprocess
import sys
import time
from pathlib import Path
from typing import Any, Callable

# Robust imports supporting both direct execution and package imports
try:
    from sorelax_cli.scheduler import read_pid, _pid_running, next_refresh_iso, INTERVAL_HOURS
except ImportError:
    try:
        from cli.scheduler import read_pid, _pid_running, next_refresh_iso, INTERVAL_HOURS
    except ImportError:
        # Fallback values if CLI scheduler package is not in python path
        INTERVAL_HOURS = 6
        def read_pid() -> int | None:
            pid_file = Path.home() / ".sorelax" / "sorelax.pid"
            if not pid_file.exists():
                return None
            try:
                return int(pid_file.read_text().strip())
            except ValueError:
                return None
        def _pid_running(pid: int) -> bool:
            try:
                os.kill(pid, 0)
                return True
            except OSError:
                return False
        def next_refresh_iso() -> str | None:
            pid = read_pid()
            if pid and _pid_running(pid):
                return f"~{INTERVAL_HOURS}h from last daemon tick (PID {pid})"
            return None

try:
    from agent.refresh import CONTEXT_PATH, LOG_PATH
except ImportError:
    CONTEXT_PATH = Path.home() / ".sorelax" / "project_context.json"
    LOG_PATH = Path.home() / ".sorelax" / "project_log.jsonl"


def _repo_root() -> Path:
    """Returns the absolute path to the repository root directory."""
    return Path(__file__).resolve().parent.parent


def _run_cmd_stream(
    cmd: list[str] | str,
    line_callback: Callable[[str], None],
    cwd: Path | None = None,
    env: dict[str, str] | None = None,
) -> int:
    """Spawns a subprocess with stdout/stderr merged and streams lines to callback."""
    shell = isinstance(cmd, str)
    proc = subprocess.Popen(
        cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        shell=shell,
        cwd=cwd,
        env=env,
        bufsize=1,  # Line buffered
    )
    
    if proc.stdout:
        for line in proc.stdout:
            line_callback(line.rstrip("\n"))
            
    return proc.wait()


def check_dependencies() -> dict[str, dict[str, Any]]:
    """Checks for curl, pip, and coral presence and their versions.

    Returns:
        dict: A dictionary containing the status (installed, path, version) for each tool.
    """
    tools = ["curl", "pip", "coral"]
    result = {}
    for tool in tools:
        path = shutil.which(tool)
        installed = path is not None
        version = None
        if installed:
            try:
                proc = subprocess.run(
                    [tool, "--version"],
                    capture_output=True,
                    text=True,
                    timeout=5,
                )
                if proc.returncode == 0:
                    version = proc.stdout.strip().splitlines()[0]
            except Exception:
                pass
        result[tool] = {
            "installed": installed,
            "path": path,
            "version": version,
        }
    return result


def save_env(tokens: dict[str, str]) -> None:
    """Rewrites the .env file in the repository root and re-runs Coral source registration.

    Args:
        tokens: Dictionary of keys and values to save.
    """
    root = _repo_root()
    env_file = root / ".env"

    keys = [
        "GITHUB_OWNER",
        "GITHUB_REPO",
        "GITHUB_TOKEN",
        "LINEAR_API_KEY",
        "SLACK_TOKEN",
        "NOTION_TOKEN",
        "GEMINI_API_KEY",
    ]

    content = ""
    for key in keys:
        val = tokens.get(key, "")
        content += f"{key}={val}\n"

    env_file.write_text(content, encoding="utf-8")
    env_file.chmod(0o600)

    # Re-runs coral source add for the 4 key integrations
    sources = ["github", "linear", "slack", "notion"]
    token_mapping = {
        "github": "GITHUB_TOKEN",
        "linear": "LINEAR_API_KEY",
        "slack": "SLACK_TOKEN",
        "notion": "NOTION_TOKEN",
    }

    env = os.environ.copy()
    env.update(tokens)

    for name in sources:
        token = tokens.get(token_mapping[name], "")
        if token:
            try:
                res = subprocess.run(
                    ["coral", "source", "add", name, "--token", token],
                    capture_output=True,
                    text=True,
                    env=env,
                )
                if res.returncode == 0:
                    continue
            except Exception:
                pass
        try:
            subprocess.run(
                ["coral", "source", "add", name],
                capture_output=True,
                text=True,
                env=env,
            )
        except Exception:
            pass


def run_install(tokens: dict[str, str], line_callback: Callable[[str], None]) -> bool:
    """Performs the full installation/setup pipeline mirroring install.sh.

    Steps:
      1. Installs the Python package in editable mode (pip install -e .)
      2. Writes the .env file with supplied tokens
      3. Adds Coral sources (github, linear, slack, notion)
      4. Sets up Hermes Agent (setup_hermes.sh)
      5. Registers Sorelax cron in Hermes (register_cron.sh)
      6. Runs the first context refresh

    Args:
        tokens: Dictionary of Sorelax integration tokens.
        line_callback: Callback function receiving stdout/stderr lines.

    Returns:
        bool: True if installation was successful, False otherwise.
    """
    root = _repo_root()
    env = os.environ.copy()
    env.update(tokens)

    # 1. pip install -e .
    line_callback(">>> [1/6] Installing Sorelax Python package in editable mode...")
    code = _run_cmd_stream(
        [sys.executable, "-m", "pip", "install", "-e", "."],
        line_callback,
        cwd=root,
    )
    if code != 0:
        line_callback(f">>> Error: pip install failed with exit code {code}")
        return False

    # 2. Writes .env
    line_callback(">>> [2/6] Writing .env configuration file...")
    try:
        save_env(tokens)
        line_callback(">>> Successfully wrote .env configuration.")
    except Exception as exc:
        line_callback(f">>> Error writing .env: {exc}")
        return False

    # 3. Add Coral sources
    line_callback(">>> [3/6] Configuring Coral sources...")
    sources = ["github", "linear", "slack", "notion"]
    token_mapping = {
        "github": "GITHUB_TOKEN",
        "linear": "LINEAR_API_KEY",
        "slack": "SLACK_TOKEN",
        "notion": "NOTION_TOKEN",
    }
    for name in sources:
        token = tokens.get(token_mapping[name], "")
        line_callback(f">>> Registering Coral source: {name}...")
        if token:
            cmd = ["coral", "source", "add", name, "--token", token]
            code = _run_cmd_stream(cmd, line_callback, env=env)
            if code != 0:
                line_callback(f">>> Warning: Failed to add {name} with token (code {code}), trying fallback...")
                _run_cmd_stream(["coral", "source", "add", name], line_callback, env=env)
        else:
            _run_cmd_stream(["coral", "source", "add", name], line_callback, env=env)

    # 4. setup_hermes.sh
    line_callback(">>> [4/6] Setting up Hermes Agent...")
    hermes_script = root / "hermes" / "setup_hermes.sh"
    if hermes_script.exists():
        code = _run_cmd_stream(
            ["bash", str(hermes_script)],
            line_callback,
            cwd=root,
            env=env,
        )
        if code != 0:
            line_callback(f">>> Warning: setup_hermes.sh completed with non-zero exit code {code}")
    else:
        line_callback(">>> Warning: setup_hermes.sh not found, skipping Hermes setup.")

    # 5. register_cron.sh
    line_callback(">>> [5/6] Registering Sorelax cron job inside Hermes Agent...")
    register_script = root / "hermes" / "register_cron.sh"
    if register_script.exists():
        code = _run_cmd_stream(
            ["bash", str(register_script)],
            line_callback,
            cwd=root,
            env=env,
        )
        if code != 0:
            line_callback(f">>> Warning: register_cron.sh failed with exit code {code}")
    else:
        line_callback(">>> Warning: register_cron.sh not found, skipping cron registration.")

    # 6. Run first refresh
    line_callback(">>> [6/6] Running first context refresh pipeline...")
    refresh_code = run_refresh(line_callback)
    if refresh_code == 0:
        line_callback(">>> Sorelax installation and setup completed successfully!")
        return True
    else:
        line_callback(f">>> Warning: First context refresh finished with non-zero code {refresh_code}")
        return True


def run_refresh(line_callback: Callable[[str], None]) -> int:
    """Runs the full refresh pipeline via the Sorelax CLI.

    Args:
        line_callback: Callback function receiving stdout/stderr lines.

    Returns:
        int: Subprocess exit code.
    """
    root = _repo_root()
    env = os.environ.copy()
    env["PYTHONPATH"] = str(root)
    return _run_cmd_stream(
        [sys.executable, "-m", "sorelax_cli.main", "refresh"],
        line_callback,
        cwd=root,
        env=env,
    )


def run_ask(query: str, line_callback: Callable[[str], None]) -> int:
    """Runs the Sorelax ask command for a given natural-language question.

    Args:
        query: Question to ask Sorelax.
        line_callback: Callback function receiving stdout/stderr lines.

    Returns:
        int: Subprocess exit code.
    """
    root = _repo_root()
    env = os.environ.copy()
    env["PYTHONPATH"] = str(root)
    return _run_cmd_stream(
        [sys.executable, "-m", "sorelax_cli.main", "ask", query],
        line_callback,
        cwd=root,
        env=env,
    )


def get_status() -> dict[str, Any]:
    """Retrieves and parses current status, scheduler, and source health.

    Returns:
        dict: Replicates Sorelax CLI status info as parsed key-value pairs.
    """
    ctx = read_context()
    last = ctx.get("updated_at", "never") if ctx else "never"

    pid = read_pid()
    sched = f"running (PID {pid})" if (pid and _pid_running(pid)) else "stopped"
    next_r = next_refresh_iso() if pid else f"manual / every {INTERVAL_HOURS}h when daemon runs"

    # Direct source health check
    health = {}
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

    return {
        "last_refresh": last,
        "next_refresh": next_r,
        "scheduler": sched,
        "context_path": str(CONTEXT_PATH),
        "sources": health,
    }


def get_logs(line_callback: Callable[[str], None]) -> None:
    """Continuously tails the Sorelax log file in a `tail -f` style.

    Runs in the current thread and can be terminated by having the callback return False.

    Args:
        line_callback: Callback receiving log lines.
    """
    # First, yield existing logs
    if LOG_PATH.exists():
        with LOG_PATH.open("r", encoding="utf-8") as f:
            lines = f.readlines()
            for line in lines:
                if line_callback(line.strip()) is False:
                    return

            # Seek to end and tail
            f.seek(0, os.SEEK_END)
            while True:
                line = f.readline()
                if not line:
                    time.sleep(0.5)
                    continue
                if line_callback(line.strip()) is False:
                    break


def read_context() -> dict[str, Any]:
    """Reads and parses Sorelax's project_context.json.

    Returns:
        dict: Parsed project context JSON or empty dict.
    """
    if not CONTEXT_PATH.exists():
        return {}
    try:
        return json.loads(CONTEXT_PATH.read_text(encoding="utf-8"))
    except Exception:
        return {}


def start_scheduler(line_callback: Callable[[str], None]) -> int:
    """Starts Sorelax background scheduler daemon and streams output.

    Args:
        line_callback: Callback function receiving stdout/stderr lines.

    Returns:
        int: Subprocess exit code.
    """
    root = _repo_root()
    env = os.environ.copy()
    env["PYTHONPATH"] = str(root)
    return _run_cmd_stream(
        [sys.executable, "-m", "sorelax_cli.main", "start"],
        line_callback,
        cwd=root,
        env=env,
    )


def stop_scheduler() -> int:
    """Stops Sorelax background scheduler daemon.

    Returns:
        int: Subprocess exit code.
    """
    root = _repo_root()
    env = os.environ.copy()
    env["PYTHONPATH"] = str(root)
    res = subprocess.run(
        [sys.executable, "-m", "sorelax_cli.main", "stop"],
        capture_output=True,
        text=True,
        cwd=root,
        env=env,
    )
    return res.returncode
